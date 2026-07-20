-- =============================================================================
-- Migration 006: Native Estate multi-estate model
-- =============================================================================
-- Renames native_property → native_estate, introduces estates as the operational
-- child of core.organizations (Books businesses pattern), renames properties →
-- units, adds estate_id across domain tables, and estate_members for estate roles.
--
-- Depends on: 001–005
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Rename schema
-- -----------------------------------------------------------------------------
ALTER SCHEMA native_property RENAME TO native_estate;

-- -----------------------------------------------------------------------------
-- 2. Estates + estate membership
-- -----------------------------------------------------------------------------
CREATE TYPE native_estate.estate_role AS ENUM (
  'DIRECTOR', 'HOMEOWNER', 'TENANT', 'ACCOUNTANT'
);

CREATE TABLE native_estate.estates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  cover_url TEXT,
  address TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE INDEX idx_estates_organization_id ON native_estate.estates(organization_id);

CREATE TABLE native_estate.estate_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id UUID NOT NULL REFERENCES native_estate.estates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role native_estate.estate_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (estate_id, user_id)
);

CREATE INDEX idx_estate_members_user ON native_estate.estate_members(user_id);
CREATE INDEX idx_estate_members_estate ON native_estate.estate_members(estate_id);

-- -----------------------------------------------------------------------------
-- 3. Backfill one estate per distinct organization (legacy org-as-estate)
-- -----------------------------------------------------------------------------
INSERT INTO native_estate.estates (organization_id, name, slug, address)
SELECT DISTINCT
  p.organization_id,
  COALESCE(o.name, 'Estate') || ' Estate',
  lower(regexp_replace(COALESCE(o.slug, p.organization_id::text), '[^a-zA-Z0-9]+', '-', 'g')),
  (SELECT address FROM native_estate.properties p2
   WHERE p2.organization_id = p.organization_id
   ORDER BY p2.created_at LIMIT 1)
FROM native_estate.properties p
LEFT JOIN core.organizations o ON o.id = p.organization_id
ON CONFLICT (organization_id, slug) DO NOTHING;

-- Also create estates for org-scoped tables that may lack properties yet
INSERT INTO native_estate.estates (organization_id, name, slug)
SELECT DISTINCT
  d.organization_id,
  COALESCE(o.name, 'Estate') || ' Estate',
  lower(regexp_replace(COALESCE(o.slug, d.organization_id::text), '[^a-zA-Z0-9]+', '-', 'g'))
FROM native_estate.documents d
LEFT JOIN core.organizations o ON o.id = d.organization_id
WHERE NOT EXISTS (
  SELECT 1 FROM native_estate.estates e WHERE e.organization_id = d.organization_id
)
ON CONFLICT (organization_id, slug) DO NOTHING;

INSERT INTO native_estate.estates (organization_id, name, slug)
SELECT DISTINCT
  e.organization_id,
  COALESCE(o.name, 'Estate') || ' Estate',
  lower(regexp_replace(COALESCE(o.slug, e.organization_id::text), '[^a-zA-Z0-9]+', '-', 'g'))
