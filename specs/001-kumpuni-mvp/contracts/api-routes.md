# API Routes Contract: Kumpuni MVP

**Branch**: `001-kumpuni-mvp` | **Date**: 2025-03-07

Next.js API routes (server-side only). Used for OTP, SMS, and cron. All other data via Supabase client + RLS.

---

## Auth / OTP

| Method | Route (example) | Purpose |
|--------|------------------|---------|
| POST | `/api/auth/otp/send` | Send OTP via Twilio (E.164 phone); rate limit |
| POST | `/api/auth/otp/verify` | Verify OTP; create/return Supabase session |

Credentials in env only; never exposed to client.

---

## SMS (Worker Alerts)

| Method | Route (example) | Purpose |
|--------|------------------|---------|
| POST | `/api/sms/send` | Send one SMS via Twilio (internal: Fast Match alert or digest) |

Twilio credentials in env (same as OTP). Triggered from job creation or cron (8:00 AM / 2:00 PM digest for Flexible jobs).

---

## Cron / Scheduled

| Method | Route (example) | Purpose |
|--------|------------------|---------|
| POST | `/api/cron/fast-match-expiry` | Find jobs where matching_mode=fast and fast_match_expires_at &lt; now(); set to flexible; notify homeowner |
| POST | `/api/cron/availability-reset` | Daily 10:00 PM: set worker_profiles.availability to not_available (unless overridden) |
| POST | `/api/cron/sms-digest` | 8:00 AM and 2:00 PM: build and send batched SMS digest of Flexible jobs to workers |

Protect with secret header or Vercel Cron secret. Alternative: Supabase Edge Functions + pg_cron.
