-- T010: jobs table with RLS (homeowner CRUD own; worker read when matched or in feed scope)
-- Requires: 20250307000002_users_table.sql, 20250307000001 (enums)

CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  category public.job_category NOT NULL,
  description varchar(500) NOT NULL,
  photo_urls text[] DEFAULT '{}',
  location extensions.geography(Point, 4326) NOT NULL,
  barangay varchar(100) NOT NULL,
  address text,
  urgency public.urgency NOT NULL,
  budget_range varchar(30),
  status public.job_status NOT NULL DEFAULT 'open',
  matching_mode public.matching_mode NOT NULL,
  fast_match_expires_at timestamptz,
  worker_reported_amount integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_jobs_homeowner_id ON public.jobs(homeowner_id);
CREATE INDEX idx_jobs_worker_id ON public.jobs(worker_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_matching_mode ON public.jobs(matching_mode);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX idx_jobs_location ON public.jobs USING gist(location);

-- RLS: homeowner CRUD own; worker read when matched or when job is in feed scope (open + category/area match)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowner can read own jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid() = homeowner_id);

CREATE POLICY "Homeowner can insert own jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (auth.uid() = homeowner_id);

CREATE POLICY "Homeowner can update own jobs"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = homeowner_id)
  WITH CHECK (auth.uid() = homeowner_id);

CREATE POLICY "Homeowner can delete own jobs"
  ON public.jobs FOR DELETE
  USING (auth.uid() = homeowner_id);

-- Worker can read jobs where they are the matched worker
CREATE POLICY "Worker can read matched jobs"
  ON public.jobs FOR SELECT
  USING (auth.uid() = worker_id);

-- Worker can read open jobs (for feed); feed filtering by skills/area done in app/query
CREATE POLICY "Worker can read open jobs for feed"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (status = 'open');

-- Worker can update job when they are the matched worker (e.g. status, completed_at, worker_reported_amount)
CREATE POLICY "Worker can update matched job"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = worker_id)
  WITH CHECK (auth.uid() = worker_id);

COMMENT ON COLUMN public.jobs.address IS 'Revealed only after match; do not expose in feed or before match';
