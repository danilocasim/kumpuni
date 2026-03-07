# Quickstart: Kumpuni MVP

**Branch**: `001-kumpuni-mvp` | **Date**: 2025-03-07

---

## Prerequisites

- Node 18+
- pnpm or npm
- Supabase project
- Twilio (Phone OTP + all SMS for worker alerts). Maps use Leaflet + OSM (no map API key required).

---

## 1. Install

```bash
git checkout 001-kumpuni-mvp
pnpm install
```

---

## 2. Environment

`.env.local` (do not commit):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+...

# All SMS (OTP + worker alerts) use Twilio above.

# Maps: Leaflet + OSM tiles (no key required). Optional: other tile URL if needed.
```

---

## 3. Supabase

- Create project; enable PostGIS: `CREATE EXTENSION IF NOT EXISTS postgis;`
- Run migrations for tables: users, worker_profiles, jobs, job_interests, reviews (see data-model.md)
- Enable RLS on all tables; add policies per data-model
- Storage buckets: avatars, portfolios, jobs (public); verification (private, admin-only RLS)

### OTP / Phone Auth (required to receive SMS codes)

OTP is sent by **Supabase Auth** using Twilio. Configure in the Supabase Dashboard (not in `.env`):

1. **Supabase Dashboard** → **Authentication** → **Providers** → **Phone** → **Enable**.
2. In the same Phone section, set:
   - **Twilio Account SID** (from [Twilio Console](https://console.twilio.com))
   - **Twilio Auth Token**
   - **Twilio Phone Number** (e.g. +1234567890 — the number that will send the SMS).
3. Use a **real** phone number in E.164 when testing: `+639171234567` (Philippines: +63 + 9 digits). The app normalizes `09171234567` → `+639171234567`.
4. **Twilio trial accounts**: you can only send SMS to **verified** numbers. In Twilio Console → Phone Numbers → Manage → Verified Caller IDs, add your test number (e.g. +639171234567). Until you verify it, OTP will not be delivered.

---

## 4. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 5. Deploy (Vercel)

- Connect repo; set env vars (see [docs/DEPLOY-VERCEL.md](../../docs/DEPLOY-VERCEL.md) for full list and optional cron).
- Maps use Leaflet (no API key). Optional: Vercel Cron for `/api/cron/fast-match-expiry`, `/api/cron/availability-reset`, `/api/cron/sms-digest`.
- After deploy, run the [Quickstart validation checklist](../../docs/QUICKSTART-VALIDATION.md) (T061) for end-to-end validation.
