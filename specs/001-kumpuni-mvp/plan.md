# Implementation Plan: Kumpuni MVP

**Branch**: `001-kumpuni-mvp` | **Date**: 2025-03-07 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-kumpuni-mvp/spec.md`

## Summary

Kumpuni MVP connects Filipino homeowners with verified informal skilled workers for home repair jobs in Metro Manila (Quezon City / Pasig). Technical approach: Next.js 14 (App Router) + TypeScript + Tailwind; Supabase (PostgreSQL + PostGIS) as single backend; Phone OTP (Twilio); Supabase Realtime for job status and Fast Matching; Twilio for all SMS (OTP + worker alerts); **Leaflet** for all map UX (location picker, worker service area, worker-on-map browse Airbnb-style); client-side image compression (browser-image-compression, &lt;500KB, max 1200px). Six phases (Foundation → Homeowner → Worker → Matching → Notifications/Reviews → Polish) over ~6 weeks. Spec clarifications: response rate = % Fast Match invitations (last 30 days) where worker expressed interest within 15 min; scheduled times use PHT (UTC+8); OTP/SMS failure → Taglish error + "Subukan muli", rate limit 3 OTP per phone per 15 min; min rating dropdown 1.0–5.0 (default 3.0); one matched-or-in-progress job per worker; **maps = Leaflet, worker location on map = approximate (service area), Airbnb-style**.

## Technical Context

**Language/Version**: TypeScript 5.x, Node 18+  
**Primary Dependencies**: Next.js 14 (App Router), Tailwind CSS, Supabase JS client, Twilio (Phone OTP + worker SMS), **Leaflet** (react-leaflet or leaflet), browser-image-compression  
**Storage**: Supabase PostgreSQL + PostGIS; Supabase Storage (avatars, portfolios, jobs, verification buckets)  
**Testing**: Manual testing for MVP; optional Vitest/Playwright later  
**Target Platform**: Responsive web, mobile-first; budget Android (Samsung A-series, Vivo Y-series, Realme C-series); slow 3G/4G; Vercel (free tier)  
**Project Type**: web-application (single Next.js app, no separate backend server)  
**Performance Goals**: Job post &lt;60s; worker profile setup &lt;3 min; page weight &lt;500KB excluding uploads; Fast Match notifications within ~30s  
**Constraints**: Touch targets ≥44px; one-thumb flows; Supabase-only backend; no payment gateways; no AI/ML; OTP rate limit 3 per phone per 15 min; **map UX = Leaflet only; worker location on map = approximate (service area)**  
**Scale/Scope**: MVP Metro Manila (QC/Pasig); 5 DB tables + RLS; 4 storage buckets; one active (matched/in-progress) job per worker

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Requirement | Status |
|--------|--------------|--------|
| **I. Web-First, Mobile-Optimized** | Next.js App Router; no native apps; mobile-first; &lt;500KB; 44px touch; one-thumb flows | ✅ |
| **II. Supabase Single Backend** | PostgreSQL + PostGIS, Phone OTP only, Realtime, Storage; no Express beyond Next.js API routes | ✅ |
| **III. Cash-Only** | No payment gateways; worker self-report only | ✅ |
| **IV. No AI/ML** | No AI Vision, LLM, BoM, AI scheduling | ✅ |
| **V. Taglish-First** | All UI text Taglish; errors e.g. "Subukan muli" | ✅ |
| **VI. Two Matching Modes** | Fast (15-min) + Flexible both functional; auto-convert | ✅ |
| **VII. Privacy-by-Default** | Phone/address after match; verification bucket private; RLS all tables; worker on map = approximate only | ✅ |
| **VIII. Simplicity** | No Redux/Zustand; React state + Supabase; Tailwind only | ✅ |
| **IX. Worker-Centric** | Low-bandwidth, simple UI, SMS fallback | ✅ |

No constitution violations. Complexity Tracking: none.

## Project Structure

### Documentation (this feature)

```text
specs/001-kumpuni-mvp/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1 (page-routes, api-routes)
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── page.tsx                   # Landing
├── how-it-works/
├── workers/[id]/              # Public worker profile (map with service area)
├── jobs/
│   ├── new/                   # Job form + Leaflet location picker
│   ├── [id]/                  # detail, fast, browse (browse = list + Leaflet map)
│   └── ...
├── dashboard/
├── worker/
│   ├── setup/                 # Service area with Leaflet
│   ├── dashboard/
│   ├── jobs/
│   ├── profile/
│   └── reviews/
├── api/                       # OTP, SMS, cron
└── layout.tsx, globals.css

