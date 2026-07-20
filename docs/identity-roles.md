# Identity & role model (Native Estate)

Part of [#3](https://github.com/Native-Silicon-Holdings/native-property/issues/3).

## Auth path

1. **Humans authenticate via Authentik** (cluster-wide IdP).
2. **Supabase GoTrue** accepts that identity via **SAML** (not generic OIDC — see `k8s-fleet/docs/auth-cluster-wide.md`).
3. The SPA holds a **Supabase Auth session**; app profile is loaded from `core.users` bridged by `supabase_id = auth.uid()`.

Local/dev may still use email+password against Supabase Auth. Production login should use SSO (`signInWithSSO`) against the org email domain registered with GoTrue.

## Two-tier roles

Native Estate does **not** map estate governance roles onto `organization_members.role` directly. Roles are split the same way Native Books splits org staff vs business membership.

### Organization layer — `core.organization_members.role`

| OrgRole   | Meaning                                      | App chrome                          |
|-----------|----------------------------------------------|-------------------------------------|
| `OWNER`   | Managing-agent / firm owner                  | Portfolio staff (`isOrgStaff`)      |
| `ADMIN`   | Firm admin                                   | Portfolio staff                     |
| `MANAGER` | Firm manager                                 | Portfolio staff                     |
| `MEMBER`  | Org member without portfolio chrome          | Estate access only if also in estate|

`isOrgStaff` = role ∈ {`OWNER`, `ADMIN`, `MANAGER`}. Staff see `/portfolio` and the estate switcher; they can manage all estates under the active org (JWT `app_metadata.organizationId` preferred).

### Estate layer — `native_estate.estate_members.role`

| EstateRole   | Meaning                         | Typical UI                         |
|--------------|---------------------------------|------------------------------------|
| `DIRECTOR`   | Board / estate director         | Estate admin modules               |
| `HOMEOWNER`  | Unit owner                      | Resident modules                   |
| `TENANT`     | Occupant                        | Limited resident modules           |
| `ACCOUNTANT` | Estate finance                  | Financial + utilities              |

Directors/homeowners are **limited to estates they belong to** via `estate_members`, not via org ADMIN.

## Legacy map (pre-migration `UserRole`)

| Old single-tenant role | Now                                              |
|------------------------|--------------------------------------------------|
| `DIRECTOR`             | `estate_members.role = DIRECTOR` (+ optional org MEMBER) |
| `MANAGER`              | Prefer `organization_members.role = MANAGER` (org staff) |
| `HOMEOWNER`            | `estate_members.role = HOMEOWNER`                |
| `TENANT`               | `estate_members.role = TENANT`                   |
| `ACCOUNTANT`           | `estate_members.role = ACCOUNTANT`               |

RLS/RPCs that still check org `ADMIN` for estate director actions are tracked under [#18](https://github.com/Native-Silicon-Holdings/native-property/issues/18). Prefer `native_estate.has_estate_role(..., 'DIRECTOR')` or org staff (`OWNER`/`ADMIN`/`MANAGER`) for writes that should be allowed to either layer.

## Frontend usage

- Prefer `user.orgRole` / `user.isOrgStaff` / `user.estateRole`.
- `user.role` is **deprecated** (combined fallback for older pages).
- Use `user.coreUserId` (cuid) for FKs into `core` / `native_estate`, not the Supabase Auth UUID (`user.id`).

## Signup / provisioning

- Authentik user provision + `core.users` row + first org membership follow the shared Native Silicon signup pattern (native-one).
- SPA `register()` only ensures a `core.users` row exists for `supabase_id` after Supabase sign-up; org/estate membership is assigned by an admin or onboarding flow — self-serve does not invent an organization.
