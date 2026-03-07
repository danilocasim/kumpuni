# Feature Specification: Kumpuni MVP

**Feature Branch**: `001-kumpuni-mvp`  
**Created**: 2025-03-07  
**Status**: Draft  
**Input**: Build Kumpuni, a web platform that connects Filipino homeowners with verified informal skilled workers for home repair jobs. This is the MVP with eight feature sets (Job Posting, Fast Matching, Flexible Matching, Worker Registration & Profile, Worker Availability & Job Management, Job Status Tracking, Ratings & Reviews, Worker Dashboard).

## Clarifications

### Session 2025-03-07

- Q: How should "response rate" be defined for the worker composite score in Flexible Matching? → A: Percentage of Fast Match invitations (last 30 days) where the worker expressed interest within 15 minutes.
- Q: Availability auto-reset at 10:00 PM daily — which timezone? → A: Philippines Standard Time (PHT, UTC+8).
- Q: When OTP send or worker SMS fails, what should the user see and is retry allowed? → A: Show Taglish error + "Try again" (Subukan muli); allow retry with rate limit (e.g. max 3 OTP per phone per 15 min).
- Q: How is the minimum star rating "adjustable" in Flexible Matching? → A: Dropdown with options 1.0, 2.0, 3.0, 4.0, 5.0 (default 3.0).
- Q: Can a worker be matched to multiple jobs at once (e.g. two Matched or one In Progress + one Matched)? → A: One matched-or-in-progress job at a time; must complete or cancel before next match.
- Q: Which map library and should worker location be visible on a map (e.g. Airbnb-style)? → A: Use Leaflet for all map UX; show worker location/service area on map (Airbnb-style) when browsing workers or viewing worker profile; adapt current approach (same flows, PostGIS proximity, location picker). Worker location on map is approximate (service area/center), not exact address.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Job Posting (Homeowner) (Priority: P1)

A homeowner opens the app, selects a service category (Plumbing, Electrical, Carpentry, Painting, Masonry, General Repair), writes a short description of the problem (max 500 characters), optionally uploads up to 3 photos of the issue, sets their location via browser geolocation with manual override, selects urgency ("Today / ASAP", "This Week", "Flexible / No Rush"), and optionally picks a budget range from predefined options (Under ₱1,000 | ₱1,000–₱3,000 | ₱3,000–₱5,000 | ₱5,000–₱10,000 | ₱10,000+ | Not Sure). The entire flow is completable in under 60 seconds. Photos are compressed client-side to under 500KB before upload.

**Why this priority**: Core demand-side action; without job posting, no matches or platform value.

**Independent Test**: Homeowner can complete a full job post (category, description, photos, location, urgency, optional budget) in under 60 seconds and see the job in their list; photos are under 500KB.

**Acceptance Scenarios**:

1. **Given** the homeowner is on the app, **When** they select a category, enter description (≤500 chars), add up to 3 photos, set location (geolocation or manual), set urgency, and optionally set budget range, **Then** the job is created and visible in their job list.
2. **Given** the homeowner uploads photos, **When** they submit the job, **Then** each photo is under 500KB (client-side compression applied before upload).
3. **Given** the homeowner completes the flow, **When** they finish the last step, **Then** total time from start to submission is under 60 seconds (measurable with a stopwatch or timing script).

---

### User Story 2 - Fast Matching (Real-Time, Urgent Jobs) (Priority: P2)

When a homeowner posts a job with "Today / ASAP" urgency, the system activates Fast Matching. It queries workers who are marked "Available Now" or "Open Anytime", match the required skill category, and are within 10km radius. Matching workers receive a browser push notification and SMS alert with job summary (category, barangay location, budget range). Workers have a 15-minute countdown window to express interest. The homeowner sees a real-time list of interested workers (live updates) showing each worker's name, rating, distance, rate range, and completed jobs count. The homeowner selects one worker; only then is the exact address and phone number revealed to both parties. If no workers respond within 15 minutes, the job automatically converts to Flexible Matching and the homeowner is notified.

