# Tasks: Kumpuni MVP

**Input**: Design documents from `/specs/001-kumpuni-mvp/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested in spec; manual validation per quickstart.md. No test tasks included.

**Organization**: Tasks grouped by user story (US1–US8) for independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story (US1–US8); Setup and Foundational have no story label
- Include exact file paths in descriptions

## Path Conventions

- Next.js App Router at repo root: `app/`, `components/`, `lib/`
- API routes: `app/api/`
- Supabase client and env: `lib/supabase/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create Next.js 14 project with App Router, TypeScript, and Tailwind in repository root per plan.md
- [x] T002 [P] Add dependencies: @supabase/supabase-js, react-leaflet, leaflet, browser-image-compression, and type definitions in package.json
- [x] T003 [P] Configure Tailwind for mobile-first (touch targets ≥44px) in tailwind.config.ts
- [x] T004 Create app/layout.tsx and app/globals.css with base layout and Taglish-ready font
- [x] T005 Create lib/supabase/client.ts and lib/supabase/server.ts for browser and server Supabase client
- [x] T006 Create .env.local.example with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, TWILIO_* (OTP + SMS)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story. No user story work until this phase is complete.

- [x] T007 Create Supabase migration: enable PostGIS extension and create enums (user_role, experience_level, availability, job category, urgency, status, matching_mode) per data-model.md
- [x] T008 Create Supabase migration: users table (id PK Auth UID, phone unique E.164, display_name, avatar_url, user_role, location geography, barangay, created_at, updated_at) with RLS (read/write own)
- [x] T009 Create Supabase migration: worker_profiles table with all columns and RLS per data-model.md
- [x] T010 Create Supabase migration: jobs table with all columns and RLS (homeowner CRUD own; worker read when matched/feed)
- [x] T011 Create Supabase migration: job_interests and reviews tables with RLS per data-model.md
- [x] T012 Create Supabase Storage buckets avatars, portfolios, jobs (public) and verification (private, admin-only RLS)
- [x] T013 Implement app/api/auth/otp/send/route.ts: send OTP via Twilio, rate limit 3 per phone per 15 min, return Taglish error + "Subukan muli" on failure
- [x] T014 Implement app/api/auth/otp/verify/route.ts: verify OTP, create/return Supabase session; on first sign-in upsert users (id from Auth UID, phone, display_name nullable, user_role nullable until path chosen)
- [x] T015 Create auth middleware or layout guard: redirect unauthenticated users from protected routes; when user chooses path (homeowner vs worker) set users.user_role and persist
- [x] T016 Implement app/page.tsx landing with "Mag-post ng Job" and "Mag-sign Up as Worker" CTAs (Taglish)
- [x] T017 Implement app/how-it-works/page.tsx 3-step visual guide (Taglish)
- [x] T018 Create shared navigation component in components/Nav.tsx with role-aware links (homeowner vs worker)
- [x] T019 Implement Web Push infrastructure: service worker for push, permission request flow, store subscription (e.g. in worker_profiles or users); used by Fast Match to notify workers in T026

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 — Job Posting (Homeowner) (Priority: P1)

**Goal**: Homeowner can post a job (category, description, up to 3 photos &lt;500KB, location, urgency, budget) in under 60 seconds.

**Independent Test**: Complete full job post in &lt;60s; photos under 500KB; job visible in list.

- [x] T020 [P] [US1] Create Leaflet location picker in components/LocationPicker.tsx: geolocation + manual pin, OSM tiles; output coordinates and barangay (reverse geocode from pin or manual barangay dropdown for Metro Manila)
- [x] T021 [P] [US1] Create photo upload component with client-side browser-image-compression (target &lt;500KB, max 1200px) in components/JobPhotoUpload.tsx; max 3 photos
- [x] T022 [US1] Implement app/jobs/new/page.tsx: category select (Plumbing, Electrical, Carpentry, Painting, Masonry, General), description (max 500 chars), LocationPicker (outputs location + barangay), urgency (Today/ASAP, This Week, Flexible), optional budget dropdown (Under ₱1k–₱10k+, Not Sure); Taglish labels
- [x] T023 [US1] Implement job creation: on submit insert into jobs (homeowner_id, category, description, photo_urls from Supabase Storage jobs bucket, location and barangay from LocationPicker output, urgency, budget_range, status open, matching_mode fast if ASAP else flexible, set fast_match_expires_at if ASAP to now+15min); redirect to /jobs/[id]/fast or /jobs/[id]/browse
- [x] T024 [US1] Implement app/dashboard/page.tsx: list homeowner's jobs with status badges (Open, Matched, In Progress, Completed, Cancelled); link to job detail

**Checkpoint**: US1 complete — homeowner can post job and see it on dashboard

---

## Phase 4: User Story 2 — Fast Matching (Priority: P2)

