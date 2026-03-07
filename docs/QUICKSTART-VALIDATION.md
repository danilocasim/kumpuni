# Quickstart validation checklist (T061)

**Purpose**: Manual end-to-end validation after setup or deploy.  
**Reference**: [quickstart.md](../specs/001-kumpuni-mvp/quickstart.md)

---

## Prerequisites

- [ ] Node 18+ installed
- [ ] pnpm or npm
- [ ] Supabase project created; PostGIS enabled
- [ ] Twilio account (Phone OTP + SMS); phone number configured in Supabase Auth → Phone

---

## 1. Install and env

- [ ] `git checkout 001-kumpuni-mvp` (or your branch)
- [ ] `pnpm install` or `npm install`
- [ ] `.env.local` present with: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- [ ] `pnpm dev` or `npm run dev`; open [http://localhost:3000](http://localhost:3000)

---

## 2. Supabase

- [ ] All migrations applied (users, worker_profiles, jobs, job_interests, reviews, RLS, storage)
- [ ] Storage buckets: avatars, portfolios, jobs (public); verification (private)
- [ ] Auth → Phone provider enabled with Twilio credentials; test number verified (if Twilio trial)

---

## 3. Homeowner flow

- [ ] Landing: “MAG-POST NG JOB” / “Mag-sign up as Worker” visible
- [ ] Log in as homeowner (OTP); redirect to job post or dashboard
- [ ] Post a job: category, description, location (map/barangay), urgency, optional budget; submit
- [ ] Dashboard: new job listed; status “Bukas”; can open detail
- [ ] Job detail: Fast Match (ASAP) or “Tingnan ang workers” (Flexible); no worker-only actions

---

## 4. Worker flow

- [ ] Sign up as worker (OTP); complete worker setup (skills, service area, rates, profile photo, optional portfolio)
- [ ] Worker dashboard: availability, active job (if any), job history; profile completeness “Kumpleto” / “Kulang pa”
- [ ] Worker jobs list: see open jobs (within radius/availability)
- [ ] Open a job: express interest (Fast) or contact (Flexible); status updates (On my way, Completed)
- [ ] Worker cannot access “Mag-post” or homeowner dashboard; redirect with Taglish message

---

## 5. Matching and status

- [ ] Fast Match: ASAP job; workers get push/SMS; list updates in real time; homeowner can select worker
- [ ] Flexible: browse workers (list + map); contact reveals phone
- [ ] After select worker: job status “Na-match”; worker can set “On my way”, then “Completed”
- [ ] Homeowner can confirm completion; both can leave review

---

## 6. Edge cases and copy

- [ ] Location: deny geolocation → message “Na-deny ang location permission…” or “Hindi makuha ang lokasyon…”; can still pick on map/barangay
- [ ] Fast Match: no workers in radius / no interest → message about auto-convert to Flexible after 15 min
- [ ] Worker profile with no reviews: “Walang reviews.” and neutral display
- [ ] UI copy in Taglish: errors “Subukan muli”, CTAs and labels in Taglish where specified

---

## 7. Deploy (if applicable)

- [ ] Vercel project connected; env vars set
- [ ] Build succeeds; cron routes protected (if using Vercel Cron)
- [ ] Production URL: login, post job, worker flow, maps (Leaflet) work

---

**Sign-off**: _________________ Date: __________
