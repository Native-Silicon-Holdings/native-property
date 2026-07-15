-- =============================================================================
-- Migration 001: Create native_property schema and tables
-- =============================================================================
-- This migration creates the native_property schema on the shared Supabase
-- instance and recreates all 24 tables from the standalone estate_management
-- database. Run BEFORE adding PGRST_DB_SCHEMAS entry (see native-one#174).
--
-- Depends on:
--   - core schema (core.users, core.organizations, core.organization_members)
--   - This must run on the shared Supabase instance, not the standalone DB
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS native_property;

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE native_property.user_role AS ENUM (
  'DIRECTOR', 'MANAGER', 'HOMEOWNER', 'TENANT', 'ACCOUNTANT'
);

CREATE TYPE native_property.property_type AS ENUM (
  'HOUSE', 'APARTMENT', 'TOWNHOUSE', 'COMMERCIAL'
);

CREATE TYPE native_property.ownership_type AS ENUM (
  'PRIMARY', 'CO_OWNER', 'TENANT', 'FORMER_OWNER'
);

CREATE TYPE native_property.property_access_status AS ENUM (
  'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'
);

CREATE TYPE native_property.document_category AS ENUM (
  'AGM_MINUTES', 'FINANCIAL_REPORTS', 'RULES_REGULATIONS',
  'CONTRACTS', 'POLICIES', 'OTHER'
);

CREATE TYPE native_property.approval_status AS ENUM (
  'PENDING', 'APPROVED', 'REJECTED'
);

CREATE TYPE native_property.announcement_category AS ENUM (
  'URGENT', 'MAINTENANCE', 'FINANCIAL', 'SOCIAL', 'GENERAL'
);

CREATE TYPE native_property.priority AS ENUM (
  'LOW', 'MEDIUM', 'HIGH', 'URGENT'
);

CREATE TYPE native_property.utility_type AS ENUM (
  'WATER', 'ELECTRICITY', 'GAS', 'LEVY', 'OTHER'
);

CREATE TYPE native_property.payment_method AS ENUM (
  'CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'EFT'
);

CREATE TYPE native_property.payment_status AS ENUM (
  'PENDING', 'CLEARED', 'BOUNCED'
);

CREATE TYPE native_property.billing_cycle_status AS ENUM (
  'OPEN', 'CLOSED', 'PUBLISHED'
);

CREATE TYPE native_property.meeting_type AS ENUM (
  'AGM', 'SPECIAL', 'BOARD', 'COMMITTEE'
);

CREATE TYPE native_property.meeting_status AS ENUM (
  'SCHEDULED', 'COMPLETED', 'CANCELLED'
);

CREATE TYPE native_property.rsvp_status AS ENUM (
  'ATTENDING', 'NOT_ATTENDING', 'MAYBE'
);

CREATE TYPE native_property.maintenance_category AS ENUM (
  'PLUMBING', 'ELECTRICAL', 'SECURITY', 'GARDEN',
  'CLEANING', 'STRUCTURAL', 'OTHER'
);

CREATE TYPE native_property.maintenance_status AS ENUM (
  'SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
);

CREATE TYPE native_property.facial_verification_status AS ENUM (
  'PENDING', 'PROCESSING', 'VERIFIED', 'FAILED', 'EXPIRED'
);

CREATE TYPE native_property.election_type AS ENUM (
  'DIRECTOR', 'COMMITTEE', 'RESOLUTION'
);

CREATE TYPE native_property.election_status AS ENUM (
  'UPCOMING', 'NOMINATIONS_OPEN', 'VOTING_OPEN', 'COMPLETED', 'CANCELLED'
);

CREATE TYPE native_property.candidate_status AS ENUM (
  'NOMINATED', 'ACCEPTED', 'WITHDRAWN'
);

CREATE TYPE native_property.transaction_type AS ENUM (
  'INCOME', 'EXPENSE'
);

CREATE TYPE native_property.resolution_status AS ENUM (
  'PENDING', 'PASSED', 'FAILED', 'DEFERRED'
);

CREATE TYPE native_property.implementation_status AS ENUM (
  'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Properties (tenant root entity — each row belongs to one estate/organization)
CREATE TABLE native_property.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  property_type native_property.property_type NOT NULL,
  square_meters DOUBLE PRECISION NOT NULL,
  occupants INT NOT NULL DEFAULT 1,
  current_primary_owner_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_properties_organization_id ON native_property.properties(organization_id);
CREATE INDEX idx_properties_unit_number ON native_property.properties(unit_number);

-- Utility Readings
CREATE TABLE native_property.utility_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES native_property.properties(id) ON DELETE CASCADE,
  utility_type native_property.utility_type NOT NULL,
  reading_date TIMESTAMPTZ NOT NULL,
  meter_reading DOUBLE PRECISION NOT NULL,
  previous_reading DOUBLE PRECISION NOT NULL,
  consumption DOUBLE PRECISION NOT NULL,
  rate DOUBLE PRECISION NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  recorded_by_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_utility_readings_property_date ON native_property.utility_readings(property_id, reading_date);

-- Payments
CREATE TABLE native_property.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES native_property.properties(id) ON DELETE CASCADE,
  amount DOUBLE PRECISION NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL,
  payment_method native_property.payment_method NOT NULL,
  reference TEXT NOT NULL,
  allocated_to JSONB NOT NULL DEFAULT '{}',
  status native_property.payment_status NOT NULL DEFAULT 'PENDING',
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_property_date ON native_property.payments(property_id, payment_date);

-- Billing Cycles
CREATE TABLE native_property.billing_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status native_property.billing_cycle_status NOT NULL DEFAULT 'OPEN',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents
CREATE TABLE native_property.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category native_property.document_category NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  approval_status native_property.approval_status NOT NULL DEFAULT 'APPROVED',
  uploaded_by_id UUID NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_category_uploaded ON native_property.documents(category, uploaded_at);

-- Document Versions
CREATE TABLE native_property.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES native_property.documents(id) ON DELETE CASCADE,
  version INT NOT NULL,
  file_url TEXT NOT NULL,
  change_notes TEXT,
  uploaded_by_id UUID NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(document_id, version)
);

-- Announcements
CREATE TABLE native_property.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category native_property.announcement_category NOT NULL,
  priority native_property.priority NOT NULL DEFAULT 'MEDIUM',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  requires_acknowledgment BOOLEAN NOT NULL DEFAULT false,
  attachments TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  posted_by_id UUID NOT NULL,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_posted_category ON native_property.announcements(posted_at, category);

-- Announcement Reads
CREATE TABLE native_property.announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES native_property.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(announcement_id, user_id)
);

