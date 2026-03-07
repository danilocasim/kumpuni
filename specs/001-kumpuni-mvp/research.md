# Research: Kumpuni MVP

**Branch**: `001-kumpuni-mvp` | **Date**: 2025-03-07

Technical decisions from the plan input. No open NEEDS CLARIFICATION.

---

## 1. Frontend

**Decision**: Next.js 14 with App Router, TypeScript, Tailwind CSS.

**Rationale**: Constitution Article I (Next.js App Router); Article VIII (Tailwind utility classes, no custom design system). Single codebase; Vercel-native.

**Alternatives considered**: Remix, Vite+React — rejected to satisfy constitution and App Router layout/server-component benefits.

---

## 2. Backend & Database

**Decision**: Supabase only — PostgreSQL with PostGIS extension; no separate backend or Express.

**Rationale**: Constitution Article II. PostGIS required for ST_DWithin proximity (Fast and Flexible matching).

**Alternatives considered**: Custom Node + Postgres — rejected (constitution).

---

## 3. Auth

**Decision**: Supabase Auth with Phone OTP only; Twilio for OTP delivery.

**Rationale**: Article II: Phone OTP as ONLY auth method. Twilio integrated via Next.js API routes.

**Alternatives considered**: Email/password or social login — rejected by constitution.

---

## 4. Real-Time

**Decision**: Supabase Realtime (Postgres Changes) on `job_interests` (Fast Match list) and `jobs` (status).

**Rationale**: Article II requires Realtime for live job status and fast matching.

**Alternatives considered**: Polling or custom WebSocket — rejected; Realtime keeps stack simple.

---

## 5. File Storage

**Decision**: Supabase Storage — avatars (public), portfolios (public), jobs (public), verification (private, admin-only RLS).

**Rationale**: Article II (all uploads in Supabase); Article VII (verification private, admin-only).

**Alternatives considered**: S3 — rejected (single backend).

---

## 6. SMS (OTP + Worker Alerts)

**Decision**: Twilio for all SMS — Phone OTP (auth) and worker alerts (Fast Match instant, Flexible Match batched digests). Called from Next.js API routes (server-side, env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER).

**Rationale**: Single provider simplifies stack and ops. Article IX: SMS fallback for critical notifications. Twilio supports Philippines; trial/usage-based pricing.

**Alternatives considered**: Semaphore (PH local gateway) — Twilio chosen for one-vendor SMS (OTP already Twilio).

---

## 7. Maps & Proximity

**Decision**: Leaflet (e.g. react-leaflet) for all map UX: location picker (job posting, worker service area), worker-on-map browse (Flexible Matching, Airbnb-style), worker profile map. PostGIS ST_DWithin for proximity; worker location on map is approximate (service area center/radius) only.

**Rationale**: Spec clarification: Leaflet + worker location on map (Airbnb-style), same approach (PostGIS, proximity). Leaflet + OSM tiles avoid API key and cost; lightweight for budget phones.

**Alternatives considered**: Google Maps — rejected per spec (Leaflet). Mapbox — optional tile source; OSM default.

---

## 8. Image Compression

**Decision**: browser-image-compression (client-side); target &lt;500KB, max 1200px dimension.

**Rationale**: Article I (page weight, low-bandwidth); spec requires client-side compression before upload.

**Alternatives considered**: Server-only — rejected; client-side saves upload time on slow connections.

---

## 9. Hosting

**Decision**: Vercel (free tier).

**Rationale**: Native Next.js; minimal ops for MVP.

---

## 10. Fast Match Expiry & Availability Reset

**Decision**: `fast_match_expires_at` on job creation; client-side countdown; server-side cron or Supabase Edge Function to auto-convert expired fast-match jobs to flexible. Availability auto-reset at 10:00 PM via pg_cron or Edge Function.

**Rationale**: Spec requires 15-min window and 10 PM reset; must run server-side for reliability.

**Alternatives considered**: Client-only — rejected; conversion/reset must happen even if user closes tab.