**Goal**: ASAP jobs trigger Fast Match; workers notified (push + SMS); 15-min countdown; real-time interested list; select worker reveals contact; auto-convert to Flexible if no interest.

**Independent Test**: Post ASAP job; workers get push+SMS; homeowner sees live list; select worker reveals phone/address; after 15min no interest → Flexible + notify.

- [x] T025 [US2] On job insert (ASAP): query workers (availability available_now or open_anytime, category match, ST_DWithin 10km, no existing matched/in_progress job); send SMS via Twilio for each; send browser push using subscription from T019; store fast_match_expires_at
- [x] T026 [US2] Implement app/jobs/[id]/fast/page.tsx: Supabase Realtime subscription on job_interests for this job_id; display live list of interested workers (name, rating, distance, rate range, completed jobs); 15-min countdown; select one worker button
- [x] T027 [US2] On homeowner select worker: update jobs set worker_id, status matched, address revealed; reveal homeowner phone and job address to selected worker (e.g. via RLS or server endpoint); show contact/address on fast page and notify worker
- [x] T028 [US2] Implement app/api/cron/fast-match-expiry/route.ts (or Supabase Edge Function): find jobs where matching_mode=fast and fast_match_expires_at &lt; now() and status=open; set matching_mode=flexible; notify homeowner (in-app or push)
- [x] T029 [US2] Implement worker "I'm Interested" action: insert into job_interests (job_id, worker_id) with check worker has no other matched/in_progress job; show in app/worker/jobs/[id] for Fast Match jobs

**Checkpoint**: US2 complete — Fast Match flow end-to-end

---

## Phase 5: User Story 3 — Flexible Matching (Priority: P3)

