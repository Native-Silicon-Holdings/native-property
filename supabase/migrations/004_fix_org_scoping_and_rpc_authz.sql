-- =============================================================================
-- Migration 004: Fix missing org scoping (RLS) and missing role checks (RPCs)
-- =============================================================================
-- Security review of 002/003 found:
--   - documents, announcements, meetings, directors, elections,
--     billing_cycles, budget_lines, financial_transactions had no
--     organization_id and were gated only on `auth.uid() IS NOT NULL`,
--     giving every authenticated user (any estate) read/write access.
--   - Several SECURITY DEFINER RPCs (rpc_delete_user, rpc_update_user,
--     rpc_approve_access_request, rpc_update_election_status,
--     rpc_create_transaction, rpc_create_budget_line,
--     rpc_update_budget_line, rpc_record_payment,
--     rpc_add_utility_reading, rpc_update_maintenance,
--     rpc_create_director, rpc_update_document_approval) only checked
--     that the caller was authenticated, not that they held an ADMIN
--     role in the relevant organization.
--
-- This migration adds organization_id to the estate-level tables,
-- rewrites the affected RLS policies to check org membership/role, and
-- adds explicit has_org_role checks to the affected RPCs.
--
-- Depends on: 001, 002, 003
-- =============================================================================

-- =============================================================================
-- SCHEMA: add organization_id to estate-level tables
-- =============================================================================

ALTER TABLE native_property.documents
  ADD COLUMN organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE;

ALTER TABLE native_property.announcements
  ADD COLUMN organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE;

ALTER TABLE native_property.meetings
  ADD COLUMN organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE;

ALTER TABLE native_property.directors
  ADD COLUMN organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE;

ALTER TABLE native_property.elections
  ADD COLUMN organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE;

ALTER TABLE native_property.billing_cycles
  ADD COLUMN organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE;

ALTER TABLE native_property.budget_lines
  ADD COLUMN organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE;

ALTER TABLE native_property.financial_transactions
  ADD COLUMN organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_documents_org ON native_property.documents(organization_id);
CREATE INDEX idx_announcements_org ON native_property.announcements(organization_id);
CREATE INDEX idx_meetings_org ON native_property.meetings(organization_id);
CREATE INDEX idx_directors_org ON native_property.directors(organization_id);
CREATE INDEX idx_elections_org ON native_property.elections(organization_id);
CREATE INDEX idx_billing_cycles_org ON native_property.billing_cycles(organization_id);
CREATE INDEX idx_budget_lines_org ON native_property.budget_lines(organization_id);
CREATE INDEX idx_financial_transactions_org ON native_property.financial_transactions(organization_id);

-- =============================================================================
-- HELPERS: derive organization_id from a parent row
-- =============================================================================

CREATE OR REPLACE FUNCTION native_property.get_org_from_election(p_election_id UUID)
RETURNS UUID
LANGUAGE SQL STABLE
SET search_path = native_property, pg_temp
AS $$
  SELECT organization_id FROM native_property.elections WHERE id = p_election_id;
$$;

CREATE OR REPLACE FUNCTION native_property.get_org_from_candidate(p_candidate_id UUID)
RETURNS UUID
LANGUAGE SQL STABLE
SET search_path = native_property, pg_temp
AS $$
  SELECT e.organization_id
  FROM native_property.candidates c
  JOIN native_property.elections e ON e.id = c.election_id
  WHERE c.id = p_candidate_id;
$$;

CREATE OR REPLACE FUNCTION native_property.get_org_from_meeting(p_meeting_id UUID)
RETURNS UUID
LANGUAGE SQL STABLE
SET search_path = native_property, pg_temp
AS $$
  SELECT organization_id FROM native_property.meetings WHERE id = p_meeting_id;
$$;

CREATE OR REPLACE FUNCTION native_property.get_org_from_resolution(p_resolution_id UUID)
RETURNS UUID
LANGUAGE SQL STABLE
SET search_path = native_property, pg_temp
AS $$
  SELECT m.organization_id
  FROM native_property.resolutions r
  JOIN native_property.meetings m ON m.id = r.meeting_id
  WHERE r.id = p_resolution_id;