-- Meetings
CREATE TABLE native_property.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type native_property.meeting_type NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  agenda_url TEXT,
  minutes_url TEXT,
  status native_property.meeting_status NOT NULL DEFAULT 'SCHEDULED',
  required_quorum INT NOT NULL DEFAULT 0,
  created_by_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meetings_date_status ON native_property.meetings(scheduled_date, status);

-- Meeting Attendance
CREATE TABLE native_property.meeting_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES native_property.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rsvp_status native_property.rsvp_status,
  actual_attendance BOOLEAN NOT NULL DEFAULT false,
  proxy_for TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

-- Maintenance Requests
CREATE TABLE native_property.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES native_property.properties(id) ON DELETE CASCADE,
  submitted_by_id UUID NOT NULL,
  category native_property.maintenance_category NOT NULL,
  priority native_property.priority NOT NULL,
  description TEXT NOT NULL,
  photos TEXT[] NOT NULL DEFAULT '{}',
  status native_property.maintenance_status NOT NULL DEFAULT 'SUBMITTED',
  assigned_to TEXT,
  estimated_cost DOUBLE PRECISION,
  actual_cost DOUBLE PRECISION,
  rating INT,
  feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_maintenance_property_status ON native_property.maintenance_requests(property_id, status);

-- Activity Logs
CREATE TABLE native_property.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_user_timestamp ON native_property.activity_logs(user_id, timestamp);

-- Facial Verifications
CREATE TABLE native_property.facial_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_url TEXT,
  compliance_video_url TEXT,
  status native_property.facial_verification_status NOT NULL DEFAULT 'PENDING',
  verification_score DOUBLE PRECISION,
  metadata JSONB,
  expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_facial_verifications_user_status ON native_property.facial_verifications(user_id, status);

-- Property Ownerships
CREATE TABLE native_property.property_ownerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES native_property.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  ownership_type native_property.ownership_type NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, user_id, start_date)
);

CREATE INDEX idx_property_ownerships_property_active ON native_property.property_ownerships(property_id, is_active);
CREATE INDEX idx_property_ownerships_user_active ON native_property.property_ownerships(user_id, is_active);

