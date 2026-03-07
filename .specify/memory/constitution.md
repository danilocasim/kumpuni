<!--
Sync Impact Report
==================
Version change: (none) → 1.0.0
Modified principles: N/A (initial adoption)
Added sections: Project Identity, Article I–IX, Governance
Removed sections: N/A
Templates:
  - .specify/templates/plan-template.md ✅ (Constitution Check / gates align; no edit required)
  - .specify/templates/spec-template.md ✅ (scope/requirements generic; no constitution-specific sections)
  - .specify/templates/tasks-template.md ✅ (task types compatible; no principle-driven categories added)
  - .cursor/commands/*.md: referenced; constitution path .specify/memory/constitution.md correct
Follow-up TODOs: None
-->

# Kumpuni Constitution

## Project Identity

Kumpuni is a web-based platform that connects Filipino homeowners with verified informal skilled workers (electricians, plumbers, carpenters, painters, masons, general handymen) for home repair and small construction jobs. It is an MVP targeting Metro Manila, specifically a concentrated launch zone in Quezon City or Pasig.

## Article I: Web-First, Mobile-Optimized (NON-NEGOTIABLE)

This is a responsive web application built with Next.js (App Router). There are NO native mobile apps. All pages MUST be mobile-first, optimized for budget Android phones (Samsung A-series, Vivo Y-series, Realme C-series) on slow 3G/4G connections. Total page weight MUST stay under 500KB excluding user-uploaded images. Touch targets MUST be minimum 44px × 44px. All critical user flows MUST be completable with one thumb.

**Rationale**: Target users primarily use low-end devices and unreliable networks; violating this undermines usability and adoption.

## Article II: Supabase as the Single Backend (NON-NEGOTIABLE)

All backend logic MUST run through Supabase: PostgreSQL with PostGIS extension for geolocation, Supabase Auth with Phone OTP as the ONLY authentication method (no email, no passwords, no social login), Supabase Realtime for live job status and fast matching updates, Supabase Storage for all image uploads (job photos, avatars, portfolios, verification IDs). There MUST be no separate backend server, no Express, no custom API beyond Next.js API routes.

**Rationale**: Single backend reduces complexity, cost, and operational surface; Phone OTP matches local norms and device constraints.

## Article III: Cash-Only Payments (NON-NEGOTIABLE)

There is NO payment gateway integration in this MVP. No GCash, no PayMaya, no PayMongo, no Stripe. All payments happen in cash directly between the homeowner and the worker. The platform MUST NOT handle money. Workers MAY optionally self-report the amount they were paid for their own tracking purposes only.

**Rationale**: MVP scope and regulatory simplicity; cash is the dominant mode for informal work in the target market.

## Article IV: No AI / No Machine Learning (NON-NEGOTIABLE)

There is NO AI Vision, NO LLM-powered estimation, NO automated Bill of Materials generation, NO AI scheduling in this MVP. Photos uploaded by homeowners are for the worker's visual reference only — they MUST NOT be processed by any AI model. Cost estimation MUST come from the worker, not the platform.

**Rationale**: Keeps MVP scope and cost bounded; avoids dependency on AI APIs and preserves human judgment for pricing and scheduling.

## Article V: Taglish-First Interface (NON-NEGOTIABLE)

All user-facing text MUST be in Taglish (Tagalog-English mix), reflecting how the Metro Manila target market actually communicates. Examples: "Mag-post ng Job" not "Post a Job", "Hanapin ang Worker" not "Find a Worker". Error messages, labels, CTAs, and placeholder text MUST follow conversational Taglish. No i18n library is needed — strings are hardcoded in Taglish for the MVP.

**Rationale**: Taglish is the natural language of the target users; consistency in voice builds trust and reduces friction.

## Article VI: Two Matching Modes Must Coexist

The platform MUST support both Fast Matching (real-time, for urgent "ASAP" jobs with a 15-minute countdown window) and Flexible Matching (browse-and-compare, for "This Week" and "Flexible" jobs). If Fast Matching yields no interested workers within 15 minutes, the job MUST automatically convert to Flexible Matching. Both modes MUST be fully functional — do not build one and stub the other.

**Rationale**: Addresses both urgent and planned jobs; automatic fallback prevents dead-ends and maximizes match rate.

## Article VII: Privacy-by-Default

Phone numbers MUST NOT be exposed until a match is confirmed. Exact job addresses MUST be revealed ONLY to the matched worker. Verification IDs (government ID uploads) MUST be stored in a private Supabase Storage bucket with admin-only Row Level Security. All Supabase tables MUST use Row Level Security policies. No user data MAY be shared with third parties.

**Rationale**: Protects workers and homeowners from spam, harassment, and misuse of sensitive data; RLS is the enforcement mechanism.

## Article VIII: Simplicity Over Cleverness

No Redux, no Zustand, no complex state management. React state (useState, useReducer) and Supabase realtime subscriptions are sufficient. No custom design system — use Tailwind CSS utility classes directly. No over-abstraction — if a component is used in one place, do NOT extract it into a shared library. No premature optimization. Build it simple, ship it, iterate based on real user feedback.

**Rationale**: Reduces maintenance burden and cognitive load; aligns with MVP goal of learning from real usage before scaling complexity.

## Article IX: Worker-Centric Design

Workers are the supply side and the hardest side to acquire. Every design and technical decision MUST consider the worker's experience: low-bandwidth tolerance, simple UI, minimal steps to register and accept jobs, SMS fallback for critical notifications. If a feature makes the homeowner experience better but the worker experience worse, it MUST be reconsidered.

**Rationale**: Without workers, the platform has no supply; worker friction directly limits growth and match quality.

## Governance

- This constitution supersedes all other documentation and decisions.
- No feature MAY be added that contradicts these articles.
- Deviations require explicit documentation and justification.
- When in doubt, ship the simpler version.

**Version**: 1.0.0 | **Ratified**: 2025-03-07 | **Last Amended**: 2025-03-07