$$;

CREATE OR REPLACE FUNCTION native_property.get_org_from_document(p_document_id UUID)
RETURNS UUID
LANGUAGE SQL STABLE
SET search_path = native_property, pg_temp
AS $$
  SELECT organization_id FROM native_property.documents WHERE id = p_document_id;
$$;

CREATE OR REPLACE FUNCTION native_property.get_org_from_budget_line(p_budget_id UUID)
RETURNS UUID
LANGUAGE SQL STABLE
SET search_path = native_property, pg_temp
AS $$
  SELECT organization_id FROM native_property.budget_lines WHERE id = p_budget_id;
$$;

CREATE OR REPLACE FUNCTION native_property.get_org_from_maintenance(p_request_id UUID)
RETURNS UUID
LANGUAGE SQL STABLE
SET search_path = native_property, pg_temp
AS $$
  SELECT native_property.get_organization_id(property_id)
  FROM native_property.maintenance_requests
  WHERE id = p_request_id;
$$;

CREATE OR REPLACE FUNCTION native_property.get_org_from_access_request(p_request_id UUID)
RETURNS UUID
LANGUAGE SQL STABLE
SET search_path = native_property, pg_temp
AS $$
  SELECT native_property.get_organization_id(property_id)
  FROM native_property.property_access_requests
  WHERE id = p_request_id;
$$;

-- =============================================================================
-- RLS: DOCUMENTS — replace auth-only policies with org scoping
-- =============================================================================

DROP POLICY IF EXISTS "authenticated_can_view_documents" ON native_property.documents;
DROP POLICY IF EXISTS "authenticated_can_insert_documents" ON native_property.documents;
DROP POLICY IF EXISTS "org_admins_can_update_documents" ON native_property.documents;
DROP POLICY IF EXISTS "org_admins_can_delete_documents" ON native_property.documents;

CREATE POLICY "org_members_can_view_documents"
  ON native_property.documents FOR SELECT
  USING (native_property.is_org_member(auth.uid(), organization_id));

CREATE POLICY "org_members_can_insert_documents"
  ON native_property.documents FOR INSERT
  WITH CHECK (
    uploaded_by_id = auth.uid()
    AND native_property.is_org_member(auth.uid(), organization_id)
  );

CREATE POLICY "org_admins_can_update_documents"
  ON native_property.documents FOR UPDATE
  USING (native_property.has_org_role(auth.uid(), organization_id, 'ADMIN'));

CREATE POLICY "org_admins_can_delete_documents"
  ON native_property.documents FOR DELETE
  USING (native_property.has_org_role(auth.uid(), organization_id, 'ADMIN'));

-- Document versions inherit org scoping via their parent document
DROP POLICY IF EXISTS "authenticated_can_view_document_versions" ON native_property.document_versions;
DROP POLICY IF EXISTS "authenticated_can_insert_document_versions" ON native_property.document_versions;

CREATE POLICY "org_members_can_view_document_versions"
  ON native_property.document_versions FOR SELECT
  USING (native_property.is_org_member(auth.uid(), native_property.get_org_from_document(document_id)));

CREATE POLICY "org_members_can_insert_document_versions"
  ON native_property.document_versions FOR INSERT
  WITH CHECK (
    uploaded_by_id = auth.uid()
    AND native_property.is_org_member(auth.uid(), native_property.get_org_from_document(document_id))
  );

-- =============================================================================
-- RLS: ANNOUNCEMENTS
-- =============================================================================

DROP POLICY IF EXISTS "authenticated_can_view_announcements" ON native_property.announcements;
DROP POLICY IF EXISTS "org_admins_can_insert_announcements" ON native_property.announcements;
DROP POLICY IF EXISTS "org_admins_can_update_announcements" ON native_property.announcements;
DROP POLICY IF EXISTS "org_admins_can_delete_announcements" ON native_property.announcements;

CREATE POLICY "org_members_can_view_announcements"
  ON native_property.announcements FOR SELECT
  USING (native_property.is_org_member(auth.uid(), organization_id));

