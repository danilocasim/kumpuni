# Page Routes Contract: Kumpuni MVP

**Branch**: `001-kumpuni-mvp` | **Date**: 2025-03-07

App Router routes. Auth required unless marked Public.

---

## Public (no auth)

| Route | Description |
|-------|-------------|
| `/` | Landing — "Mag-post ng Job", "Mag-sign Up as Worker" CTAs |
| `/how-it-works` | 3-step visual guide |
| `/workers/:id` | Public worker profile; login required to contact (reveal phone) |

---

## Homeowner (auth required)

| Route | Description |
|-------|-------------|
| `/jobs/new` | Job posting form |
| `/jobs/:id/fast` | Fast Match results — real-time worker interest list |
| `/jobs/:id/browse` | Flexible Match — browse workers |
| `/dashboard` | My posted jobs with status badges |
| `/jobs/:id` | Job detail + status timeline |
| `/jobs/:id/review` | Rating form after completion |

---

## Worker (auth required)

| Route | Description |
|-------|-------------|
| `/worker/setup` | Multi-step registration |
| `/worker/dashboard` | Availability toggle, active job, history, earnings |
| `/worker/jobs` | Job feed (skills/area filtered) |
| `/worker/jobs/:id` | Job detail — accept/status buttons |
| `/worker/profile` | Edit profile, portfolio, rates |
| `/worker/reviews` | Reviews received + response option |
