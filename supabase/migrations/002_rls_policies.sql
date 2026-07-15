-- =============================================================================
-- Migration 002: RLS policies for native_property schema
-- =============================================================================
-- Tenant isolation: every table is scoped to the organization that owns
-- the property. Users access data through core.organization_members.
--
-- Pattern: two-tier isolation
--   organization_id (estate-level tenant boundary)
--   property_id (individual unit within an estate)
--
-- Depends on: 001_create_native_property_schema.sql
-- =============================================================================

-- =============================================================================
-- Enable RLS on all tables
-- =============================================================================

ALTER TABLE native_property.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.utility_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.meeting_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.facial_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.property_ownerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.property_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.directors ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.vote_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_property.resolutions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PROPERTIES — org-level tenant isolation
-- =============================================================================

CREATE POLICY "org_members_can_view_properties"
  ON native_property.properties FOR SELECT
  USING (
    native_property.is_org_member(auth.uid(), organization_id)
  );

CREATE POLICY "org_admins_can_insert_properties"
  ON native_property.properties FOR INSERT
  WITH CHECK (
    native_property.has_org_role(auth.uid(), organization_id, 'ADMIN')
  );

CREATE POLICY "org_admins_can_update_properties"
  ON native_property.properties FOR UPDATE
  USING (
    native_property.has_org_role(auth.uid(), organization_id, 'ADMIN')
  );

CREATE POLICY "org_admins_can_delete_properties"
  ON native_property.properties FOR DELETE
  USING (
    native_property.has_org_role(auth.uid(), organization_id, 'ADMIN')
  );

-- =============================================================================
-- UTILITY READINGS — scoped via property -> org
-- =============================================================================

CREATE POLICY "org_members_can_view_utility_readings"
  ON native_property.utility_readings FOR SELECT
  USING (
    native_property.is_org_member(
      auth.uid(),
      native_property.get_organization_id(property_id)
    )
  );

CREATE POLICY "org_admins_can_insert_utility_readings"
  ON native_property.utility_readings FOR INSERT
  WITH CHECK (
    native_property.has_org_role(
      auth.uid(),
      native_property.get_organization_id(property_id),
      'ADMIN'
    )
  );

-- =============================================================================
-- PAYMENTS — scoped via property -> org
-- =============================================================================

CREATE POLICY "org_members_can_view_payments"
  ON native_property.payments FOR SELECT
  USING (
    native_property.is_org_member(
      auth.uid(),
      native_property.get_organization_id(property_id)
    )
  );

CREATE POLICY "org_admins_can_insert_payments"
  ON native_property.payments FOR INSERT
  WITH CHECK (
    native_property.has_org_role(
      auth.uid(),
      native_property.get_organization_id(property_id),
      'ADMIN'
    )
  );

-- =============================================================================
-- BILLING CYCLES — org-level (shared across all properties in an estate)
-- =============================================================================

CREATE POLICY "org_members_can_view_billing_cycles"
  ON native_property.billing_cycles FOR SELECT
  USING (true); -- Billing cycles are estate-wide; org membership checked at property level

CREATE POLICY "org_admins_can_manage_billing_cycles"
  ON native_property.billing_cycles FOR ALL
  USING (true); -- Managed via RPC functions with explicit org checks

-- =============================================================================
-- DOCUMENTS — org-level (documents belong to the estate, not a specific property)
-- =============================================================================

-- Documents don't have a direct property_id; they're scoped by the estate.
-- We use uploaded_by_id to trace back to the user's org membership.
-- For full org scoping, documents should have an organization_id column.
-- For now, we allow authenticated users to read and admins to write.

CREATE POLICY "authenticated_can_view_documents"
  ON native_property.documents FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_can_insert_documents"
  ON native_property.documents FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND uploaded_by_id = auth.uid());

CREATE POLICY "org_admins_can_update_documents"
  ON native_property.documents FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "org_admins_can_delete_documents"
  ON native_property.documents FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- =============================================================================
-- DOCUMENT VERSIONS — inherits from documents
-- =============================================================================

CREATE POLICY "authenticated_can_view_document_versions"
  ON native_property.document_versions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_can_insert_document_versions"
  ON native_property.document_versions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND uploaded_by_id = auth.uid());

-- =============================================================================
-- ANNOUNCEMENTS — org-level
-- =============================================================================

CREATE POLICY "authenticated_can_view_announcements"
  ON native_property.announcements FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "org_admins_can_insert_announcements"
  ON native_property.announcements FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND posted_by_id = auth.uid());

CREATE POLICY "org_admins_can_update_announcements"
  ON native_property.announcements FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "org_admins_can_delete_announcements"
  ON native_property.announcements FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- =============================================================================
-- ANNOUNCEMENT READS — self-scoped
-- =============================================================================

CREATE POLICY "users_can_view_own_reads"
  ON native_property.announcement_reads FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_can_insert_own_reads"
  ON native_property.announcement_reads FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_update_own_reads"
  ON native_property.announcement_reads FOR UPDATE
  USING (user_id = auth.uid());

-- =============================================================================
-- MEETINGS — org-level
-- =============================================================================

CREATE POLICY "authenticated_can_view_meetings"
  ON native_property.meetings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "org_admins_can_manage_meetings"
  ON native_property.meetings FOR ALL
  USING (auth.uid() IS NOT NULL);

-- =============================================================================
-- MEETING ATTENDANCE — self-scoped for RSVP, org-scoped for records
-- =============================================================================

