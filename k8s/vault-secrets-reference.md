# =============================================================================
# Vault Secrets Reference for native-property
# =============================================================================
# Vault path: secret/apps/native-property/app
#
# These values are the SAME as other apps since native-property now uses
# the shared self-hosted Supabase instance.
# =============================================================================

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# =============================================================================
# Authentik OIDC Application Registration
# =============================================================================
# Register in Authentik admin:
#   Application: native-property
#   Slug: native-property
#   Provider type: OAuth2/OIDC
#   Redirect URIs: https://property.nativesilicon.co.za/dashboard
#   Client ID/Secret: generate and store in Vault
#
# See k8s-fleet/docs/auth-cluster-wide.md for the full Authentik setup pattern
# used by native-one, native-books, native-professionals, and native-pathfinder.
# =============================================================================