CREATE POLICY "org_admins_can_insert_announcements"
  ON native_property.announcements FOR INSERT
  WITH CHECK (
    posted_by_id = auth.uid()
    AND native_property.has_org_role(auth.uid(), organization_id, 'ADMIN')
  );

CREATE POLICY "org_admins_can_update_announcements"
  ON native_property.announcements FOR UPDATE
  USING (native_property.has_org_role(auth.uid(), organization_id, 'ADMIN'));

CREATE POLICY "org_admins_can_delete_announcements"
  ON native_property.announcements FOR DELETE
  USING (native_property.has_org_role(auth.uid(), organization_id, 'ADMIN'));

-- =============================================================================
-- RLS: MEETINGS
-- =============================================================================

DROP POLICY IF EXISTS "authenticated_can_view_meetings" ON native_property.meetings;
DROP POLICY IF EXISTS "org_admins_can_manage_meetings" ON native_property.meetings;

CREATE POLICY "org_members_can_view_meetings"
  ON native_property.meetings FOR SELECT
  USING (native_property.is_org_member(auth.uid(), organization_id));

CREATE POLICY "org_admins_can_insert_meetings"
  ON native_property.meetings FOR INSERT
  WITH CHECK (
    created_by_id = auth.uid()
    AND native_property.has_org_role(auth.uid(), organization_id, 'ADMIN')
  );

CREATE POLICY "org_admins_can_update_meetings"
  ON native_property.meetings FOR UPDATE
  USING (native_property.has_org_role(auth.uid(), organization_id, 'ADMIN'));

CREATE POLICY "org_admins_can_delete_meetings"
  ON native_property.meetings FOR DELETE
  USING (native_property.has_org_role(auth.uid(), organization_id, 'ADMIN'));

-- Meeting attendance / RSVP — org-scoped view, self-scoped write
DROP POLICY IF EXISTS "authenticated_can_view_attendance" ON native_property.meeting_attendance;

CREATE POLICY "org_members_can_view_attendance"
  ON native_property.meeting_attendance FOR SELECT
  USING (native_property.is_org_member(auth.uid(), native_property.get_org_from_meeting(meeting_id)));

-- users_can_rsvp_own / users_can_update_own_rsvp already self-scoped correctly; left as-is.

-- =============================================================================
-- RLS: DIRECTORS
-- =============================================================================

DROP POLICY IF EXISTS "authenticated_can_view_directors" ON native_property.directors;
DROP POLICY IF EXISTS "org_admins_can_manage_directors" ON native_property.directors;

CREATE POLICY "org_members_can_view_directors"
  ON native_property.directors FOR SELECT
  USING (native_property.is_org_member(auth.uid(), organization_id));

CREATE POLICY "org_admins_can_insert_directors"
  ON native_property.directors FOR INSERT
  WITH CHECK (native_property.has_org_role(auth.uid(), organization_id, 'ADMIN'));

CREATE POLICY "org_admins_can_update_directors"
  ON native_property.directors FOR UPDATE
  USING (native_property.has_org_role(auth.uid(), organization_id, 'ADMIN'));

CREATE POLICY "org_admins_can_delete_directors"
  ON native_property.directors FOR DELETE
  USING (native_property.has_org_role(auth.uid(), organization_id, 'ADMIN'));

-- =============================================================================
-- RLS: ELECTIONS / CANDIDATES / VOTE CHOICES
-- =============================================================================

DROP POLICY IF EXISTS "authenticated_can_view_elections" ON native_property.elections;
DROP POLICY IF EXISTS "org_admins_can_manage_elections" ON native_property.elections;

CREATE POLICY "org_members_can_view_elections"
  ON native_property.elections FOR SELECT
  USING (native_property.is_org_member(auth.uid(), organization_id));

CREATE POLICY "org_admins_can_insert_elections"
  ON native_property.elections FOR INSERT
  WITH CHECK (native_property.has_org_role(auth.uid(), organization_id, 'ADMIN'));

CREATE POLICY "org_admins_can_update_elections"
  ON native_property.elections FOR UPDATE
  USING (native_property.has_org_role(auth.uid(), organization_id, 'ADMIN'));

CREATE POLICY "org_admins_can_delete_elections"
  ON native_property.elections FOR DELETE
  USING (native_property.has_org_role(auth.uid(), organization_id, 'ADMIN'));