-- Property Access Requests
CREATE TABLE native_property.property_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES native_property.properties(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL,
  requested_for_email TEXT NOT NULL,
  requested_records TEXT[] NOT NULL DEFAULT '{}',
  transfer_date TIMESTAMPTZ,
  status native_property.property_access_status NOT NULL DEFAULT 'PENDING',
  admin_notes TEXT,
  processed_by_user_id UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_access_requests_property_status ON native_property.property_access_requests(property_id, status);
CREATE INDEX idx_access_requests_requested_by ON native_property.property_access_requests(requested_by_user_id);

-- Directors
CREATE TABLE native_property.directors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  position TEXT NOT NULL,
  elected_date TIMESTAMPTZ NOT NULL,
  term_end_date TIMESTAMPTZ NOT NULL,
  portfolio TEXT,
  biography TEXT,
  contact_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_directors_active_term ON native_property.directors(is_active, term_end_date);
CREATE INDEX idx_directors_position ON native_property.directors(position);

-- Elections
CREATE TABLE native_property.elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type native_property.election_type NOT NULL,
  status native_property.election_status NOT NULL DEFAULT 'UPCOMING',
  nominations_start_date TIMESTAMPTZ NOT NULL,
  nominations_end_date TIMESTAMPTZ NOT NULL,
  voting_start_date TIMESTAMPTZ NOT NULL,
  voting_end_date TIMESTAMPTZ NOT NULL,
  results_published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_elections_status_voting_end ON native_property.elections(status, voting_end_date);

-- Candidates
CREATE TABLE native_property.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES native_property.elections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  position TEXT NOT NULL,
  statement TEXT,
  status native_property.candidate_status NOT NULL DEFAULT 'NOMINATED',
  nominated_by TEXT NOT NULL,
  seconded_by TEXT,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(election_id, user_id, position)
);

CREATE INDEX idx_candidates_election_status ON native_property.candidates(election_id, status);

-- Votes
CREATE TABLE native_property.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL,
  user_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  vote_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(election_id, user_id)
);

CREATE INDEX idx_votes_election_candidate ON native_property.votes(election_id, candidate_id);
CREATE INDEX idx_votes_user ON native_property.votes(user_id);

-- Vote Choices (aggregated counts)
CREATE TABLE native_property.vote_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL,
  candidate_id UUID NOT NULL REFERENCES native_property.candidates(id) ON DELETE CASCADE,
  vote_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(election_id, candidate_id)
);

CREATE INDEX idx_vote_choices_election ON native_property.vote_choices(election_id);

-- Financial Transactions
CREATE TABLE native_property.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL,
  type native_property.transaction_type NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  reference TEXT,
  accounting_period TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_financial_transactions_date_type ON native_property.financial_transactions(date, type);
CREATE INDEX idx_financial_transactions_period ON native_property.financial_transactions(accounting_period);

-- Budget Lines
CREATE TABLE native_property.budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year INT NOT NULL,
  category TEXT NOT NULL,
  budgeted_amount DOUBLE PRECISION NOT NULL,
  spent_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  variance DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(fiscal_year, category)
);

CREATE INDEX idx_budget_lines_fiscal_year ON native_property.budget_lines(fiscal_year);

-- Resolutions
CREATE TABLE native_property.resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES native_property.meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status native_property.resolution_status NOT NULL DEFAULT 'PENDING',
  votes_for INT NOT NULL DEFAULT 0,
  votes_against INT NOT NULL DEFAULT 0,
  votes_abstain INT NOT NULL DEFAULT 0,
  implementation_status native_property.implementation_status NOT NULL DEFAULT 'NOT_STARTED',
  proposed_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resolutions_meeting_status ON native_property.resolutions(meeting_id, status);

-- =============================================================================
-- HELPER: Get organization_id from a property_id
-- =============================================================================
CREATE OR REPLACE FUNCTION native_property.get_organization_id(p_property_id UUID)
RETURNS UUID
LANGUAGE SQL STABLE
AS $$
  SELECT organization_id FROM native_property.properties WHERE id = p_property_id;
$$;

-- =============================================================================
-- HELPER: Check if user is a member of the organization that owns a property
-- =============================================================================
CREATE OR REPLACE FUNCTION native_property.is_org_member(p_user_id UUID, p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM core.organization_members
    WHERE user_id = p_user_id AND organization_id = p_organization_id
  );
$$;

-- =============================================================================
-- HELPER: Check if user has a specific org role (or higher)
-- =============================================================================
CREATE OR REPLACE FUNCTION native_property.has_org_role(
  p_user_id UUID,
  p_organization_id UUID,
  p_min_role TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM core.organization_members
    WHERE user_id = p_user_id
      AND organization_id = p_organization_id
      AND role = p_min_role
  );
$$;
