# Native Estate

Multi-estate residential management for the Native Silicon suite. Managing agents run a **portfolio of estates**; each estate contains **units**, governance, maintenance, utilities, and finance.

## Product model

```
core.organizations (firm)
  └── native_estate.estates
        └── units (+ maintenance, elections, documents, …)
```

- **Brand:** Native Estate (`estate.nativesilicon.co.za`)
- **Org staff** (`OWNER` / `ADMIN` / `MANAGER`): portfolio hub + estate switcher
- **Estate roles** (`DIRECTOR` / `HOMEOWNER` / `TENANT` / `ACCOUNTANT`): estate-scoped shell
- **Routes:** `/portfolio`, `/e/:estateSlug/...`

## Stack

- **Frontend:** React 18, Vite, Tailwind, Supabase JS
- **Data:** Shared Supabase (`native_estate` schema + `core` identity)
- **Auth:** Supabase Auth + platform JWT `organizationId`

## Local development

```bash
cd frontend
cp .env.example .env   # set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## Migrations

See `supabase/migrations/`. Key files:

- `006_native_estate_multi_estate.sql` — rename path from legacy `native_property`
- `007_seed_multi_estate_demo.sql` — demo shapes
- `008_native_estate_cluster_bootstrap.sql` — fresh cluster bootstrap (TEXT org ids)

## Deploy

Image: `192.168.88.199:6800/native-estate:latest`  
Fleet: `sky-buster/k8s-fleet/native-estate` → `estate.nativesilicon.co.za`

```bash
# Build & push (example)
./build-and-push.sh
# Or GitHub Actions docker-publish workflow
```

## Docs

User and developer docs live under `docs/`. Prefer **Estate** / **Unit** language (not Property).