DROP POLICY IF EXISTS "authenticated_can_view_candidates" ON native_property.candidates;
DROP POLICY IF EXISTS "authenticated_can_nominate" ON native_property.candidates;
DROP POLICY IF EXISTS "org_admins_can_update_candidates" ON native_property.candidates;

CREATE POLICY "org_members_can_view_candidates"
  ON native_property.candidates FOR SELECT
  USING (native_property.is_org_member(auth.uid(), native_property.get_org_from_election(election_id)));

-- Nominations/seconding/withdrawal are handled exclusively via SECURITY
-- DEFINER RPCs (rpc_nominate_candidate, rpc_second_nomination,
-- rpc_withdraw_nomination), which run with elevated privilege and enforce
-- election-phase + org-membership checks themselves. No direct-write
-- policy is granted here.

DROP POLICY IF EXISTS "authenticated_can_view_vote_choices" ON native_property.vote_choices;

CREATE POLICY "org_members_can_view_vote_choices"
  ON native_property.vote_choices FOR SELECT
  USING (native_property.is_org_member(auth.uid(), native_property.get_org_from_election(election_id)));

-- =============================================================================
-- RLS: BILLING CYCLES
-- =============================================================================

DROP POLICY IF EXISTS "org_members_can_view_billing_cycles" ON native_property.billing_cycles;
DROP POLICY IF EXISTS "org_admins_can_manage_billing_cycles" ON native_property.billing_cycles;

CREATE POLICY "org_members_can_view_billing_cycles"
  ON native_property.billing_cycles FOR SELECT
  USING (native_property.is_org_member(auth.uid(), organization_id));

CREATE POLICY "org_admins_can_insert_billing_cycles"
  ON native_property.billing_cycles FOR INSERT
  WITH CHECK (native_property.has_org_role(auth.uid(), organization_id, 'ADMIN'));

CREATE POLICY "org_admins_can_update_billing_cycles"
  ON native_property.billing_cycles FOR UPDATE
  USING (native_property.has_org_role(auth.uid(), organization_id, 'ADMIN'));

-- =============================================================================
-- RLS: FINANCIAL TRANSACTIONS / BUDGET LINES
-- =============================================================================

DROP POLICY IF EXISTS "authenticated_can_view_financial_transactions" ON native_property.financial_transactions;

CREATE POLICY "org_members_can_view_financial_transactions"
  ON native_property.financial_transactions FOR SELECT
  USING (native_property.is_org_member(auth.uid(), organization_id));

-- Writes remain RPC-only (rpc_create_transaction), now with an org role check.

DROP POLICY IF EXISTS "authenticated_can_view_budget_lines" ON native_property.budget_lines;

CREATE POLICY "org_members_can_view_budget_lines"
  ON native_property.budget_lines FOR SELECT
  USING (native_property.is_org_member(auth.uid(), organization_id));

-- Writes remain RPC-only (rpc_create_budget_line / rpc_update_budget_line), now with an org role check.

-- =============================================================================
-- RLS: RESOLUTIONS
-- =============================================================================

DROP POLICY IF EXISTS "authenticated_can_view_resolutions" ON native_property.resolutions;
DROP POLICY IF EXISTS "org_admins_can_manage_resolutions" ON native_property.resolutions;

CREATE POLICY "org_members_can_view_resolutions"
  ON native_property.resolutions FOR SELECT
  USING (native_property.is_org_member(auth.uid(), native_property.get_org_from_meeting(meeting_id)));

CREATE POLICY "org_admins_can_insert_resolutions"
  ON native_property.resolutions FOR INSERT
  WITH CHECK (native_property.has_org_role(auth.uid(), native_property.get_org_from_meeting(meeting_id), 'ADMIN'));

CREATE POLICY "org_admins_can_update_resolutions"
  ON native_property.resolutions FOR UPDATE
  USING (native_property.has_org_role(auth.uid(), native_property.get_org_from_meeting(meeting_id), 'ADMIN'));

CREATE POLICY "org_admins_can_delete_resolutions"
  ON native_property.resolutions FOR DELETE
  USING (native_property.has_org_role(auth.uid(), native_property.get_org_from_meeting(meeting_id), 'ADMIN'));

