-- =============================================================================
-- Migration 008: Cluster bootstrap for native_estate (TEXT organization ids)
-- =============================================================================
-- Cluster core.organizations.id is TEXT (cuid). Local 001–005 used UUID FKs.
-- This migration is safe to run on a fresh shared instance that has core but
-- no native_property/native_estate yet. It creates the multi-estate shape with
-- TEXT organization_id to match Native Silicon / Books.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS native_estate;

DO $$ BEGIN
  CREATE TYPE native_estate.estate_role AS ENUM (
    'DIRECTOR', 'HOMEOWNER', 'TENANT', 'ACCOUNTANT'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE native_estate.unit_type AS ENUM (
    'HOUSE', 'APARTMENT', 'TOWNHOUSE', 'COMMERCIAL'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS native_estate.estates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_estates_organization_id ON native_estate.estates(organization_id);

CREATE TABLE IF NOT EXISTS native_estate.estate_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estate_id UUID NOT NULL REFERENCES native_estate.estates(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role native_estate.estate_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (estate_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_estate_members_user ON native_estate.estate_members(user_id);

CREATE TABLE IF NOT EXISTS native_estate.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  estate_id UUID NOT NULL REFERENCES native_estate.estates(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  address TEXT NOT NULL,
  unit_type native_estate.unit_type NOT NULL,
  square_meters DOUBLE PRECISION NOT NULL DEFAULT 0,
  occupants INT NOT NULL DEFAULT 1,
  current_primary_owner_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (estate_id, unit_number)
);

CREATE INDEX IF NOT EXISTS idx_units_estate_id ON native_estate.units(estate_id);
CREATE INDEX IF NOT EXISTS idx_units_organization_id ON native_estate.units(organization_id);

-- Seed estates for existing orgs that have none (collapse + multi demo)
INSERT INTO native_estate.estates (organization_id, name, slug, settings)
SELECT
  o.id,
  COALESCE(o.name, 'Primary') || ' Estate',
  'primary',
  '{"seed": true}'::jsonb
FROM core.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM native_estate.estates e WHERE e.organization_id = o.id
)
ON CONFLICT (organization_id, slug) DO NOTHING;

-- Extra estates for high-capacity / enterprise firms (multi-estate demo)
INSERT INTO native_estate.estates (organization_id, name, slug, address, settings)
SELECT o.id, v.name, v.slug, v.address, '{"seed": true, "multi": true}'::jsonb
FROM core.organizations o
CROSS JOIN (VALUES
  ('Riverbend Estate', 'riverbend', '1 Riverbend Drive'),
  ('Hillcrest Gardens', 'hillcrest', '42 Hillcrest Avenue')
) AS v(name, slug, address)
WHERE (o.max_businesses >= 50 OR o.plan::text IN ('ENTERPRISE', 'ACCOUNTANT', 'PROFESSIONAL'))
ON CONFLICT (organization_id, slug) DO NOTHING;

ALTER TABLE native_estate.estates ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_estate.estate_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE native_estate.units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS estates_select ON native_estate.estates;
CREATE POLICY estates_select ON native_estate.estates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.organization_members om
      WHERE om.organization_id = estates.organization_id
        AND om.user_id = (
          SELECT u.id FROM core.users u WHERE u.supabase_id = auth.uid()::text LIMIT 1
        )
    )
  );

DROP POLICY IF EXISTS estates_staff_write ON native_estate.estates;
CREATE POLICY estates_staff_write ON native_estate.estates
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.organization_members om
      WHERE om.organization_id = estates.organization_id
        AND om.role IN ('OWNER', 'ADMIN', 'MANAGER')
        AND om.user_id = (
          SELECT u.id FROM core.users u WHERE u.supabase_id = auth.uid()::text LIMIT 1
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.organization_members om
      WHERE om.organization_id = estates.organization_id
        AND om.role IN ('OWNER', 'ADMIN', 'MANAGER')
        AND om.user_id = (
          SELECT u.id FROM core.users u WHERE u.supabase_id = auth.uid()::text LIMIT 1
        )
    )
  );

GRANT USAGE ON SCHEMA native_estate TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA native_estate TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA native_estate TO anon;

-- Entitlement: grant native-estate app to all existing orgs (idempotent)
INSERT INTO core.organization_entitlements (organization_id, app_key)
SELECT o.id, 'native-estate'
FROM core.organizations o
ON CONFLICT (organization_id, app_key) DO NOTHING;
