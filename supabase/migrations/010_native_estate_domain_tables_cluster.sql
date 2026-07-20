-- =============================================================================
-- Migration 010: native_estate domain tables (cluster / TEXT org + user ids)
-- =============================================================================
-- Cluster already has estates / estate_members / units from 008. This creates
-- the remaining domain tables the SPA expects, with:
--   - schema: native_estate
--   - organization_id TEXT → core.organizations(id)
--   - user_id / *_by_id TEXT (core.users.id is cuid text)
--   - estate_id UUID → native_estate.estates(id)
--   - unit_id UUID → native_estate.units(id) (renamed from property_id)
-- Idempotent: safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
DO $$ BEGIN CREATE TYPE native_estate.ownership_type AS ENUM (
  'PRIMARY', 'CO_OWNER', 'TENANT', 'FORMER_OWNER'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.unit_access_status AS ENUM (
  'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.document_category AS ENUM (
  'AGM_MINUTES', 'FINANCIAL_REPORTS', 'RULES_REGULATIONS',
  'CONTRACTS', 'POLICIES', 'OTHER'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.approval_status AS ENUM (
  'PENDING', 'APPROVED', 'REJECTED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.announcement_category AS ENUM (
  'URGENT', 'MAINTENANCE', 'FINANCIAL', 'SOCIAL', 'GENERAL'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.priority AS ENUM (
  'LOW', 'MEDIUM', 'HIGH', 'URGENT'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.utility_type AS ENUM (
  'WATER', 'ELECTRICITY', 'GAS', 'LEVY', 'OTHER'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.payment_method AS ENUM (
  'CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'EFT'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.payment_status AS ENUM (
  'PENDING', 'CLEARED', 'BOUNCED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.billing_cycle_status AS ENUM (
  'OPEN', 'CLOSED', 'PUBLISHED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.meeting_type AS ENUM (
  'AGM', 'SPECIAL', 'BOARD', 'COMMITTEE'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.meeting_status AS ENUM (
  'SCHEDULED', 'COMPLETED', 'CANCELLED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.rsvp_status AS ENUM (
  'ATTENDING', 'NOT_ATTENDING', 'MAYBE'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.maintenance_category AS ENUM (
  'PLUMBING', 'ELECTRICAL', 'SECURITY', 'GARDEN',
  'CLEANING', 'STRUCTURAL', 'OTHER'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.maintenance_status AS ENUM (
  'SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.facial_verification_status AS ENUM (
  'PENDING', 'PROCESSING', 'VERIFIED', 'FAILED', 'EXPIRED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.election_type AS ENUM (
  'DIRECTOR', 'COMMITTEE', 'RESOLUTION'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.election_status AS ENUM (
  'UPCOMING', 'NOMINATIONS_OPEN', 'VOTING_OPEN', 'COMPLETED', 'CANCELLED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.candidate_status AS ENUM (
  'NOMINATED', 'ACCEPTED', 'WITHDRAWN'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.transaction_type AS ENUM (
  'INCOME', 'EXPENSE'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.resolution_status AS ENUM (
  'PENDING', 'PASSED', 'FAILED', 'DEFERRED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE native_estate.implementation_status AS ENUM (
  'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION native_estate.current_core_user_id()
RETURNS TEXT
LANGUAGE SQL STABLE
AS $$
  SELECT u.id FROM core.users u
  WHERE u.supabase_id = auth.uid()::text
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION native_estate.is_org_member(p_organization_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM core.organization_members om
    WHERE om.organization_id = p_organization_id
      AND om.user_id = native_estate.current_core_user_id()
  )
$$;

CREATE OR REPLACE FUNCTION native_estate.is_org_staff(p_organization_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM core.organization_members om
    WHERE om.organization_id = p_organization_id
      AND om.user_id = native_estate.current_core_user_id()
      AND om.role IN ('OWNER', 'ADMIN', 'MANAGER')
  )
$$;

CREATE OR REPLACE FUNCTION native_estate.is_estate_member(p_estate_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM native_estate.estate_members em
    WHERE em.estate_id = p_estate_id
      AND em.user_id = native_estate.current_core_user_id()
  ) OR EXISTS (
    SELECT 1 FROM native_estate.estates e
    WHERE e.id = p_estate_id
      AND native_estate.is_org_member(e.organization_id)
  )
$$;

-- -----------------------------------------------------------------------------
-- Unit ownership / access
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS native_estate.unit_ownerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES native_estate.units(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  ownership_type native_estate.ownership_type NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(unit_id, user_id, start_date)
);
CREATE INDEX IF NOT EXISTS idx_unit_ownerships_unit_active ON native_estate.unit_ownerships(unit_id, is_active);
CREATE INDEX IF NOT EXISTS idx_unit_ownerships_user_active ON native_estate.unit_ownerships(user_id, is_active);

CREATE TABLE IF NOT EXISTS native_estate.unit_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES native_estate.units(id) ON DELETE CASCADE,
  requested_by_user_id TEXT NOT NULL,
  requested_for_email TEXT NOT NULL,
  requested_records TEXT[] NOT NULL DEFAULT '{}',
  transfer_date TIMESTAMPTZ,
  status native_estate.unit_access_status NOT NULL DEFAULT 'PENDING',
  admin_notes TEXT,
  processed_by_user_id TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_unit_access_requests_unit_status ON native_estate.unit_access_requests(unit_id, status);

-- -----------------------------------------------------------------------------
-- Utilities / payments / billing
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS native_estate.utility_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES native_estate.units(id) ON DELETE CASCADE,
  utility_type native_estate.utility_type NOT NULL,
  reading_date TIMESTAMPTZ NOT NULL,
  meter_reading DOUBLE PRECISION NOT NULL,
  previous_reading DOUBLE PRECISION NOT NULL,
  consumption DOUBLE PRECISION NOT NULL,
  rate DOUBLE PRECISION NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  recorded_by_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_utility_readings_unit_date ON native_estate.utility_readings(unit_id, reading_date);

CREATE TABLE IF NOT EXISTS native_estate.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES native_estate.units(id) ON DELETE CASCADE,
  amount DOUBLE PRECISION NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL,
  payment_method native_estate.payment_method NOT NULL,
  reference TEXT NOT NULL,
  allocated_to JSONB NOT NULL DEFAULT '{}',
  status native_estate.payment_status NOT NULL DEFAULT 'PENDING',
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_unit_date ON native_estate.payments(unit_id, payment_date);

CREATE TABLE IF NOT EXISTS native_estate.billing_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  estate_id UUID NOT NULL REFERENCES native_estate.estates(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status native_estate.billing_cycle_status NOT NULL DEFAULT 'OPEN',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_estate ON native_estate.billing_cycles(estate_id);

-- -----------------------------------------------------------------------------
-- Documents / announcements
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS native_estate.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  estate_id UUID NOT NULL REFERENCES native_estate.estates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category native_estate.document_category NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  approval_status native_estate.approval_status NOT NULL DEFAULT 'APPROVED',
  uploaded_by_id TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_estate ON native_estate.documents(estate_id);

CREATE TABLE IF NOT EXISTS native_estate.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES native_estate.documents(id) ON DELETE CASCADE,
  version INT NOT NULL,
  file_url TEXT NOT NULL,
  change_notes TEXT,
  uploaded_by_id TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(document_id, version)
);

CREATE TABLE IF NOT EXISTS native_estate.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  estate_id UUID NOT NULL REFERENCES native_estate.estates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category native_estate.announcement_category NOT NULL,
  priority native_estate.priority NOT NULL DEFAULT 'MEDIUM',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  requires_acknowledgment BOOLEAN NOT NULL DEFAULT false,
  attachments TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  posted_by_id TEXT NOT NULL,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_announcements_estate ON native_estate.announcements(estate_id);

CREATE TABLE IF NOT EXISTS native_estate.announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES native_estate.announcements(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(announcement_id, user_id)
);

-- -----------------------------------------------------------------------------
-- Meetings / maintenance
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS native_estate.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  estate_id UUID NOT NULL REFERENCES native_estate.estates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type native_estate.meeting_type NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  agenda_url TEXT,
  minutes_url TEXT,
  status native_estate.meeting_status NOT NULL DEFAULT 'SCHEDULED',
  required_quorum INT NOT NULL DEFAULT 0,
  created_by_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_meetings_estate ON native_estate.meetings(estate_id);

CREATE TABLE IF NOT EXISTS native_estate.meeting_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES native_estate.meetings(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  rsvp_status native_estate.rsvp_status,
  actual_attendance BOOLEAN NOT NULL DEFAULT false,
  proxy_for TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

CREATE TABLE IF NOT EXISTS native_estate.resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES native_estate.meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  proposed_by TEXT NOT NULL,
  status native_estate.resolution_status NOT NULL DEFAULT 'PENDING',
  votes_for INT NOT NULL DEFAULT 0,
  votes_against INT NOT NULL DEFAULT 0,
  votes_abstain INT NOT NULL DEFAULT 0,
  implementation_status native_estate.implementation_status NOT NULL DEFAULT 'NOT_STARTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS native_estate.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES native_estate.units(id) ON DELETE CASCADE,
  submitted_by_id TEXT NOT NULL,
  category native_estate.maintenance_category NOT NULL,
  priority native_estate.priority NOT NULL,
  description TEXT NOT NULL,
  photos TEXT[] NOT NULL DEFAULT '{}',
  status native_estate.maintenance_status NOT NULL DEFAULT 'SUBMITTED',
  assigned_to TEXT,
  estimated_cost DOUBLE PRECISION,
  actual_cost DOUBLE PRECISION,
  rating INT,
  feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_maintenance_unit_status ON native_estate.maintenance_requests(unit_id, status);

-- -----------------------------------------------------------------------------
-- Activity / facial
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS native_estate.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_timestamp ON native_estate.activity_logs(user_id, timestamp);

CREATE TABLE IF NOT EXISTS native_estate.facial_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  video_url TEXT,
  compliance_video_url TEXT,
  status native_estate.facial_verification_status NOT NULL DEFAULT 'PENDING',
  verification_score DOUBLE PRECISION,
  metadata JSONB,
  expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_facial_verifications_user_status ON native_estate.facial_verifications(user_id, status);

-- -----------------------------------------------------------------------------
-- Directors / elections / voting
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS native_estate.directors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  estate_id UUID NOT NULL REFERENCES native_estate.estates(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  position TEXT NOT NULL,
  elected_date TIMESTAMPTZ NOT NULL,
  term_end_date TIMESTAMPTZ NOT NULL,
  portfolio TEXT,
  biography TEXT,
  contact_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(estate_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_directors_estate ON native_estate.directors(estate_id);

CREATE TABLE IF NOT EXISTS native_estate.elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  estate_id UUID NOT NULL REFERENCES native_estate.estates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type native_estate.election_type NOT NULL,
  status native_estate.election_status NOT NULL DEFAULT 'UPCOMING',
  nominations_start_date TIMESTAMPTZ NOT NULL,
  nominations_end_date TIMESTAMPTZ NOT NULL,
  voting_start_date TIMESTAMPTZ NOT NULL,
  voting_end_date TIMESTAMPTZ NOT NULL,
  results_published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_elections_estate ON native_estate.elections(estate_id);

CREATE TABLE IF NOT EXISTS native_estate.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES native_estate.elections(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  position TEXT NOT NULL,
  statement TEXT,
  status native_estate.candidate_status NOT NULL DEFAULT 'NOMINATED',
  nominated_by TEXT NOT NULL,
  seconded_by TEXT,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(election_id, user_id, position)
);

CREATE TABLE IF NOT EXISTS native_estate.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES native_estate.elections(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  candidate_id UUID NOT NULL REFERENCES native_estate.candidates(id) ON DELETE CASCADE,
  vote_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(election_id, user_id)
);

CREATE TABLE IF NOT EXISTS native_estate.vote_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES native_estate.elections(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES native_estate.candidates(id) ON DELETE CASCADE,
  vote_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(election_id, candidate_id)
);

-- -----------------------------------------------------------------------------
-- Financial
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS native_estate.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  estate_id UUID NOT NULL REFERENCES native_estate.estates(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  type native_estate.transaction_type NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  reference TEXT,
  accounting_period TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_estate ON native_estate.financial_transactions(estate_id);

CREATE TABLE IF NOT EXISTS native_estate.budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  estate_id UUID NOT NULL REFERENCES native_estate.estates(id) ON DELETE CASCADE,
  fiscal_year INT NOT NULL,
  category TEXT NOT NULL,
  budgeted_amount DOUBLE PRECISION NOT NULL,
  spent_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_budget_lines_estate ON native_estate.budget_lines(estate_id);

-- -----------------------------------------------------------------------------
-- RLS: enable + estate-membership SELECT; staff write on estate-scoped tables
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'unit_ownerships','unit_access_requests','utility_readings','payments',
    'billing_cycles','documents','document_versions','announcements',
    'announcement_reads','meetings','meeting_attendance','resolutions',
    'maintenance_requests','activity_logs','facial_verifications','directors',
    'elections','candidates','votes','vote_choices','financial_transactions',
    'budget_lines','estate_members','units'
  ]
  LOOP
    EXECUTE format('ALTER TABLE native_estate.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Units: members of the estate/org can read; staff can write
DROP POLICY IF EXISTS units_select ON native_estate.units;
CREATE POLICY units_select ON native_estate.units
  FOR SELECT TO authenticated
  USING (native_estate.is_estate_member(estate_id));

DROP POLICY IF EXISTS units_staff_write ON native_estate.units;
CREATE POLICY units_staff_write ON native_estate.units
  FOR ALL TO authenticated
  USING (native_estate.is_org_staff(organization_id))
  WITH CHECK (native_estate.is_org_staff(organization_id));

DROP POLICY IF EXISTS estate_members_select ON native_estate.estate_members;
CREATE POLICY estate_members_select ON native_estate.estate_members
  FOR SELECT TO authenticated
  USING (
    user_id = native_estate.current_core_user_id()
    OR native_estate.is_estate_member(estate_id)
  );

DROP POLICY IF EXISTS estate_members_staff_write ON native_estate.estate_members;
CREATE POLICY estate_members_staff_write ON native_estate.estate_members
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM native_estate.estates e
      WHERE e.id = estate_members.estate_id
        AND native_estate.is_org_staff(e.organization_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM native_estate.estates e
      WHERE e.id = estate_members.estate_id
        AND native_estate.is_org_staff(e.organization_id)
    )
  );

-- Generic estate-scoped SELECT via estate_id column
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'billing_cycles','documents','announcements','meetings','directors',
    'elections','financial_transactions','budget_lines'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select ON native_estate.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_select ON native_estate.%I FOR SELECT TO authenticated USING (native_estate.is_estate_member(estate_id))',
      t, t
    );
    EXECUTE format('DROP POLICY IF EXISTS %I_staff_write ON native_estate.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_staff_write ON native_estate.%I FOR ALL TO authenticated USING (native_estate.is_org_staff(organization_id)) WITH CHECK (native_estate.is_org_staff(organization_id))',
      t, t
    );
  END LOOP;
END $$;

-- Unit-scoped tables: via units.estate_id
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'unit_ownerships','unit_access_requests','utility_readings','payments','maintenance_requests'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select ON native_estate.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_select ON native_estate.%I FOR SELECT TO authenticated USING (
         EXISTS (
           SELECT 1 FROM native_estate.units u
           WHERE u.id = %I.unit_id AND native_estate.is_estate_member(u.estate_id)
         )
       )',
      t, t, t
    );
    EXECUTE format('DROP POLICY IF EXISTS %I_member_write ON native_estate.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_member_write ON native_estate.%I FOR ALL TO authenticated USING (
         EXISTS (
           SELECT 1 FROM native_estate.units u
           WHERE u.id = %I.unit_id AND (
             native_estate.is_org_staff(u.organization_id)
             OR native_estate.is_estate_member(u.estate_id)
           )
         )
       ) WITH CHECK (
         EXISTS (
           SELECT 1 FROM native_estate.units u
           WHERE u.id = %I.unit_id AND (
             native_estate.is_org_staff(u.organization_id)
             OR native_estate.is_estate_member(u.estate_id)
           )
         )
       )',
      t, t, t, t
    );
  END LOOP;
END $$;

-- Child tables without estate_id: inherit via parent
DROP POLICY IF EXISTS document_versions_select ON native_estate.document_versions;
CREATE POLICY document_versions_select ON native_estate.document_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM native_estate.documents d
      WHERE d.id = document_versions.document_id
        AND native_estate.is_estate_member(d.estate_id)
    )
  );

DROP POLICY IF EXISTS announcement_reads_own ON native_estate.announcement_reads;
CREATE POLICY announcement_reads_own ON native_estate.announcement_reads
  FOR ALL TO authenticated
  USING (user_id = native_estate.current_core_user_id())
  WITH CHECK (user_id = native_estate.current_core_user_id());

DROP POLICY IF EXISTS meeting_attendance_select ON native_estate.meeting_attendance;
CREATE POLICY meeting_attendance_select ON native_estate.meeting_attendance
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM native_estate.meetings m
      WHERE m.id = meeting_attendance.meeting_id
        AND native_estate.is_estate_member(m.estate_id)
    )
  );

DROP POLICY IF EXISTS resolutions_select ON native_estate.resolutions;
CREATE POLICY resolutions_select ON native_estate.resolutions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM native_estate.meetings m
      WHERE m.id = resolutions.meeting_id
        AND native_estate.is_estate_member(m.estate_id)
    )
  );

DROP POLICY IF EXISTS candidates_select ON native_estate.candidates;
CREATE POLICY candidates_select ON native_estate.candidates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM native_estate.elections e
      WHERE e.id = candidates.election_id
        AND native_estate.is_estate_member(e.estate_id)
    )
  );

DROP POLICY IF EXISTS votes_select ON native_estate.votes;
CREATE POLICY votes_select ON native_estate.votes
  FOR SELECT TO authenticated
  USING (user_id = native_estate.current_core_user_id());

DROP POLICY IF EXISTS vote_choices_select ON native_estate.vote_choices;
CREATE POLICY vote_choices_select ON native_estate.vote_choices
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM native_estate.elections e
      WHERE e.id = vote_choices.election_id
        AND native_estate.is_estate_member(e.estate_id)
        AND e.status = 'COMPLETED'
    )
  );

DROP POLICY IF EXISTS activity_logs_own ON native_estate.activity_logs;
CREATE POLICY activity_logs_own ON native_estate.activity_logs
  FOR SELECT TO authenticated
  USING (user_id = native_estate.current_core_user_id());

DROP POLICY IF EXISTS facial_verifications_own ON native_estate.facial_verifications;
CREATE POLICY facial_verifications_own ON native_estate.facial_verifications
  FOR ALL TO authenticated
  USING (user_id = native_estate.current_core_user_id())
  WITH CHECK (user_id = native_estate.current_core_user_id());

GRANT USAGE ON SCHEMA native_estate TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA native_estate TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA native_estate TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA native_estate TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA native_estate TO authenticated, service_role;