**Goal**: This Week/Flexible jobs show browseable worker list + Leaflet map (workers' approximate locations); composite sort; min rating dropdown; tap Contact reveals phone.

**Independent Test**: Post This Week job; see list + map; sort by composite score; min rating 1–5 dropdown; Contact reveals phone.

- [x] T030 [US3] Implement Flexible Match query: workers within 15km (ST_DWithin), category match, availability this_week/weekends/open_anytime, avg_rating >= min_rating (default 3.0), exclude workers with job in matched/in_progress; sort by (avg_rating*0.4 + proximity*0.3 + total_jobs*0.2 + response_rate*0.1) normalized
- [x] T031 [US3] Implement app/jobs/[id]/browse/page.tsx: min rating dropdown (1.0, 2.0, 3.0, 4.0, 5.0 default 3.0); worker list (photo, name, skill tags, rating, review count, rate range, distance, availability badge, completed jobs); Taglish
- [x] T032 [US3] Add Leaflet map to browse page in app/jobs/[id]/browse/page.tsx showing workers' approximate locations (service_center only, no exact address); list and map in same view (Airbnb-style)
- [x] T033 [US3] Worker card tap: open full profile (photo, name, verification badge, skills, rating, rate range, service area map, availability, completed jobs, member since, last 5 reviews, portfolio); "Contact" button reveals worker phone (update RLS or server endpoint so homeowner can read worker phone after "contact" action for this job)
- [x] T034 [US3] Implement response_rate computation or trigger: % of Fast Match invitations in last 30 days where worker expressed interest within 15 min (from job_interests); store or compute for worker_profiles.response_rate for sort

**Checkpoint**: US3 complete — Flexible browse + map + Contact

---

## Phase 6: User Story 4 — Worker Registration & Profile (Priority: P4)

**Goal**: Workers register with phone OTP only; profile setup &lt;3 min (name, photo, skills, experience, rate, service area with Leaflet, ID upload); public profile with map.

**Independent Test**: New worker completes OTP + full profile in &lt;3 min; public profile shows all fields including Leaflet map.

- [x] T035 [US4] Implement app/worker/setup/page.tsx multi-step: step 1 OTP (link to auth); step 2 display name, profile photo upload (avatars bucket), skills multi-select, experience dropdown (1-2yr, 3-5yr, 5-10yr, 10yr+), rate_min/rate_max (PHP), Leaflet service area (pin + radius or barangay), government ID upload (verification bucket); optional bio (200 chars), portfolio (up to 6, portfolios bucket); create/update users (user_role worker) and worker_profiles
- [x] T036 [US4] Create Leaflet service area picker component in components/ServiceAreaPicker.tsx (center pin + radius or barangay multi-select); use in worker setup
- [x] T037 [US4] Implement app/workers/[id]/page.tsx public worker profile: photo, name, verification badge (is_verified), skill tags, rating, rate range, Leaflet map showing approximate service area (service_center + radius), availability, completed jobs, member since, last 5 reviews, portfolio gallery; login required to show "Contact" (reuse Flexible Contact flow or link to job creation)
- [x] T038 [US4] Ensure RLS: worker_profiles readable by public for profile view (limited columns); phone and valid_id_url never exposed to homeowners

**Checkpoint**: US4 complete — workers can register and have public profile with map

---

## Phase 7: User Story 5 — Worker Availability & Job Management (Priority: P5)

**Goal**: Worker sets availability (5 options); job feed filtered by skills/area; I'm Interested for Fast; status flow On My Way → Started → Completed; 10 PM PHT reset; SMS digest 8 AM/2 PM PHT.

**Independent Test**: Set availability; see job feed; tap I'm Interested; update status; receive SMS digest at 8/2.

- [x] T039 [US5] Add availability section to app/worker/dashboard/page.tsx: availability toggle (Available Now, This Week, Weekends, Open Anytime, Not Available); persist to worker_profiles.availability
- [x] T040 [US5] Implement app/api/cron/availability-reset/route.ts: daily 10:00 PM PHT set worker_profiles.availability = not_available where override not set
- [x] T041 [US5] Implement app/worker/jobs/page.tsx: job feed filtered by worker skills and ST_DWithin(job.location, worker service_center, radius); each card category, description preview, barangay + distance, urgency badge, budget range, time posted, number of interested workers (for Fast); link to job detail
- [x] T042 [US5] Implement app/worker/jobs/[id]/page.tsx: for open Fast Match job show "I'm Interested" (calls job_interests insert); for matched job show status and homeowner contact/address; status buttons On My Way, Started, Completed (update jobs.status and jobs.completed_at when Completed)
- [x] T043 [US5] Implement app/api/cron/sms-digest/route.ts: at 8:00 AM and 2:00 PM PHT build digest of new/relevant Flexible jobs per worker (skills + area); send via Twilio
- [x] T044 [US5] Enforce one active job per worker: when inserting job_interests or when homeowner selects worker, reject if worker already has a job in matched or in_progress; exclude such workers from Fast/Flexible match queries (already in T030/T026)

**Checkpoint**: US5 complete — worker availability, feed, interest, status, cron

---

## Phase 8: User Story 6 — Job Status Tracking (Priority: P6)

**Goal**: Both parties see real-time status (Open → Matched → In Progress → Completed/Cancelled); worker marks Completed → homeowner confirm + review prompt; 48h auto-complete; either can cancel before In Progress.

**Independent Test**: Status updates in real time; confirm + review on Completed; 48h auto-complete; cancel before In Progress.

- [ ] T045 [US6] Implement app/jobs/[id]/page.tsx (homeowner): Supabase Realtime subscription on jobs for this id; show status timeline (Open, Matched, In Progress, Completed/Cancelled); when status=completed and worker set it, show "Confirm completion and leave review" CTA linking to /jobs/[id]/review
- [ ] T046 [US6] Implement 48-hour auto-complete: cron or Edge Function finds jobs where worker set status=completed but homeowner not confirmed; after 48h set completed_at if not set and treat as completed (allow review prompt to remain available)
- [ ] T047 [US6] Implement cancel: on app/jobs/[id] and app/worker/jobs/[id] show Cancel button when status is open or matched (not in_progress); update jobs.status = cancelled; apply RLS so both parties can update status for cancel
- [ ] T048 [US6] Ensure job detail page for worker app/worker/jobs/[id] shows real-time status and same cancel/status flow

**Checkpoint**: US6 complete — status tracking and cancel

---

## Phase 9: User Story 7 — Ratings & Reviews (Priority: P7)

**Goal**: After completion both parties rate (1–5 stars, optional comment, Taglish tags); mutual blind until both submit or 48h; reviewee one response (200 chars); public; worker &lt;2.5 after 5+ reviews flagged for admin.

**Independent Test**: Submit rating + tags; reviewee adds response; ratings hidden until both or 48h; flag low-rated workers.

- [ ] T049 [US7] Implement app/jobs/[id]/review/page.tsx: form 1–5 stars (required), comment (max 300 chars), multi-select Taglish tags (Maagap, Malinis ang trabaho, Mabait, Sulit, Mahal, Na-late); submit inserts into reviews (job_id, reviewer_id, reviewee_id, rating, comment, tags); do not show other party's rating until both submitted or 48h passed
- [ ] T050 [US7] Implement review display: on worker profile and job history show reviews (rating, comment, tags); reviewee can add one response (max 200 chars) — update reviews.response with RLS so only reviewee can update own row's response once
- [ ] T051 [US7] After each new review for a worker, recompute worker_profiles.avg_rating; add admin flag or column when avg_rating &lt; 2.5 and review count >= 5 (admin review via Supabase Studio per spec)
- [ ] T052 [US7] Prompt both parties to review from job detail or dashboard when job is completed; link to /jobs/[id]/review with reviewee context

**Checkpoint**: US7 complete — mutual blind reviews and responses

---

## Phase 10: User Story 8 — Worker Dashboard (Priority: P8)

**Goal**: Dashboard shows availability toggle, active job, job history, self-reported earnings, profile completeness.

**Independent Test**: Toggle availability; see active job and history; log earnings; see completeness.

- [ ] T053 [US8] Add active job section and job history list to app/worker/dashboard/page.tsx (availability section already from T039); show active job with status and homeowner contact/address, job history (dates, categories, ratings) (if any job in matched or in_progress show it with status and homeowner contact/address); job history list (dates, categories, ratings)
- [ ] T054 [US8] Add earnings self-report: on dashboard or job detail for completed jobs, worker can set worker_reported_amount (PHP) for own records; update jobs.worker_reported_amount with RLS
- [ ] T055 [US8] Add profile completeness indicator on app/worker/dashboard/page.tsx: check required fields and is_verified; display e.g. "Kumpleto" / "Kulang pa" with missing items (Taglish)

**Checkpoint**: US8 complete — worker dashboard with earnings and completeness

---

## Phase 11: Polish & Cross-Cutting

**Purpose**: Mobile optimization, Taglish copy, edge cases, deploy

- [ ] T056 [P] Audit all UI copy for Taglish (labels, errors, CTAs, placeholders); replace any English-only strings; ensure "Subukan muli" and error messages in Taglish
- [ ] T057 [P] Mobile pass: ensure touch targets ≥44px; one-thumb flows; page weight &lt;500KB excluding uploads (images lazy, compress assets)
- [ ] T058 Handle edge cases: geolocation denied → manual location only in LocationPicker; no workers in radius for Fast Match → show message, rely on auto-convert to Flexible; worker with no reviews → show "Walang reviews" and neutral response_rate in sort
- [ ] T059 Add app/worker/profile/page.tsx for edit profile, portfolio, rates (and service area if needed) reusing setup components
- [ ] T060 Document Vercel deploy: env vars, optional cron for /api/cron/fast-match-expiry, availability-reset, sms-digest; run quickstart.md validation
- [ ] T061 Run quickstart.md validation checklist end-to-end (manual)

---

## Dependencies & Execution Order

### Phase order

- Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1) → … → Phase 11 (Polish).
- Phase 2 must complete before any user story.
- US1 (job posting) before US2/US3 (matching needs jobs). US4 (worker reg) before US2/US3 (matching needs workers). US2/US3 can proceed after US1 and US4. US5–US8 build on matching and status.

