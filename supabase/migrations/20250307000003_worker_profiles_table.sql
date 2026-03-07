-- T009: worker_profiles table with RLS per data-model.md
-- Requires: 20250307000002_users_table.sql

CREATE TABLE public.worker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  skills text[] DEFAULT '{}',
  experience_level public.experience_level,
  rate_min integer,
  rate_max integer,
  bio varchar(200),
  service_radius_km integer NOT NULL DEFAULT 10,
  service_center extensions.geography(Point, 4326),
  availability public.availability NOT NULL DEFAULT 'not_available',
  is_verified boolean NOT NULL DEFAULT false,
  valid_id_url text,
  total_jobs integer NOT NULL DEFAULT 0,
  avg_rating numeric(2,1) NOT NULL DEFAULT 0.0,
  response_rate numeric(3,2) NOT NULL DEFAULT 0,
  portfolio_urls text[] DEFAULT '{}'
);

CREATE INDEX idx_worker_profiles_user_id ON public.worker_profiles(user_id);
CREATE INDEX idx_worker_profiles_availability ON public.worker_profiles(availability);
CREATE INDEX idx_worker_profiles_service_center ON public.worker_profiles USING gist(service_center);

-- RLS: owner can read/write own row
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Worker can read own profile"
  ON public.worker_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Worker can insert own profile"
  ON public.worker_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Worker can update own profile"
  ON public.worker_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Homeowner browse: use app layer with service role or a DB view that selects only safe columns (exclude valid_id_url).

COMMENT ON COLUMN public.worker_profiles.valid_id_url IS 'Admin-only; never expose to homeowners';
COMMENT ON COLUMN public.worker_profiles.response_rate IS '% of Fast Match invites in last 30 days where worker expressed interest within 15 min';