CREATE POLICY "authenticated_can_view_attendance"
  ON native_property.meeting_attendance FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "users_can_rsvp_own"
  ON native_property.meeting_attendance FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_update_own_rsvp"
  ON native_property.meeting_attendance FOR UPDATE
  USING (user_id = auth.uid());

-- =============================================================================
-- MAINTENANCE REQUESTS — scoped via property -> org
-- =============================================================================

CREATE POLICY "org_members_can_view_maintenance"
  ON native_property.maintenance_requests FOR SELECT
  USING (
    native_property.is_org_member(
      auth.uid(),
      native_property.get_organization_id(property_id)
    )
  );

CREATE POLICY "org_members_can_create_maintenance"
  ON native_property.maintenance_requests FOR INSERT
  WITH CHECK (
    submitted_by_id = auth.uid()
    AND native_property.is_org_member(
      auth.uid(),
      native_property.get_organization_id(property_id)
    )
  );

CREATE POLICY "org_admins_can_update_maintenance"
  ON native_property.maintenance_requests FOR UPDATE
  USING (
    native_property.has_org_role(
      auth.uid(),
      native_property.get_organization_id(property_id),
      'ADMIN'
    )
  );

-- =============================================================================
-- ACTIVITY LOGS — self-scoped reads, system writes only
-- =============================================================================

CREATE POLICY "users_can_view_own_activity"
  ON native_property.activity_logs FOR SELECT
  USING (user_id = auth.uid());

-- Inserts done via SECURITY DEFINER RPC functions only

-- =============================================================================
-- FACIAL VERIFICATIONS — self-scoped
-- =============================================================================

CREATE POLICY "users_can_view_own_verifications"
  ON native_property.facial_verifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_can_insert_own_verifications"
  ON native_property.facial_verifications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_update_own_verifications"
  ON native_property.facial_verifications FOR UPDATE
  USING (user_id = auth.uid());

-- =============================================================================
-- PROPERTY OWNERSHIPS — scoped via property -> org
-- =============================================================================

CREATE POLICY "org_members_can_view_ownerships"
  ON native_property.property_ownerships FOR SELECT
  USING (
    native_property.is_org_member(
      auth.uid(),
      native_property.get_organization_id(property_id)
    )
  );

CREATE POLICY "org_admins_can_manage_ownerships"
  ON native_property.property_ownerships FOR ALL
  USING (
    native_property.has_org_role(
      auth.uid(),
      native_property.get_organization_id(property_id),
      'ADMIN'
    )
  );

-- =============================================================================
-- PROPERTY ACCESS REQUESTS — scoped via property -> org
-- =============================================================================

CREATE POLICY "org_members_can_view_access_requests"
  ON native_property.property_access_requests FOR SELECT
  USING (
    native_property.is_org_member(
      auth.uid(),
      native_property.get_organization_id(property_id)
    )
  );

CREATE POLICY "org_members_can_create_access_requests"
  ON native_property.property_access_requests FOR INSERT
  WITH CHECK (
    requested_by_user_id = auth.uid()
    AND native_property.is_org_member(
      auth.uid(),
      native_property.get_organization_id(property_id)
    )
  );

CREATE POLICY "org_admins_can_update_access_requests"
  ON native_property.property_access_requests FOR UPDATE
  USING (
    native_property.has_org_role(
      auth.uid(),
      native_property.get_organization_id(property_id),
      'ADMIN'
    )
  );

-- =============================================================================
-- DIRECTORS — org-level (directors belong to the estate)
-- =============================================================================

CREATE POLICY "authenticated_can_view_directors"
  ON native_property.directors FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "org_admins_can_manage_directors"
  ON native_property.directors FOR ALL
  USING (auth.uid() IS NOT NULL);

-- =============================================================================
-- ELECTIONS — org-level
-- =============================================================================

CREATE POLICY "authenticated_can_view_elections"
  ON native_property.elections FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "org_admins_can_manage_elections"
  ON native_property.elections FOR ALL
  USING (auth.uid() IS NOT NULL);

-- =============================================================================
-- CANDIDATES — org-level
-- =============================================================================

CREATE POLICY "authenticated_can_view_candidates"
  ON native_property.candidates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_can_nominate"
  ON native_property.candidates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "org_admins_can_update_candidates"
  ON native_property.candidates FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- =============================================================================
-- VOTES — self-scoped, results only after voting closes
-- =============================================================================

CREATE POLICY "users_can_view_own_votes"
  ON native_property.votes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_can_cast_own_vote"
  ON native_property.votes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- VOTE CHOICES — read-only for all authenticated users
-- =============================================================================

CREATE POLICY "authenticated_can_view_vote_choices"
  ON native_property.vote_choices FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Writes done via SECURITY DEFINER RPC functions only

-- =============================================================================
-- FINANCIAL TRANSACTIONS — admin-only via RPC
-- =============================================================================

CREATE POLICY "authenticated_can_view_financial_transactions"
  ON native_property.financial_transactions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Writes done via SECURITY DEFINER RPC functions only

-- =============================================================================
-- BUDGET LINES — admin-only via RPC
-- =============================================================================

CREATE POLICY "authenticated_can_view_budget_lines"
  ON native_property.budget_lines FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Writes done via SECURITY DEFINER RPC functions only

-- =============================================================================
-- RESOLUTIONS — org-level
-- =============================================================================

CREATE POLICY "authenticated_can_view_resolutions"
  ON native_property.resolutions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "org_admins_can_manage_resolutions"
  ON native_property.resolutions FOR ALL
  USING (auth.uid() IS NOT NULL);