**Why this priority**: Differentiates urgent vs scheduled jobs; time-bound flow must work for ASAP demand.

**Independent Test**: Post an ASAP job; workers within 10km and "Available Now" receive push + SMS; homeowner sees live list of interested workers; selection reveals contact and address; after 15 minutes with no interest, job becomes Flexible and homeowner is notified.

**Acceptance Scenarios**:

1. **Given** a job is posted with "Today / ASAP", **When** the system runs matching, **Then** only workers who are "Available Now" or "Open Anytime", match the job category, and are within 10km are notified (browser push + SMS with category, barangay, budget range).
2. **Given** workers have been notified, **When** a worker expresses interest within 15 minutes, **Then** the homeowner sees that worker in a real-time list with name, rating, distance, rate range, and completed jobs count.
3. **Given** the homeowner sees interested workers, **When** they select one worker, **Then** exact address and phone number are revealed to both parties only after selection.
4. **Given** 15 minutes pass with no worker interest, **When** the countdown ends, **Then** the job converts to Flexible Matching and the homeowner is notified.

---

### User Story 3 - Flexible Matching (Browse & Compare, Scheduled Jobs) (Priority: P3)

When a homeowner posts a job with "This Week" or "Flexible" urgency, the system activates Flexible Matching. The homeowner sees a browseable, filterable list of workers matching their skill category, within 15km radius, with availability "Available This Week", "Available Weekends", or "Open Anytime", and with a minimum star rating selectable via dropdown (1.0, 2.0, 3.0, 4.0, 5.0; default 3.0). Workers are sorted by a composite score: (rating × 0.4) + (proximity × 0.3) + (completed jobs × 0.2) + (response rate × 0.1). Each worker card shows profile photo, display name, skill tags, star rating and review count, rate range, distance, availability badge, and completed jobs. A map (Leaflet, Airbnb-style) shows workers' approximate locations (service area center); the homeowner can browse list and map together. The homeowner can tap a card to view the full profile (including map with worker service area) and tap "Contact" to reveal the worker's phone number for direct call or SMS. No bidding system — workers set their own rates upfront.

**Why this priority**: Covers non-urgent jobs and complements Fast Matching; both modes must coexist.

**Independent Test**: Post a "This Week" or "Flexible" job; homeowner sees filterable worker list within 15km, default min rating 3.0; list is sorted by composite score; tapping "Contact" reveals worker phone only.

**Acceptance Scenarios**:

1. **Given** a job is posted with "This Week" or "Flexible", **When** the homeowner views matching workers, **Then** they see workers within 15km, matching category, with availability "Available This Week", "Available Weekends", or "Open Anytime", and a minimum star rating filter (dropdown 1.0–5.0, default 3.0).
2. **Given** the worker list is displayed, **When** the homeowner views it, **Then** workers are sorted by composite score (rating × 0.4 + proximity × 0.3 + completed jobs × 0.2 + response rate × 0.1) and each card shows photo, name, skill tags, rating, review count, rate range, distance, availability badge, completed jobs.
3. **Given** the homeowner taps a worker card, **When** they view the full profile and tap "Contact", **Then** the worker's phone number is revealed for direct call or SMS; no bidding or price negotiation in-app.
4. **Given** the homeowner is browsing Flexible Match workers, **When** they view the browse screen, **Then** they see a map (Leaflet, Airbnb-style) showing workers' approximate locations (service area center) alongside the list; the map uses the same approach as the rest of the app (PostGIS-backed proximity, no exact address until match).

---

### User Story 4 - Worker Registration & Profile (Priority: P4)

Workers register using phone OTP only. Profile setup is completable in under 3 minutes on a budget phone. Required fields: phone (OTP verified), display name, profile photo (face visible), skills (multi-select checkboxes), experience level dropdown (1–2yr, 3–5yr, 5–10yr, 10yr+), daily rate range (min/max in PHP), service area (map pin + radius or barangay multi-select), valid government ID upload (for admin verification). Optional: short bio (200 chars), portfolio photos (up to 6 images of past work). Public profile shows: photo, name, verification badge, skill tags, rating, rate range, service area, availability, completed jobs count, member since date, last 5 reviews, and portfolio gallery.