components/                     # e.g. Map (Leaflet), LocationPicker
lib/
public/
```

**Structure Decision**: Single Next.js 14 app. Supabase is the backend. Leaflet for all maps (job location picker, worker service area in setup and profile, worker-on-map in Flexible browse). PostGIS unchanged for proximity.

## Spec Clarifications (Implemented)

- **Response rate**: % Fast Match invitations last 30 days where worker expressed interest within 15 min.
- **Timezone**: PHT (UTC+8) for 10 PM availability reset, 8 AM/2 PM SMS digest.
- **OTP/SMS failure**: Taglish error + "Subukan muli"; max 3 OTP per phone per 15 min.
- **Min rating (Flexible)**: Dropdown 1.0–5.0 (default 3.0).
- **One active job per worker**: At most one Matched or In Progress; complete or cancel before next match.
- **Maps**: Leaflet for all map UX; worker location on map = approximate (service area center/radius), Airbnb-style; same approach (PostGIS, location picker, proximity) preserved.

## Database Tables (Summary)

**users**, **worker_profiles** (service_center geography for map), **jobs**, **job_interests**, **reviews** — unchanged. RLS on all. Match logic excludes workers with existing matched/in-progress job. Response rate computed from job_interests (Fast Match, last 30d).

## Page Structure

Public: `/`, `/how-it-works`, `/workers/:id` (profile + Leaflet map). Homeowner: `/jobs/new` (Leaflet picker), `/jobs/:id/fast`, `/jobs/:id/browse` (list + Leaflet worker map), `/dashboard`, `/jobs/:id`, `/jobs/:id/review`. Worker: `/worker/setup` (Leaflet service area), `/worker/dashboard`, `/worker/jobs`, `/worker/jobs/:id`, `/worker/profile`, `/worker/reviews`.

## Critical Implementation Notes

- **Maps**: Leaflet (e.g. react-leaflet) for location picker, worker service area (setup + profile), and Flexible browse map showing workers' approximate locations (service_center); tiles e.g. OSM (no API key required). Worker on map = approximate only; exact address only after match.
- Realtime: subscribe to `job_interests` and `jobs`.
- PostGIS: `ST_DWithin(worker_profiles.service_center, job.location, worker_profiles.service_radius_km * 1000)`.
- Flexible sort: `(avg_rating × 0.4) + (1/distance × 0.3) + (total_jobs × 0.2) + (response_rate × 0.1)`; response_rate from last 30d Fast Match.
- Fast Match: `fast_match_expires_at`; cron/Edge Function to auto-convert to flexible when expired.
- Availability reset: 10:00 PM PHT; SMS digest: 8:00 AM and 2:00 PM PHT.
- Client-side image compression (browser-image-compression) before upload.

## Implementation Phases

| Phase | Focus |
|-------|--------|
| **1 — Foundation (Week 1)** | Supabase, PostGIS, schema, RLS, Phone OTP, Next.js scaffold, landing, layout; add Leaflet dependency |
| **2 — Homeowner Flow (Week 2)** | Job posting with Leaflet location picker (geolocation + manual), photos, urgency, budget; job status real-time |
| **3 — Worker Flow (Week 3)** | Worker registration, profile/ID/portfolio, **Leaflet service area** (pin + radius), availability, job feed, one active job rule |
| **4 — Matching Engine (Week 4)** | Fast Match (Realtime, 15-min, auto-convert); Flexible with **Leaflet map** (workers' approximate locations, Airbnb-style), composite score, min rating dropdown |
| **5 — Notifications + Reviews (Week 5)** | Twilio SMS (alerts + digests), push, PHT digests; OTP/SMS error + rate limit; mutual blind reviews |
| **6 — Polish + Deploy (Week 6)** | Mobile pass, Taglish, edge cases, Vercel deploy |

## Complexity Tracking

None.
