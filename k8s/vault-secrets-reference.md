# =============================================================================
# Vault Secrets Reference for Native Estate (infra name: native-property)
# =============================================================================
# Vault path: secret/apps/native-property/app
#
# These values are the SAME as other apps since Native Estate now uses
# the shared self-hosted Supabase instance.
# =============================================================================

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# =============================================================================
# Authentik OIDC Application Registration
# =============================================================================
# Register in Authentik admin:
#   Application: Native Estate
#   Slug: native-property
#   Provider type: OAuth2/OIDC
#   Redirect URIs: https://estate.nativesilicon.co.za/
#   Client ID/Secret: generate and store in Vault
#
# Supabase GoTrue uses Authentik via SAML (not OIDC). Register the SSO domain
# with GoTrue (`POST /admin/sso/providers`) and set VITE_SSO_DOMAIN accordingly.
# See k8s-fleet/docs/auth-cluster-wide.md and docs/identity-roles.md.
# =============================================================================

## Native Estate notes

- Product host: `estate.nativesilicon.co.za`
- Image: `192.168.88.199:6800/native-estate:latest`
- Entitlement: `core.organization_entitlements.app_key = native-estate`
- PostgREST must include `native_estate` in `PGRST_DB_SCHEMAS`
- Role model: org staff (`OWNER`/`ADMIN`/`MANAGER`) vs estate roles — see `docs/identity-roles.md`
