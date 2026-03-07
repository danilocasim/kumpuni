# Deploy Kumpuni to Vercel

**Branch**: `001-kumpuni-mvp`

---

## 1. Connect repository

- Vercel Dashboard → Add New Project → Import Git repository (e.g. GitHub).
- Select the repo and branch `001-kumpuni-mvp` (or your deployment branch).
- Framework: **Next.js** (auto-detected).

---

## 2. Environment variables

Set these in Vercel → Project → Settings → Environment Variables (all environments or per env):

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only; never exposed to client) |
| `TWILIO_ACCOUNT_SID` | Yes | Twilio Account SID (Phone OTP + SMS) |
| `TWILIO_AUTH_TOKEN` | Yes | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Yes | Twilio phone number (e.g. `+1234567890`) |

**Notes:**

- Phone OTP and all worker SMS (alerts, digests) use Twilio; configure Supabase Auth → Phone provider with the same Twilio credentials in Supabase Dashboard.
- Maps use Leaflet + OSM tiles; no map API key is required.

---

## 3. Build and deploy

- Build Command: `npm run build` (or `pnpm build`).
- Output: Next.js default (`.next`).
- Deploy; Vercel will run `next build` and serve the app.

---

## 4. Optional: Vercel Cron (scheduled jobs)

For Fast Match expiry, daily availability reset, and SMS digest, call these API routes on a schedule. In the repo add `vercel.json` (or use Vercel Dashboard Cron):

```json
{
  "crons": [
    {
      "path": "/api/cron/fast-match-expiry",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/availability-reset",
      "schedule": "0 14 * * *"
    },
    {
      "path": "/api/cron/sms-digest",
      "schedule": "0 8 * * *"
    }
  ]
}
```

- **fast-match-expiry**: Converts ASAP jobs with no interest to Flexible after 15 min. Run every 5 minutes (or as needed).
- **availability-reset**: Sets all worker `availability` to `not_available` (e.g. 10 PM PHT = 14:00 UTC; adjust for your timezone).
- **sms-digest**: Sends daily digest SMS to workers (adjust schedule to desired time).

**Important:** Protect cron routes (e.g. with `CRON_SECRET` header check) so only Vercel Cron or your scheduler can call them. See existing route implementations for `Authorization` or `x-cron-secret` usage.

---

## 5. Post-deploy

- Run Supabase migrations on your Supabase project (PostGIS, users, worker_profiles, jobs, job_interests, reviews, RLS, storage buckets).
- In Supabase Dashboard → Authentication → Providers → Phone: enable and set Twilio SID, Token, and Phone Number.
- Test: sign up (OTP), post a job, worker flow, and map (Leaflet) on the deployed URL.

---

## Quickstart validation

After deploy, run through [quickstart.md](../specs/001-kumpuni-mvp/quickstart.md) and the [QUICKSTART-VALIDATION.md](./QUICKSTART-VALIDATION.md) checklist to validate end-to-end.
