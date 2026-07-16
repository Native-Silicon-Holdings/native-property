-- =============================================================================
-- Migration 005: facial verification status/scoring moves server-side
-- =============================================================================
-- Security review of FacialAuthContext.tsx found that the client could
-- directly UPDATE its own facial_verifications row's status/score/
-- verified_at columns (RLS only checked user_id = auth.uid()), meaning a
-- user could self-approve their own facial verification without ever
-- uploading a matching video. Activity log entries for the flow were also
-- client-inserted with client-supplied `details`, so a user could forge
-- their own audit trail.
--
-- Fix: remove the client's direct UPDATE path on this table entirely and
-- move every write (video submission included) into SECURITY DEFINER
-- RPCs. Postgres RLS predicates are row-scoped, not column-scoped — a
-- policy like `USING/WITH CHECK (status = 'PENDING')` cannot stop a
-- client from writing verification_score/verified_at/failure_reason
-- while status stays PENDING, so column allow-listing via RLS alone is
-- not a safe boundary here. Activity log writes for this flow now
-- happen inside the RPCs, not from the client.
--
-- Depends on: 001, 002, 003
-- =============================================================================

-- =============================================================================
-- RLS: remove all client INSERT/UPDATE access to facial_verifications
-- =============================================================================
-- rpc_initialize_facial_verification, rpc_submit_facial_verification, and
-- rpc_complete_facial_verification (all SECURITY DEFINER, running as the
-- function owner and bypassing RLS) are now the only ways to write to
-- this table. The prior INSERT policy let a client create its own row
-- with an arbitrary status/verification_score/verified_at from the
-- start, bypassing rpc_initialize_facial_verification entirely — so it
-- is dropped along with the UPDATE policy, not narrowed.

DROP POLICY IF EXISTS "users_can_insert_own_verifications" ON native_property.facial_verifications;
DROP POLICY IF EXISTS "users_can_update_own_verifications" ON native_property.facial_verifications;

