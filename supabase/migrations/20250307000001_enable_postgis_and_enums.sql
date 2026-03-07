-- T007: Enable PostGIS and create enums per data-model.md
-- Run this migration first. Enable PostGIS via Dashboard if migration lacks permission.

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- user_role: homeowner | worker | both
CREATE TYPE public.user_role AS ENUM ('homeowner', 'worker', 'both');

-- experience_level: 1-2yr, 3-5yr, 5-10yr, 10yr+
CREATE TYPE public.experience_level AS ENUM ('1_2yr', '3_5yr', '5_10yr', '10yr_plus');

-- availability: worker status
CREATE TYPE public.availability AS ENUM (
  'available_now',
  'this_week',
  'weekends',
  'open_anytime',
  'not_available'
);

-- job category
CREATE TYPE public.job_category AS ENUM (
  'plumbing',
  'electrical',
  'carpentry',
  'painting',
  'masonry',
  'general'
);

-- urgency: job urgency
CREATE TYPE public.urgency AS ENUM ('asap', 'this_week', 'flexible');

-- job status
CREATE TYPE public.job_status AS ENUM (
  'open',
  'matched',
  'in_progress',
  'completed',
  'cancelled'
);

-- matching_mode: fast or flexible
CREATE TYPE public.matching_mode AS ENUM ('fast', 'flexible');