FROM native_estate.elections e
LEFT JOIN core.organizations o ON o.id = e.organization_id
WHERE NOT EXISTS (
  SELECT 1 FROM native_estate.estates est WHERE est.organization_id = e.organization_id
)
ON CONFLICT (organization_id, slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. Rename properties → units; add estate_id
-- -----------------------------------------------------------------------------
ALTER TABLE native_estate.properties RENAME TO units;
ALTER TYPE native_estate.property_type RENAME TO unit_type;
ALTER TABLE native_estate.units RENAME COLUMN property_type TO unit_type;

ALTER TABLE native_estate.units
  ADD COLUMN estate_id UUID REFERENCES native_estate.estates(id) ON DELETE CASCADE;

UPDATE native_estate.units u
SET estate_id = e.id
FROM native_estate.estates e
WHERE e.organization_id = u.organization_id;

ALTER TABLE native_estate.units
  ALTER COLUMN estate_id SET NOT NULL;

-- Unit numbers unique per estate (not globally)
ALTER TABLE native_estate.units DROP CONSTRAINT IF EXISTS properties_unit_number_key;
ALTER TABLE native_estate.units DROP CONSTRAINT IF EXISTS units_unit_number_key;
CREATE UNIQUE INDEX idx_units_estate_unit_number ON native_estate.units(estate_id, unit_number);
CREATE INDEX idx_units_estate_id ON native_estate.units(estate_id);

-- Rename ownership / access tables for clarity
ALTER TABLE native_estate.property_ownerships RENAME TO unit_ownerships;
ALTER TABLE native_estate.unit_ownerships RENAME COLUMN property_id TO unit_id;

ALTER TABLE native_estate.property_access_requests RENAME TO unit_access_requests;
ALTER TABLE native_estate.unit_access_requests RENAME COLUMN property_id TO unit_id;
ALTER TYPE native_estate.property_access_status RENAME TO unit_access_status;

-- Child tables referencing units keep property_id column name → rename to unit_id
ALTER TABLE native_estate.utility_readings RENAME COLUMN property_id TO unit_id;
ALTER TABLE native_estate.payments RENAME COLUMN property_id TO unit_id;
ALTER TABLE native_estate.maintenance_requests RENAME COLUMN property_id TO unit_id;

-- -----------------------------------------------------------------------------
-- 5. Add estate_id to estate-scoped domain tables + backfill
-- -----------------------------------------------------------------------------
ALTER TABLE native_estate.documents ADD COLUMN estate_id UUID REFERENCES native_estate.estates(id) ON DELETE CASCADE;
ALTER TABLE native_estate.announcements ADD COLUMN estate_id UUID REFERENCES native_estate.estates(id) ON DELETE CASCADE;
ALTER TABLE native_estate.meetings ADD COLUMN estate_id UUID REFERENCES native_estate.estates(id) ON DELETE CASCADE;
ALTER TABLE native_estate.directors ADD COLUMN estate_id UUID REFERENCES native_estate.estates(id) ON DELETE CASCADE;
ALTER TABLE native_estate.elections ADD COLUMN estate_id UUID REFERENCES native_estate.estates(id) ON DELETE CASCADE;
ALTER TABLE native_estate.billing_cycles ADD COLUMN estate_id UUID REFERENCES native_estate.estates(id) ON DELETE CASCADE;
ALTER TABLE native_estate.budget_lines ADD COLUMN estate_id UUID REFERENCES native_estate.estates(id) ON DELETE CASCADE;
ALTER TABLE native_estate.financial_transactions ADD COLUMN estate_id UUID REFERENCES native_estate.estates(id) ON DELETE CASCADE;

UPDATE native_estate.documents d SET estate_id = e.id FROM native_estate.estates e WHERE e.organization_id = d.organization_id;
UPDATE native_estate.announcements a SET estate_id = e.id FROM native_estate.estates e WHERE e.organization_id = a.organization_id;
UPDATE native_estate.meetings m SET estate_id = e.id FROM native_estate.estates e WHERE e.organization_id = m.organization_id;
UPDATE native_estate.directors d SET estate_id = e.id FROM native_estate.estates e WHERE e.organization_id = d.organization_id;
UPDATE native_estate.elections el SET estate_id = e.id FROM native_estate.estates e WHERE e.organization_id = el.organization_id;
UPDATE native_estate.billing_cycles b SET estate_id = e.id FROM native_estate.estates e WHERE e.organization_id = b.organization_id;
UPDATE native_estate.budget_lines b SET estate_id = e.id FROM native_estate.estates e WHERE e.organization_id = b.organization_id;
UPDATE native_estate.financial_transactions t SET estate_id = e.id FROM native_estate.estates e WHERE e.organization_id = t.organization_id;

ALTER TABLE native_estate.documents ALTER COLUMN estate_id SET NOT NULL;
ALTER TABLE native_estate.announcements ALTER COLUMN estate_id SET NOT NULL;
ALTER TABLE native_estate.meetings ALTER COLUMN estate_id SET NOT NULL;
ALTER TABLE native_estate.directors ALTER COLUMN estate_id SET NOT NULL;
ALTER TABLE native_estate.elections ALTER COLUMN estate_id SET NOT NULL;
ALTER TABLE native_estate.billing_cycles ALTER COLUMN estate_id SET NOT NULL;
ALTER TABLE native_estate.budget_lines ALTER COLUMN estate_id SET NOT NULL;
ALTER TABLE native_estate.financial_transactions ALTER COLUMN estate_id SET NOT NULL;

CREATE INDEX idx_documents_estate ON native_estate.documents(estate_id);
CREATE INDEX idx_announcements_estate ON native_estate.announcements(estate_id);
CREATE INDEX idx_meetings_estate ON native_estate.meetings(estate_id);
CREATE INDEX idx_directors_estate ON native_estate.directors(estate_id);
CREATE INDEX idx_elections_estate ON native_estate.elections(estate_id);
CREATE INDEX idx_billing_cycles_estate ON native_estate.billing_cycles(estate_id);
CREATE INDEX idx_budget_lines_estate ON native_estate.budget_lines(estate_id);
CREATE INDEX idx_financial_transactions_estate ON native_estate.financial_transactions(estate_id);

-- -----------------------------------------------------------------------------
-- 6. Helper functions (org staff vs estate members)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION native_estate.is_org_staff(p_user_id UUID, p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE
SECURITY DEFINER
SET search_path = core, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM core.organization_members
    WHERE user_id = p_user_id
      AND organization_id = p_organization_id
      AND role IN ('OWNER', 'ADMIN', 'MANAGER')
  );
$$;

CREATE OR REPLACE FUNCTION native_estate.is_estate_member(p_user_id UUID, p_estate_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE
SECURITY DEFINER
SET search_path = native_estate, core, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM native_estate.estate_members em
    WHERE em.user_id = p_user_id AND em.estate_id = p_estate_id
  )
  OR EXISTS (
    SELECT 1 FROM native_estate.estates e
    JOIN core.organization_members om ON om.organization_id = e.organization_id
    WHERE e.id = p_estate_id
      AND om.user_id = p_user_id
      AND om.role IN ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  );
$$;

CREATE OR REPLACE FUNCTION native_estate.has_estate_role(
  p_user_id UUID,
  p_estate_id UUID,
  VARIADIC p_roles native_estate.estate_role[]
)
RETURNS BOOLEAN
LANGUAGE SQL STABLE
SECURITY DEFINER
SET search_path = native_estate, core, pg_temp
AS $$
  SELECT native_estate.is_org_staff(
           p_user_id,
           (SELECT organization_id FROM native_estate.estates WHERE id = p_estate_id)
         )
      OR EXISTS (
           SELECT 1 FROM native_estate.estate_members
           WHERE user_id = p_user_id
             AND estate_id = p_estate_id
             AND role = ANY (p_roles)
         );
$$;

-- Update get_organization_id to use units
CREATE OR REPLACE FUNCTION native_estate.get_organization_id(p_unit_id UUID)
RETURNS UUID
LANGUAGE SQL STABLE
SET search_path = native_estate, pg_temp
AS $$
  SELECT organization_id FROM native_estate.units WHERE id = p_unit_id;
$$;

CREATE OR REPLACE FUNCTION native_estate.get_estate_id_from_unit(p_unit_id UUID)
RETURNS UUID
LANGUAGE SQL STABLE
SET search_path = native_estate, pg_temp
AS $$
  SELECT estate_id FROM native_estate.units WHERE id = p_unit_id;
$$;

-- Keep legacy names as wrappers where RPCs may still call them
CREATE OR REPLACE FUNCTION native_estate.is_org_member(p_user_id UUID, p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE
SECURITY DEFINER
SET search_path = core, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM core.organization_members
    WHERE user_id = p_user_id AND organization_id = p_organization_id
  );
$$;

CREATE OR REPLACE FUNCTION native_estate.has_org_role(
  p_user_id UUID,
  p_organization_id UUID,
  p_role TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL STABLE
SECURITY DEFINER
SET search_path = core, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM core.organization_members
    WHERE user_id = p_user_id
      AND organization_id = p_organization_id
      AND (
        role::text = p_role
        OR (p_role = 'ADMIN' AND role IN ('OWNER', 'ADMIN', 'MANAGER'))
      )
  );
$$;

-- -----------------------------------------------------------------------------
-- 7. RLS for estates / estate_members / units
-- -----------------------------------------------------------------------------
ALTER TABLE native_estate.estates ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_estate.estate_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS estates_select ON native_estate.estates;
CREATE POLICY estates_select ON native_estate.estates
  FOR SELECT USING (
    native_estate.is_org_member(auth.uid(), organization_id)
    OR native_estate.is_estate_member(auth.uid(), id)
  );

DROP POLICY IF EXISTS estates_write ON native_estate.estates;
CREATE POLICY estates_insert ON native_estate.estates
  FOR INSERT WITH CHECK (native_estate.is_org_staff(auth.uid(), organization_id));
CREATE POLICY estates_update ON native_estate.estates
  FOR UPDATE USING (native_estate.is_org_staff(auth.uid(), organization_id));
CREATE POLICY estates_delete ON native_estate.estates
  FOR DELETE USING (native_estate.is_org_staff(auth.uid(), organization_id));

DROP POLICY IF EXISTS estate_members_select ON native_estate.estate_members;
CREATE POLICY estate_members_select ON native_estate.estate_members
  FOR SELECT USING (native_estate.is_estate_member(auth.uid(), estate_id));

CREATE POLICY estate_members_write ON native_estate.estate_members
  FOR ALL USING (
    native_estate.is_org_staff(
      auth.uid(),
      (SELECT organization_id FROM native_estate.estates WHERE id = estate_id)
    )
  );

-- Units: replace properties policies if present
DROP POLICY IF EXISTS properties_select ON native_estate.units;
DROP POLICY IF EXISTS properties_insert ON native_estate.units;
DROP POLICY IF EXISTS properties_update ON native_estate.units;
DROP POLICY IF EXISTS properties_delete ON native_estate.units;
DROP POLICY IF EXISTS units_select ON native_estate.units;
DROP POLICY IF EXISTS units_insert ON native_estate.units;
DROP POLICY IF EXISTS units_update ON native_estate.units;
DROP POLICY IF EXISTS units_delete ON native_estate.units;

CREATE POLICY units_select ON native_estate.units
  FOR SELECT USING (native_estate.is_estate_member(auth.uid(), estate_id));
CREATE POLICY units_insert ON native_estate.units
  FOR INSERT WITH CHECK (native_estate.is_org_staff(auth.uid(), organization_id)
    OR native_estate.has_estate_role(auth.uid(), estate_id, 'DIRECTOR'));
CREATE POLICY units_update ON native_estate.units
  FOR UPDATE USING (native_estate.is_org_staff(auth.uid(), organization_id)
    OR native_estate.has_estate_role(auth.uid(), estate_id, 'DIRECTOR'));
CREATE POLICY units_delete ON native_estate.units
  FOR DELETE USING (native_estate.is_org_staff(auth.uid(), organization_id));

GRANT USAGE ON SCHEMA native_estate TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA native_estate TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA native_estate TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA native_estate TO anon;

COMMENT ON SCHEMA native_estate IS 'Native Estate — multi-estate residential management (org → estates → units)';
COMMENT ON TABLE native_estate.estates IS 'Operational estate under a core.organizations firm (cf. native_books.businesses)';
COMMENT ON TABLE native_estate.units IS 'Dwelling units within an estate (formerly properties)';