**Why this priority**: Supply side must exist before matching; registration is the gate.

**Independent Test**: New worker completes OTP sign-up and all required profile fields in under 3 minutes; public profile displays all stated fields including verification badge when admin has verified ID.

**Acceptance Scenarios**:

1. **Given** a new worker, **When** they register with phone number, **Then** they receive OTP and verify; no email, password, or social login.
2. **Given** the worker is verified, **When** they complete profile setup (display name, profile photo with face, skills, experience level, daily rate min/max, service area, government ID upload), **Then** the flow is completable in under 3 minutes on a budget phone.
3. **Given** the worker adds optional bio (≤200 chars) and/or up to 6 portfolio photos, **When** saved, **Then** they appear on the public profile.
4. **Given** the worker profile is complete and (when applicable) ID verified by admin, **When** a homeowner views the profile, **Then** they see photo, name, verification badge, skill tags, rating, rate range, service area (including a map showing worker's approximate location/service area, Leaflet Airbnb-style), availability, completed jobs count, member since, last 5 reviews, and portfolio gallery.

---

### User Story 5 - Worker Availability & Job Management (Priority: P5)

Workers control their availability with a single toggle: "Available Now", "Available This Week", "Available Weekends", "Open Anytime", or "Not Available". Status auto-resets to "Not Available" at 10:00 PM daily (worker can override). Workers see a job feed filtered by their skills and service area. Each job card shows category, description preview, barangay + distance, urgency badge (ASAP / This Week / Flexible), budget range, time posted, and number of interested workers. For Fast Match jobs, workers tap "I'm Interested" and wait for homeowner selection. For accepted jobs, workers update status through: "On My Way" → "Started" → "Completed". Notifications: Fast Match jobs trigger instant browser notification + SMS; Flexible jobs are batched into SMS digests at 8:00 AM and 2:00 PM daily.

**Why this priority**: Workers must be able to see jobs, express interest, and update status for the loop to close.

**Independent Test**: Worker sets availability and sees filtered job feed; for ASAP jobs they tap "I'm Interested" and get instant push + SMS; for Flexible jobs they get batched SMS at 8 AM / 2 PM; for accepted jobs they can set On My Way → Started → Completed.

**Acceptance Scenarios**:

1. **Given** the worker is logged in, **When** they set availability to one of "Available Now", "Available This Week", "Available Weekends", "Open Anytime", or "Not Available", **Then** the setting is saved and (unless overridden) auto-resets to "Not Available" at 10:00 PM PHT (UTC+8) daily.
2. **Given** the worker has skills and service area set, **When** they open the job feed, **Then** they see jobs filtered by their skills and service area; each card shows category, description preview, barangay + distance, urgency badge, budget range, time posted, and number of interested workers.
3. **Given** a Fast Match job is live, **When** the worker taps "I'm Interested", **Then** they receive confirmation and the homeowner sees them in the live list; the worker received instant browser notification + SMS when the job was created.
4. **Given** the worker is matched or selected, **When** they update job status, **Then** they can set "On My Way" → "Started" → "Completed".
5. **Given** Flexible (non-ASAP) jobs exist, **When** it is 8:00 AM or 2:00 PM, **Then** workers receive an SMS digest of relevant new/updated Flexible jobs.

---

### User Story 6 - Job Status Tracking (Priority: P6)

Jobs flow through statuses: Open → Matched → In Progress → Completed (or Cancelled). Both homeowner and worker see real-time status updates. When a worker marks "Completed", the homeowner is prompted to confirm completion and leave a review. If the homeowner does not confirm within 48 hours, the job auto-completes. Either party can cancel before "In Progress" status.

**Why this priority**: Shared visibility of status reduces confusion and supports ratings flow.

**Independent Test**: Homeowner and worker both see status change in real time; on worker "Completed", homeowner gets confirm + review prompt; 48-hour no-response auto-completes; either can cancel before In Progress.

**Acceptance Scenarios**:

1. **Given** a job exists, **When** status changes (Open → Matched → In Progress → Completed or Cancelled), **Then** both homeowner and worker see the update in real time (no page refresh required).
2. **Given** the worker marks the job "Completed", **When** the homeowner next opens the app or relevant view, **Then** they are prompted to confirm completion and leave a review.
3. **Given** the homeowner has not confirmed within 48 hours of worker marking "Completed", **When** 48 hours elapse, **Then** the job auto-completes.
4. **Given** the job is not yet "In Progress", **When** either the homeowner or the worker cancels, **Then** the job status becomes Cancelled.

---

### User Story 7 - Ratings & Reviews (Mutual) (Priority: P7)

After job completion, both parties are prompted to rate each other. Ratings are mutual and blind — neither sees the other's rating until both submit (or 48 hours pass). Each review includes: 1–5 star rating (required), written comment up to 300 characters (optional), predefined Taglish tags (multi-select: "Maagap", "Malinis ang trabaho", "Mabait", "Sulit", "Mahal", "Na-late"), and the reviewee can post one response (200 chars max). Reviews are public and cannot be edited. Workers below 2.5 average rating after 5+ reviews are flagged for admin review.

**Why this priority**: Trust and quality signal; enables sorting and minimum rating in Flexible Matching.

**Independent Test**: After completion, both parties can submit rating (required), optional comment, and tags; reviewee can add one response; ratings are hidden until both submit or 48h; worker with 5+ reviews and &lt;2.5 average is flagged for admin.

**Acceptance Scenarios**:

1. **Given** a job is completed, **When** homeowner and worker are prompted to review, **Then** each can submit 1–5 stars (required), optional comment (≤300 chars), and multi-select Taglish tags ("Maagap", "Malinis ang trabaho", "Mabait", "Sulit", "Mahal", "Na-late").
2. **Given** a review is submitted, **When** the reviewee views it, **Then** they can post one response (max 200 chars); reviews are public and cannot be edited.
3. **Given** both parties have not yet submitted, **When** one views the review screen, **Then** they cannot see the other's rating until both have submitted or 48 hours have passed.
4. **Given** a worker has 5 or more reviews, **When** their average rating is below 2.5, **Then** the worker is flagged for admin review.

---

### User Story 8 - Worker Dashboard (Priority: P8)

A simple dashboard shows: availability toggle, active job with status and homeowner details (as needed for contact/address after match), job history list with dates, categories, and ratings, earnings tracker (worker self-reports cash amount received per job — for their own records only), and profile completeness indicator.

**Why this priority**: Central place for workers to manage availability, active job, history, and self-reported earnings.

**Independent Test**: Worker can toggle availability, see active job and status, view job history with dates/categories/ratings, and optionally log cash received per job; profile completeness is visible.

**Acceptance Scenarios**:

1. **Given** the worker is logged in, **When** they open the dashboard, **Then** they see the availability toggle, current active job (if any) with status and homeowner details (e.g. address/phone only after match), and job history with dates, categories, and ratings.
2. **Given** the worker has completed jobs, **When** they choose to log earnings, **Then** they can self-report the cash amount received per job for their own records only; the platform does not process or hold payments.
3. **Given** the worker has a profile, **When** they view the dashboard, **Then** they see a profile completeness indicator (e.g. missing optional fields or ID verification status).

---

### Edge Cases

- What happens when geolocation is denied or unavailable? Homeowner must be able to set location manually (address or map pin). All map UX (job location picker, worker service area, worker-on-map browse) uses Leaflet; worker location shown on map is approximate (service area center/radius), not exact address — exact address revealed only after match.
- What happens when a worker goes offline or sets "Not Available" during the 15-minute Fast Match window? They are no longer shown as available for new notifications; existing "interested" state remains until homeowner selects or timer ends.
- What happens when the same worker is in both Fast Match and Flexible Match results? Deduplication so the worker appears once; behavior (e.g. "I'm Interested" vs "Contact") follows the mode the homeowner is using.
- What happens when a job has zero workers within radius for Fast Match? After 15 minutes, job converts to Flexible Matching; homeowner is notified.
- What happens when a worker has no reviews yet? They can still appear in lists; rating displays as "No reviews yet" or equivalent; composite score uses a neutral default for rating component.
- What happens when the homeowner never confirms completion? After 48 hours the job auto-completes; review prompt can remain available for a limited time (e.g. 7 days) or until used.
- What happens when a worker fails to verify government ID? Profile can be visible but without verification badge; admin can later verify via Supabase Studio; policy may restrict certain features for unverified workers (e.g. visibility in Flexible list) per product decision — for MVP, document as assumption: unverified workers can still register and be shown, with badge absent.
- What happens when OTP send or worker SMS fails (e.g. provider down, rate limit)? Show a Taglish error message and a "Subukan muli" (Try again) action; allow retry with rate limit of max 3 OTP sends per phone per 15 minutes.
- What happens when a worker already has a job in Matched or In Progress? The worker cannot be selected or contacted for another job until they complete or cancel the current one; the system excludes them from new match results (or shows them as unavailable for match).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow homeowners to create a job by selecting a service category (Plumbing, Electrical, Carpentry, Painting, Masonry, General Repair), description (max 500 characters), optional up to 3 photos (client-side compressed to under 500KB each), location (geolocation with manual override; location picker implemented with Leaflet), urgency ("Today / ASAP", "This Week", "Flexible / No Rush"), and optional budget range (Under ₱1,000 | ₱1,000–₱3,000 | ₱3,000–₱5,000 | ₱5,000–₱10,000 | ₱10,000+ | Not Sure).
- **FR-002**: System MUST support completing the full job-posting flow in under 60 seconds (end-to-end).
- **FR-003**: For "Today / ASAP" jobs, system MUST activate Fast Matching: notify workers who are "Available Now" or "Open Anytime", match the job category, and are within 10km, via browser push and SMS (job summary: category, barangay, budget range); 15-minute countdown; homeowner sees real-time list of interested workers (name, rating, distance, rate range, completed jobs); selection of one worker reveals exact address and phone to both parties; if no interest in 15 minutes, job converts to Flexible Matching and homeowner is notified.
- **FR-004**: For "This Week" or "Flexible" jobs, system MUST activate Flexible Matching: homeowner sees browseable, filterable list of workers matching category, within 15km, availability "Available This Week" / "Available Weekends" / "Open Anytime", minimum star rating selectable via dropdown (1.0, 2.0, 3.0, 4.0, 5.0; default 3.0), sorted by composite score (rating × 0.4 + proximity × 0.3 + completed jobs × 0.2 + response rate × 0.1). Response rate is defined as the percentage of Fast Match invitations in the last 30 days where the worker expressed interest within 15 minutes. A map (Leaflet, Airbnb-style) MUST show workers' approximate locations (service area center); list and map are used together. Worker cards show photo, name, skill tags, rating, review count, rate range, distance, availability badge, completed jobs; homeowner can view full profile (including map with worker service area) and tap "Contact" to reveal worker phone; no in-app bidding.
- **FR-005**: Workers MUST register with phone OTP only (no email, password, or social login).
- **FR-006**: Worker profile setup MUST include required fields: phone (OTP verified), display name, profile photo (face visible), skills (multi-select), experience level (1–2yr, 3–5yr, 5–10yr, 10yr+), daily rate range (min/max PHP), service area (map pin + radius or barangay multi-select; map implemented with Leaflet), government ID upload (for admin verification); optional: bio (200 chars), portfolio (up to 6 photos). Profile setup MUST be completable in under 3 minutes on a budget phone.
- **FR-007**: Public worker profile MUST show: photo, name, verification badge, skill tags, rating, rate range, service area (including a Leaflet map showing worker's approximate location/service area, Airbnb-style), availability, completed jobs count, member since, last 5 reviews, portfolio gallery.
- **FR-008**: Workers MUST be able to set availability: "Available Now", "Available This Week", "Available Weekends", "Open Anytime", or "Not Available"; status MUST auto-reset to "Not Available" at 10:00 PM Philippines Standard Time (PHT, UTC+8) daily unless overridden.
- **FR-009**: Workers MUST see a job feed filtered by their skills and service area; each job card MUST show category, description preview, barangay + distance, urgency badge, budget range, time posted, number of interested workers.
- **FR-010**: For Fast Match jobs, workers MUST be able to tap "I'm Interested"; for matched/selected jobs, workers MUST be able to update status: "On My Way" → "Started" → "Completed".
- **FR-011**: Notifications: Fast Match jobs MUST trigger instant browser notification + SMS to matching workers; Flexible jobs MUST be batched into SMS digests at 8:00 AM and 2:00 PM daily.
- **FR-012**: Jobs MUST flow through statuses: Open → Matched → In Progress → Completed or Cancelled; both parties MUST see real-time status updates.
- **FR-013**: When worker marks "Completed", homeowner MUST be prompted to confirm completion and leave a review; if homeowner does not confirm within 48 hours, job MUST auto-complete.
- **FR-014**: Either party MUST be able to cancel the job before "In Progress" status.
- **FR-015**: After job completion, both parties MUST be prompted to rate each other; ratings MUST be mutual and blind (not visible until both submit or 48 hours pass).
- **FR-016**: Each review MUST include 1–5 star rating (required), optional comment (max 300 chars), multi-select Taglish tags ("Maagap", "Malinis ang trabaho", "Mabait", "Sulit", "Mahal", "Na-late"); reviewee MAY post one response (max 200 chars). Reviews MUST be public and non-editable.
- **FR-017**: Workers with 5+ reviews and average rating below 2.5 MUST be flagged for admin review.
- **FR-018**: Worker dashboard MUST show: availability toggle, active job with status and homeowner details (as needed), job history (dates, categories, ratings), earnings tracker (worker self-reports cash per job for own records only), profile completeness indicator.
- **FR-019**: Phone numbers MUST NOT be exposed until a match is confirmed; exact job address MUST be revealed only to the matched worker.
- **FR-020**: All user-facing text MUST be in Taglish (Tagalog-English mix); examples: "Mag-post ng Job", "Hanapin ang Worker", and consistent Taglish for errors, labels, CTAs, placeholders.
- **FR-021**: When OTP send or worker SMS delivery fails, the system MUST show a Taglish error message and a "Subukan muli" (Try again) action; retry MUST be rate-limited to max 3 OTP sends per phone number per 15 minutes.
- **FR-022**: A worker MAY have at most one job in Matched or In Progress at a time; the system MUST NOT allow a new match (homeowner selection or worker contact reveal) until the worker has completed or cancelled their current matched/in-progress job.
- **FR-023**: All map UX MUST use Leaflet (location picker for job posting and worker service area, worker-on-map browse in Flexible Matching, worker profile map). Worker location shown on maps is approximate (service area center/radius) only; exact address is revealed only after match (privacy unchanged).

### Key Entities

- **Homeowner**: User who posts jobs; has phone (OTP), location, and posted jobs; sees matches and job status; can cancel before In Progress; leaves reviews after completion.
- **Worker**: User who offers skills; has phone (OTP), profile (name, photo, skills, experience, rate range, service area, ID verification status), availability, job feed, accepted jobs, status updates, job history, self-reported earnings, and receives reviews. A worker may have at most one job in Matched or In Progress at a time; they must complete or cancel it before being matched to another. Response rate (for Flexible Matching composite score) is the percentage of Fast Match invitations in the last 30 days where the worker expressed interest within 15 minutes.
- **Job**: Has category, description, photos, location (barangay + exact address), urgency, optional budget range, status (Open → Matched → In Progress → Completed / Cancelled), creator (homeowner), matched worker (when applicable), timestamps (posted, matched, completed), and count of interested workers (Fast Match).
- **Review**: Linked to a completed job; has reviewer and reviewee, 1–5 stars, optional comment, Taglish tags, optional reviewee response; public and immutable.
- **Availability**: Worker’s current status (Available Now, Available This Week, Available Weekends, Open Anytime, Not Available) and optional daily reset rule.
- **Match**: Association between a job and a worker (selected by homeowner in Fast Match, or contact revealed in Flexible Match); determines when contact/address is shared.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A homeowner can complete the full job-posting flow (category, description, up to 3 photos, location, urgency, optional budget) in under 60 seconds.
- **SC-002**: A new worker can complete registration and required profile setup (OTP, name, photo, skills, experience, rate range, service area, ID upload) in under 3 minutes on a budget phone.
- **SC-003**: For ASAP jobs, matching workers receive browser push and SMS within 30 seconds of job creation; homeowner sees at least one interested worker (when available in 10km) in the live list within the 15-minute window.
- **SC-004**: For Flexible jobs, homeowner sees a sorted, filterable list of workers within 15km and default 3.0 minimum rating; tapping "Contact" reveals worker phone with no bidding step.
- **SC-005**: Both homeowner and worker see job status changes (Open → Matched → In Progress → Completed/Cancelled) in real time without page refresh.
- **SC-006**: After completion, both parties can submit a rating and optional review; ratings remain hidden until both submit or 48 hours pass; worker with 5+ reviews and average below 2.5 is flagged for admin.
- **SC-007**: Workers can set availability, see a filtered job feed, express interest (Fast) or contact (Flexible), and update job status (On My Way → Started → Completed); worker dashboard shows availability, active job, history, self-reported earnings, and profile completeness.

## Assumptions

- Target users are in Metro Manila (MVP launch zone: Quezon City or Pasig); location and service area use barangay-level granularity where applicable. Job and homeowner location barangay is set from the location picker via reverse geocode of the pin or manual barangay selection (e.g. dropdown for Metro Manila). All scheduled times (e.g. availability auto-reset at 10:00 PM, SMS digests at 8:00 AM and 2:00 PM) use Philippines Standard Time (PHT, UTC+8).
- On first successful OTP verification, the system upserts a users row (id from Auth UID, phone; display_name and user_role nullable); user_role is set when the user chooses homeowner or worker path (e.g. from landing CTAs or post-login flow).
- "Budget phone" means devices such as Samsung A-series, Vivo Y-series, Realme C-series; 3-minute profile and 60-second job post are measured on such devices and slow 3G/4G.
- Admin verification of government ID is performed outside the app (e.g. via Supabase Studio); the platform only stores the upload and displays a verification badge when admin marks verified.
- SMS and push delivery are best-effort; success criteria assume normal network conditions; no guarantee of delivery within a specific SLA beyond "within 30 seconds" as a target.
- Unverified workers can register and appear in lists; verification badge is absent until admin verifies; no additional restriction (e.g. hiding unverified workers) is assumed unless product explicitly requires it.
- All payments are cash-only between homeowner and worker; platform does not handle money; worker self-reported earnings are for worker’s own tracking only.
- Taglish copy is hardcoded for MVP; no i18n or multi-language beyond Taglish.
- Map implementation uses Leaflet (not Google Maps); worker location on map is approximate (service area), Airbnb-style; same approach as current design (PostGIS proximity, location picker, service area) is preserved.
- Out of scope for this MVP: AI/ML, payment gateways, in-app chat, admin dashboard (use Supabase Studio), native apps, affiliate revenue, blockchain, AR, multi-language beyond Taglish, worker benefits program.

## Out of Scope (MVP)

- AI Vision, automated estimation, Bill of Materials, AI scheduling.
- Payment gateway integration (GCash, PayMaya, PayMongo, Stripe).
- Platform commission or take-rate.
- In-app chat or messaging.
- Admin dashboard (use Supabase Studio directly).
- Native mobile apps.
- Affiliate revenue from hardware stores.
- Blockchain, AR, multi-language beyond Taglish.
- Worker benefits program.
