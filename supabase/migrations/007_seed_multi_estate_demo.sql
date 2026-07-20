-- =============================================================================
-- Migration 007: Seed multi-estate + single-estate demo shapes
-- =============================================================================
-- Idempotent helper for local/dev once core.organizations exist.
-- Does not create users — provision via Authentik + core.users (see docs/identity-roles.md).
-- Actual org IDs come from core; this only ensures demo estates exist when matching
-- org slugs/plans are present.
-- =============================================================================

-- Multi-estate firm: create two estates under orgs that look like managing agents
INSERT INTO native_estate.estates (organization_id, name, slug, address, cover_url, settings)
SELECT
  o.id,
  v.name,
  v.slug,
  v.address,
  v.cover_url,
  '{"demo": true, "multi": true}'::jsonb
FROM core.organizations o
CROSS JOIN (VALUES
  ('Riverbend Estate', 'riverbend', '1 Riverbend Drive', NULL),
  ('Hillcrest Gardens', 'hillcrest', '42 Hillcrest Avenue', NULL)
) AS v(name, slug, address, cover_url)
WHERE o.slug ILIKE '%alba%' OR o.max_businesses >= 50 OR o.plan::text = 'ENTERPRISE'
ON CONFLICT (organization_id, slug) DO NOTHING;

-- Ensure single-estate orgs still have exactly the collapse path (at least one estate)
INSERT INTO native_estate.estates (organization_id, name, slug, address, settings)
SELECT
  o.id,
  COALESCE(o.name, 'Primary') || ' Estate',
  'primary',
  NULL,
  '{"demo": true, "single": true}'::jsonb
FROM core.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM native_estate.estates e WHERE e.organization_id = o.id
)
ON CONFLICT (organization_id, slug) DO NOTHING;
