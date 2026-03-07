# Data Model: Kumpuni MVP

**Branch**: `001-kumpuni-mvp` | **Date**: 2025-03-07

PostgreSQL + PostGIS. All tables have RLS enabled.

---

## Tables

### 1. users

| Column | Type | Constraints | Notes |
|--------|------|-------------|--------|
| id | uuid | PK | Supabase Auth UID |
| phone | varchar | unique, not null | E.164 |
| display_name | varchar(50) | | |
| avatar_url | text | nullable | avatars bucket |
| user_role | enum | | homeowner \| worker \| both |
| location | geography(Point) | nullable | |
| barangay | varchar(100) | nullable | |
| created_at | timestamptz | not null | |
| updated_at | timestamptz | not null | |

---

### 2. worker_profiles

| Column | Type | Constraints | Notes |
|--------|------|-------------|--------|
| id | uuid | PK | |
| user_id | uuid | FK→users, unique | |
| skills | text[] | | |
| experience_level | enum | | 1-2yr, 3-5yr, 5-10yr, 10yr+ |
| rate_min | integer | | PHP |
| rate_max | integer | | PHP |
| bio | varchar(200) | nullable | |
| service_radius_km | integer | default 10 | |
| service_center | geography(Point) | | |
| availability | enum | | available_now, this_week, weekends, open_anytime, not_available |
| is_verified | boolean | default false | |
| valid_id_url | text | nullable | verification bucket, admin-only |
| total_jobs | integer | default 0 | |
| avg_rating | numeric(2,1) | default 0.0 | |
| response_rate | numeric(3,2) | default 0 | % of Fast Match invites in last 30 days where worker expressed interest within 15 min |
| portfolio_urls | text[] | nullable | up to 6 |

---

### 3. jobs

| Column | Type | Constraints | Notes |
|--------|------|-------------|--------|
| id | uuid | PK | |
| homeowner_id | uuid | FK→users | |
| worker_id | uuid | FK→users, nullable | set when matched |
| category | enum | | plumbing, electrical, carpentry, painting, masonry, general |
| description | varchar(500) | | |
| photo_urls | text[] | nullable | up to 3 |
| location | geography(Point) | | |
| barangay | varchar(100) | | |
| address | text | nullable | revealed after match only |
| urgency | enum | | asap, this_week, flexible |
| budget_range | varchar(30) | nullable | |
| status | enum | | open, matched, in_progress, completed, cancelled |
| matching_mode | enum | | fast, flexible |
| fast_match_expires_at | timestamptz | nullable | 15-min expiry for Fast Match |
| worker_reported_amount | integer | nullable | PHP, self-report only |
| created_at | timestamptz | | |
| completed_at | timestamptz | nullable | |

---

### 4. job_interests

Fast Matching: which workers expressed interest.

| Column | Type | Constraints | Notes |
|--------|------|-------------|--------|
| id | uuid | PK | |
| job_id | uuid | FK→jobs | |
| worker_id | uuid | FK→users | |
| created_at | timestamptz | | |

Realtime subscription on this table for Fast Match live list.

---

### 5. reviews

| Column | Type | Constraints | Notes |
|--------|------|-------------|--------|
| id | uuid | PK | |
| job_id | uuid | FK→jobs | |
| reviewer_id | uuid | FK→users | |
| reviewee_id | uuid | FK→users | |
| rating | smallint | 1-5 | |
| comment | varchar(300) | nullable | |
| tags | text[] | nullable | Taglish tags |
| response | varchar(200) | nullable | reviewee’s one response |
| created_at | timestamptz | | |

---

## RLS Summary

- **users**: read/write own row.
- **worker_profiles**: owner read/write; homeowners read limited columns for browse/matched jobs; phone/valid_id_url never to homeowners.
- **jobs**: homeowner CRUD own; worker read when matched or in feed scope; address revealed only after match.
- **job_interests**: workers insert for eligible open Fast Match jobs; homeowner read for own job.
- **reviews**: insert by job participants after completed; read public; reviewee can set response once.
- **verification** bucket: service role only (admin-only RLS).

---

## Business Rules (from spec clarifications)

- **Response rate**: Percentage of Fast Match invitations in the last 30 days where the worker expressed interest within 15 minutes (stored or computed for composite score).
- **One active job per worker**: A worker may have at most one job in status `matched` or `in_progress`; exclude such workers from new Fast/Flexible match results until they complete or cancel.
- **Scheduled times**: All in Philippines Standard Time (PHT, UTC+8): availability reset 10:00 PM, SMS digests 8:00 AM and 2:00 PM.
- **Maps**: Map UX uses Leaflet; worker location shown on map is approximate (service_center / service_radius_km) only; exact address never on map until after match.

## Key Queries

- **Proximity**: `ST_DWithin(worker_profiles.service_center, job.location, worker_profiles.service_radius_km * 1000)` (meters).
- **Flexible sort**: `(avg_rating × 0.4) + (1/distance × 0.3) + (total_jobs × 0.2) + (response_rate × 0.1)` normalized. Min rating filter: dropdown 1.0–5.0 (default 3.0).
- **Eligible for match**: Worker must not have another job in `matched` or `in_progress`.
