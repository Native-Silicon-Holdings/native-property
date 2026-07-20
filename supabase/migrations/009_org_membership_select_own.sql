-- =============================================================================
-- Migration 009: Allow reading own org memberships without JWT org claim
-- =============================================================================
-- organization_members was gated solely by jwt_org_id(), which creates a
-- chicken-and-egg: the SPA cannot discover memberships until the claim exists.
-- Add SELECT policies so authenticated users can read their own rows and orgs.
-- =============================================================================

DROP POLICY IF EXISTS organization_members_select_own ON core.organization_members;
CREATE POLICY organization_members_select_own ON core.organization_members
  FOR SELECT TO authenticated
  USING (
    user_id = (
      SELECT u.id FROM core.users u
      WHERE u.supabase_id = (SELECT auth.uid()::text)
      LIMIT 1
    )
  );

DROP POLICY IF EXISTS organizations_select_member ON core.organizations;
CREATE POLICY organizations_select_member ON core.organizations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM core.organization_members om
      JOIN core.users u ON u.id = om.user_id
      WHERE om.organization_id = organizations.id
        AND u.supabase_id = (SELECT auth.uid()::text)
    )
  );