-- =============================================================================
-- RPC: submit a verification video (client-facing, replaces direct UPDATE)
-- =============================================================================
-- Sets video_url and flips status PENDING -> PROCESSING. This is the only
-- client-reachable way to move a verification out of PENDING; VERIFIED/
-- FAILED are set exclusively by rpc_complete_facial_verification below.
CREATE OR REPLACE FUNCTION native_property.rpc_submit_facial_verification(
  p_verification_id UUID,
  p_video_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = native_property, core, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_verification RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_verification
  FROM native_property.facial_verifications
  WHERE id = p_verification_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification not found';
  END IF;

  IF v_verification.user_id != v_user_id THEN
    RAISE EXCEPTION 'You can only submit your own verification';
  END IF;

  IF v_verification.status != 'PENDING' THEN
    RAISE EXCEPTION 'Verification is not in PENDING status (current: %)', v_verification.status;
  END IF;

  IF v_verification.expires_at IS NOT NULL AND now() > v_verification.expires_at THEN
    UPDATE native_property.facial_verifications
    SET status = 'EXPIRED', updated_at = now()
    WHERE id = p_verification_id;
    RAISE EXCEPTION 'Verification session has expired';
  END IF;

  UPDATE native_property.facial_verifications
  SET video_url = p_video_url,
      status = 'PROCESSING',
      updated_at = now()
  WHERE id = p_verification_id;

  INSERT INTO native_property.activity_logs (user_id, action, module, details)
  VALUES (
    v_user_id,
    'FACIAL_VERIFICATION_VIDEO_UPLOADED',
    'FACIAL_AUTH',
    jsonb_build_object('verification_id', p_verification_id)
  );

  RETURN jsonb_build_object('verification_id', p_verification_id, 'status', 'PROCESSING');
END;
$$;

-- =============================================================================
-- RPC: complete a verification (system/service-role only — NOT client-facing)
-- =============================================================================
-- Sets the final VERIFIED/FAILED outcome and score. This must be called by
-- the face-matching service/backend job using the service role, not by the
-- end user's session — the REVOKE below (from PUBLIC, not just
-- authenticated/anon) enforces that a logged-in user cannot self-approve
-- their own verification. New Postgres functions grant EXECUTE to PUBLIC
-- by default, and authenticated/anon inherit through that PUBLIC grant,
-- so revoking only from authenticated/anon leaves the PUBLIC grant intact
-- and the function callable anyway; REVOKE FROM PUBLIC closes that.
CREATE OR REPLACE FUNCTION native_property.rpc_complete_facial_verification(
  p_verification_id UUID,
  p_status native_property.facial_verification_status,
  p_verification_score DOUBLE PRECISION DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = native_property, core, pg_temp
AS $$
DECLARE
  v_verification RECORD;
BEGIN
  IF p_status NOT IN ('VERIFIED', 'FAILED') THEN
    RAISE EXCEPTION 'p_status must be VERIFIED or FAILED';
  END IF;

  SELECT * INTO v_verification
  FROM native_property.facial_verifications
  WHERE id = p_verification_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification not found';
  END IF;

  IF v_verification.status != 'PROCESSING' THEN
    RAISE EXCEPTION 'Verification is not in PROCESSING status (current: %)', v_verification.status;
  END IF;

  UPDATE native_property.facial_verifications
  SET status = p_status,
      verification_score = p_verification_score,
      failure_reason = p_failure_reason,
      verified_at = CASE WHEN p_status = 'VERIFIED' THEN now() ELSE NULL END,
      updated_at = now()
  WHERE id = p_verification_id;

  INSERT INTO native_property.activity_logs (user_id, action, module, details)
  VALUES (
    v_verification.user_id,
    'FACIAL_VERIFICATION_' || p_status,
    'FACIAL_AUTH',
    jsonb_build_object(
      'verification_id', p_verification_id,
      'verification_score', p_verification_score
    )
  );

  RETURN jsonb_build_object('verification_id', p_verification_id, 'status', p_status);
END;
$$;

-- Only the service role (face-matching worker/backend job) may complete a
-- verification. Ordinary authenticated users must not be able to call this.
-- REVOKE FROM PUBLIC is required: PostgreSQL grants EXECUTE on new
-- functions to PUBLIC by default, and both authenticated and anon are
-- members of PUBLIC, so revoking only from those two roles leaves the
-- PUBLIC grant in place and the function still callable by anyone.
REVOKE EXECUTE ON FUNCTION native_property.rpc_complete_facial_verification FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION native_property.rpc_complete_facial_verification FROM authenticated;
REVOKE EXECUTE ON FUNCTION native_property.rpc_complete_facial_verification FROM anon;
GRANT EXECUTE ON FUNCTION native_property.rpc_complete_facial_verification TO service_role;

-- =============================================================================
-- RPC: initialize a verification session (client-facing, replaces direct
-- INSERT so the activity log entry can't be forged with arbitrary details)
-- =============================================================================
CREATE OR REPLACE FUNCTION native_property.rpc_initialize_facial_verification()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = native_property, core, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_verification_id UUID;
  v_expires_at TIMESTAMPTZ := now() + interval '15 minutes';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  DELETE FROM native_property.facial_verifications
  WHERE user_id = v_user_id
    AND status IN ('PENDING', 'EXPIRED');

  INSERT INTO native_property.facial_verifications (user_id, status, expires_at)
  VALUES (v_user_id, 'PENDING', v_expires_at)
  RETURNING id INTO v_verification_id;

  INSERT INTO native_property.activity_logs (user_id, action, module, details)
  VALUES (
    v_user_id,
    'FACIAL_VERIFICATION_INITIALIZED',
    'FACIAL_AUTH',
    jsonb_build_object('verification_id', v_verification_id)
  );

  RETURN jsonb_build_object(
    'verification_id', v_verification_id,
    'status', 'PENDING',
    'expires_at', v_expires_at
  );
END;
$$;

-- =============================================================================
-- STORAGE: facial-videos bucket must be private, not public
-- =============================================================================
-- Biometric video must never be reachable via a public getPublicUrl() link.
-- The frontend must switch from supabase.storage.from('facial-videos').
-- getPublicUrl() to .createSignedUrl() with a short expiry, and this bucket
-- must be created/configured with public = false.
UPDATE storage.buckets SET public = false WHERE id = 'facial-videos';