### Story dependencies

- **US1**: Depends on Foundation (auth, users, jobs table, storage).
- **US2**: Depends on US1 (jobs), US4 (workers), Foundation (job_interests, Realtime, SMS).
- **US3**: Depends on US1, US4, Foundation (worker_profiles with response_rate/avg_rating).
- **US4**: Depends on Foundation (auth, users, worker_profiles, storage).
- **US5**: Depends on US4, Foundation (jobs feed query).
- **US6**: Depends on US2/US3 (matched jobs), Foundation (Realtime).
- **US7**: Depends on US6 (completed jobs), reviews table.
- **US8**: Depends on US4, US5, US6.

### Parallel within phases

- T002 and T003; T020 and T021; T056 and T057 can run in parallel with other [P] tasks in their phase.

---

## Implementation Strategy

### MVP first (US1 only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1). Validate: homeowner can post job in &lt;60s, see job on dashboard.
3. Stop and validate; then add US4 (workers) and US2/US3 (matching) for end-to-end flow.

### Incremental delivery

1. Setup + Foundation → deploy landing and auth.
2. US1 → homeowners can post jobs (MVP value).
3. US4 → workers can register.
4. US2 + US3 → matching (Fast + Flexible).
5. US5, US6, US7, US8 → full worker and review flow.
6. Polish → Taglish, mobile, deploy.

---

## Task Summary

| Phase        | Story | Task count | Parallel (P) |
|-------------|-------|------------|--------------|
| 1 Setup     | —     | 6          | 2            |
| 2 Foundational | —   | 13         | 0            |
| 3 US1       | US1   | 5          | 2            |
| 4 US2       | US2   | 5          | 0            |
| 5 US3       | US3   | 5          | 0            |
| 6 US4       | US4   | 4          | 0            |
| 7 US5       | US5   | 6          | 0            |
| 8 US6       | US6   | 4          | 0            |
| 9 US7       | US7   | 4          | 0            |
| 10 US8      | US8   | 3          | 0            |
| 11 Polish   | —     | 6          | 2            |
| **Total**   |       | **61**     | **6**        |

**Suggested MVP scope**: Phase 1 + Phase 2 + Phase 3 (US1) = 24 tasks (T001–T024). Then add US4 and US2/US3 for first end-to-end match.