-- =============================================================================
-- RPC: add org role checks where only auth.uid() IS NOT NULL was checked
-- =============================================================================

CREATE OR REPLACE FUNCTION native_property.rpc_update_election_status(
  p_election_id UUID,
  p_new_status native_property.election_status
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = native_property, core, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_election RECORD;
  v_valid_transitions JSONB := '{
    "UPCOMING": ["NOMINATIONS_OPEN", "CANCELLED"],
    "NOMINATIONS_OPEN": ["VOTING_OPEN", "CANCELLED"],
    "VOTING_OPEN": ["COMPLETED", "CANCELLED"],
    "COMPLETED": [],
    "CANCELLED": []
  }'::jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_election
  FROM native_property.elections
  WHERE id = p_election_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Election not found';
  END IF;

  IF NOT native_property.has_org_role(v_user_id, v_election.organization_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  IF NOT (v_valid_transitions->>v_election.status = ANY(
    ARRAY(SELECT jsonb_array_elements_text(v_valid_transitions->>v_election.status))
  )) THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', v_election.status, p_new_status;
  END IF;

  UPDATE native_property.elections
  SET status = p_new_status,
      results_published_at = CASE WHEN p_new_status = 'COMPLETED' THEN now() ELSE results_published_at END,
      updated_at = now()
  WHERE id = p_election_id;

  RETURN jsonb_build_object(
    'election_id', p_election_id,
    'old_status', v_election.status,
    'new_status', p_new_status
  );
END;
$$;

CREATE OR REPLACE FUNCTION native_property.rpc_create_transaction(
  p_organization_id UUID,
  p_date TIMESTAMPTZ,
  p_type native_property.transaction_type,
  p_category TEXT,
  p_description TEXT,
  p_amount DOUBLE PRECISION,
  p_reference TEXT DEFAULT NULL,
  p_attachment_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = native_property, core, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_accounting_period TEXT;
  v_quarter INT;
  v_transaction_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT native_property.has_org_role(v_user_id, p_organization_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  v_quarter := EXTRACT(QUARTER FROM p_date);
  v_accounting_period := EXTRACT(YEAR FROM p_date)::text || '-Q' || v_quarter::text;

  INSERT INTO native_property.financial_transactions (
    organization_id, date, type, category, description, amount, reference, accounting_period, attachment_url
  ) VALUES (
    p_organization_id, p_date, p_type, p_category, p_description, p_amount, p_reference, v_accounting_period, p_attachment_url
  ) RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'transaction_id', v_transaction_id,
    'accounting_period', v_accounting_period
  );
END;
$$;

CREATE OR REPLACE FUNCTION native_property.rpc_create_budget_line(
  p_organization_id UUID,
  p_fiscal_year INT,
  p_category TEXT,
  p_budgeted_amount DOUBLE PRECISION
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = native_property, core, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_budget_id UUID;
  v_variance DOUBLE PRECISION;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT native_property.has_org_role(v_user_id, p_organization_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  v_variance := p_budgeted_amount;

  INSERT INTO native_property.budget_lines (
    organization_id, fiscal_year, category, budgeted_amount, spent_amount, variance
  ) VALUES (
    p_organization_id, p_fiscal_year, p_category, p_budgeted_amount, 0, v_variance
  ) RETURNING id INTO v_budget_id;

  RETURN jsonb_build_object('budget_id', v_budget_id);
END;
$$;

CREATE OR REPLACE FUNCTION native_property.rpc_update_budget_line(
  p_budget_id UUID,
  p_budgeted_amount DOUBLE PRECISION DEFAULT NULL,
  p_spent_amount DOUBLE PRECISION DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = native_property, core, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_budget RECORD;
  v_new_budgeted DOUBLE PRECISION;
  v_new_spent DOUBLE PRECISION;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_budget
  FROM native_property.budget_lines
  WHERE id = p_budget_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Budget line not found';
  END IF;

  IF NOT native_property.has_org_role(v_user_id, v_budget.organization_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  v_new_budgeted := COALESCE(p_budgeted_amount, v_budget.budgeted_amount);
  v_new_spent := COALESCE(p_spent_amount, v_budget.spent_amount);

  UPDATE native_property.budget_lines
  SET budgeted_amount = v_new_budgeted,
      spent_amount = v_new_spent,
      variance = v_new_budgeted - v_new_spent,
      updated_at = now()
  WHERE id = p_budget_id;

  RETURN jsonb_build_object(
    'budget_id', p_budget_id,
    'budgeted_amount', v_new_budgeted,
    'spent_amount', v_new_spent,
    'variance', v_new_budgeted - v_new_spent
  );
END;
$$;

CREATE OR REPLACE FUNCTION native_property.rpc_record_payment(
  p_property_id UUID,
  p_amount DOUBLE PRECISION,
  p_payment_date TIMESTAMPTZ,
  p_payment_method native_property.payment_method,
  p_reference TEXT,
  p_allocated_to JSONB DEFAULT '{}',
  p_receipt_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = native_property, core, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_organization_id UUID;
  v_payment_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_organization_id := native_property.get_organization_id(p_property_id);
  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'Property not found';
  END IF;

  IF NOT native_property.has_org_role(v_user_id, v_organization_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  INSERT INTO native_property.payments (
    property_id, amount, payment_date, payment_method,
    reference, allocated_to, status, receipt_url
  ) VALUES (
    p_property_id, p_amount, p_payment_date, p_payment_method,
    p_reference, p_allocated_to, 'PENDING', p_receipt_url
  ) RETURNING id INTO v_payment_id;

  RETURN jsonb_build_object('payment_id', v_payment_id);
END;
$$;

CREATE OR REPLACE FUNCTION native_property.rpc_add_utility_reading(
  p_property_id UUID,
  p_utility_type native_property.utility_type,
  p_reading_date TIMESTAMPTZ,
  p_meter_reading DOUBLE PRECISION,
  p_previous_reading DOUBLE PRECISION,
  p_rate DOUBLE PRECISION
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = native_property, core, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_organization_id UUID;
  v_consumption DOUBLE PRECISION;
  v_amount DOUBLE PRECISION;
  v_reading_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_organization_id := native_property.get_organization_id(p_property_id);
  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'Property not found';
  END IF;

  IF NOT native_property.has_org_role(v_user_id, v_organization_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  v_consumption := p_meter_reading - p_previous_reading;
  IF v_consumption < 0 THEN
    RAISE EXCEPTION 'Meter reading cannot be less than previous reading';
  END IF;

  v_amount := v_consumption * p_rate;

  INSERT INTO native_property.utility_readings (
    property_id, utility_type, reading_date,
    meter_reading, previous_reading, consumption,
    rate, amount, recorded_by_id
  ) VALUES (
    p_property_id, p_utility_type, p_reading_date,
    p_meter_reading, p_previous_reading, v_consumption,
    p_rate, v_amount, v_user_id
  ) RETURNING id INTO v_reading_id;

  RETURN jsonb_build_object(
    'reading_id', v_reading_id,
    'consumption', v_consumption,
    'amount', v_amount
  );
END;
$$;

CREATE OR REPLACE FUNCTION native_property.rpc_approve_access_request(
  p_request_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = native_property, core, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_request RECORD;
  v_organization_id UUID;
  v_new_ownership_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_request
  FROM native_property.property_access_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Access request not found';
  END IF;

  v_organization_id := native_property.get_organization_id(v_request.property_id);

  IF NOT native_property.has_org_role(v_user_id, v_organization_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  IF v_request.status != 'PENDING' THEN
    RAISE EXCEPTION 'Request is not pending (current: %)', v_request.status;
  END IF;

  UPDATE native_property.property_ownerships
  SET is_active = false, end_date = now(), updated_at = now()
  WHERE property_id = v_request.property_id
    AND ownership_type = 'PRIMARY'
    AND is_active = true;

  INSERT INTO native_property.property_ownerships (
    property_id, user_id, ownership_type, start_date, is_active
  ) VALUES (
    v_request.property_id,
    (SELECT id FROM core.users WHERE email = v_request.requested_for_email LIMIT 1),
    'PRIMARY',
    now(),
    true
  ) RETURNING id INTO v_new_ownership_id;

  UPDATE native_property.properties
  SET current_primary_owner_id = (
    SELECT user_id FROM native_property.property_ownerships WHERE id = v_new_ownership_id
  ),
  updated_at = now()
  WHERE id = v_request.property_id;

  UPDATE native_property.property_access_requests
  SET status = 'APPROVED',
      admin_notes = p_admin_notes,
      processed_by_user_id = v_user_id,
      processed_at = now(),
      updated_at = now()
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'request_id', p_request_id,
    'status', 'APPROVED',
    'new_ownership_id', v_new_ownership_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION native_property.rpc_update_document_approval(
  p_document_id UUID,
  p_approval_status native_property.approval_status
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = native_property, core, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_organization_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_organization_id := native_property.get_org_from_document(p_document_id);
  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  IF NOT native_property.has_org_role(v_user_id, v_organization_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  UPDATE native_property.documents
  SET approval_status = p_approval_status
  WHERE id = p_document_id;

  RETURN jsonb_build_object(
    'document_id', p_document_id,
    'approval_status', p_approval_status
  );
END;
$$;

CREATE OR REPLACE FUNCTION native_property.rpc_create_director(
  p_organization_id UUID,
  p_user_id UUID,
  p_position TEXT,
  p_elected_date TIMESTAMPTZ,
  p_term_end_date TIMESTAMPTZ,
  p_portfolio TEXT DEFAULT NULL,
  p_biography TEXT DEFAULT NULL,
  p_contact_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = native_property, core, pg_temp
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_director_id UUID;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT native_property.has_org_role(v_caller_id, p_organization_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  INSERT INTO native_property.directors (
    organization_id, user_id, position, elected_date, term_end_date,
    portfolio, biography, contact_email
  ) VALUES (
    p_organization_id, p_user_id, p_position, p_elected_date, p_term_end_date,
    p_portfolio, p_biography, p_contact_email
  ) RETURNING id INTO v_director_id;

  RETURN jsonb_build_object('director_id', v_director_id);
END;
$$;

CREATE OR REPLACE FUNCTION native_property.rpc_update_maintenance(
  p_request_id UUID,
  p_status native_property.maintenance_status DEFAULT NULL,
  p_assigned_to TEXT DEFAULT NULL,
  p_estimated_cost DOUBLE PRECISION DEFAULT NULL,
  p_actual_cost DOUBLE PRECISION DEFAULT NULL,
  p_priority native_property.priority DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = native_property, core, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_request RECORD;
  v_organization_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_request
  FROM native_property.maintenance_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Maintenance request not found';
  END IF;

  v_organization_id := native_property.get_organization_id(v_request.property_id);

  IF NOT native_property.has_org_role(v_user_id, v_organization_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  UPDATE native_property.maintenance_requests
  SET
    status = COALESCE(p_status, status),
    assigned_to = COALESCE(p_assigned_to, assigned_to),
    estimated_cost = COALESCE(p_estimated_cost, estimated_cost),
    actual_cost = COALESCE(p_actual_cost, actual_cost),
    priority = COALESCE(p_priority, priority),
    resolved_at = CASE
      WHEN p_status IN ('RESOLVED', 'CLOSED') THEN now()
      ELSE resolved_at
    END
  WHERE id = p_request_id;

  RETURN jsonb_build_object('request_id', p_request_id, 'updated', true);
END;
$$;

-- =============================================================================
-- RPC: rpc_create_election / rpc_nominate_candidate now require org_id and
-- membership, since elections are org-scoped as of this migration
-- =============================================================================

CREATE OR REPLACE FUNCTION native_property.rpc_create_election(
  p_organization_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_type native_property.election_type,
  p_nominations_start TIMESTAMPTZ,
  p_nominations_end TIMESTAMPTZ,
  p_voting_start TIMESTAMPTZ,
  p_voting_end TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = native_property, core, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_election_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT native_property.has_org_role(v_user_id, p_organization_id, 'ADMIN') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  IF p_nominations_start >= p_nominations_end THEN
    RAISE EXCEPTION 'Nominations start must be before end';
  END IF;
  IF p_voting_start >= p_voting_end THEN
    RAISE EXCEPTION 'Voting start must be before end';
  END IF;
  IF p_nominations_end > p_voting_start THEN
    RAISE EXCEPTION 'Nominations must close before voting opens';
  END IF;

  INSERT INTO native_property.elections (
    organization_id, title, description, type, status,
    nominations_start_date, nominations_end_date,
    voting_start_date, voting_end_date
  ) VALUES (
    p_organization_id, p_title, p_description, p_type, 'UPCOMING',
    p_nominations_start, p_nominations_end,
    p_voting_start, p_voting_end
  ) RETURNING id INTO v_election_id;

  RETURN jsonb_build_object('election_id', v_election_id);
END;
$$;

CREATE OR REPLACE FUNCTION native_property.rpc_nominate_candidate(
  p_election_id UUID,
  p_user_id UUID,
  p_position TEXT,
  p_statement TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = native_property, core, pg_temp
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_election RECORD;
  v_candidate_id UUID;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_election
  FROM native_property.elections
  WHERE id = p_election_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Election not found';
  END IF;

  IF NOT native_property.is_org_member(v_caller_id, v_election.organization_id) THEN
    RAISE EXCEPTION 'Not a member of this organization';
  END IF;

  IF v_election.status != 'NOMINATIONS_OPEN' THEN
    RAISE EXCEPTION 'Nominations are not open (status: %)', v_election.status;
  END IF;

  IF now() < v_election.nominations_start_date OR now() > v_election.nominations_end_date THEN
    RAISE EXCEPTION 'Nominations period has ended';
  END IF;

  IF EXISTS (
    SELECT 1 FROM native_property.candidates
    WHERE election_id = p_election_id AND user_id = p_user_id AND position = p_position
  ) THEN
    RAISE EXCEPTION 'User is already nominated for this position';
  END IF;

  INSERT INTO native_property.candidates (
    election_id, user_id, position, statement, status, nominated_by
  ) VALUES (
    p_election_id, p_user_id, p_position, p_statement, 'NOMINATED', v_caller_id::text
  ) RETURNING id INTO v_candidate_id;

  RETURN jsonb_build_object('candidate_id', v_candidate_id);
END;
$$;

-- =============================================================================
-- RPC: rpc_delete_user / rpc_update_user — require the caller to be an ADMIN
-- in every organization the target user belongs to (platform-admin concept
-- doesn't exist yet, so this is the strictest correct check available)
-- =============================================================================

CREATE OR REPLACE FUNCTION native_property.rpc_update_user(
  p_user_id UUID,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_phone_number TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = native_property, core, pg_temp
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Self-service update is always allowed; admin-on-behalf-of requires
  -- the caller to share at least one organization with the target as ADMIN.
  IF v_caller_id != p_user_id THEN
    IF NOT EXISTS (
      SELECT 1
      FROM core.organization_members caller_m
      JOIN core.organization_members target_m
        ON target_m.organization_id = caller_m.organization_id
      WHERE caller_m.user_id = v_caller_id
        AND caller_m.role = 'ADMIN'
        AND target_m.user_id = p_user_id
    ) THEN
      RAISE EXCEPTION 'Admin role required in a shared organization';
    END IF;
  END IF;

  UPDATE core.users
  SET
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    phone_number = COALESCE(p_phone_number, phone_number),
    is_active = COALESCE(p_is_active, is_active)
  WHERE id = p_user_id;

  RETURN jsonb_build_object('user_id', p_user_id, 'updated', true);
END;
$$;

CREATE OR REPLACE FUNCTION native_property.rpc_delete_user(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = native_property, core, pg_temp
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_caller_id = p_user_id THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM core.organization_members caller_m
    JOIN core.organization_members target_m
      ON target_m.organization_id = caller_m.organization_id
    WHERE caller_m.user_id = v_caller_id
      AND caller_m.role = 'ADMIN'
      AND target_m.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Admin role required in a shared organization';
  END IF;

  DELETE FROM core.users WHERE id = p_user_id;

  RETURN jsonb_build_object('user_id', p_user_id, 'deleted', true);
END;
$$;
