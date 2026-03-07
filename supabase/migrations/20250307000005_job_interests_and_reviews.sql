-- T011: job_interests and reviews tables with RLS per data-model.md
-- Requires: 20250307000004_jobs_table.sql

-- job_interests: Fast Matching - which workers expressed interest
CREATE TABLE public.job_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, worker_id)
);

CREATE INDEX idx_job_interests_job_id ON public.job_interests(job_id);
CREATE INDEX idx_job_interests_worker_id ON public.job_interests(worker_id);

ALTER TABLE public.job_interests ENABLE ROW LEVEL SECURITY;

-- Homeowner can read job_interests for their own jobs (Fast Match list)
CREATE POLICY "Homeowner can read interests for own job"
  ON public.job_interests FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.homeowner_id = auth.uid())
  );

-- Worker can insert own interest for open Fast Match jobs (eligibility checked in app)
CREATE POLICY "Worker can insert own interest"
  ON public.job_interests FOR INSERT
  WITH CHECK (auth.uid() = worker_id);

-- reviews: after job completion
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment varchar(300),
  tags text[] DEFAULT '{}',
  response varchar(200),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, reviewer_id)
);

CREATE INDEX idx_reviews_job_id ON public.reviews(job_id);
CREATE INDEX idx_reviews_reviewee_id ON public.reviews(reviewee_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews (public)
CREATE POLICY "Public can read reviews"
  ON public.reviews FOR SELECT
  USING (true);

-- Participant of completed job can insert review (job_id, reviewer_id = self, reviewee_id = other party)
CREATE POLICY "Job participant can insert review"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id AND j.status = 'completed'
        AND (j.homeowner_id = auth.uid() OR j.worker_id = auth.uid())
    )
  );

-- Reviewee can update only own row's response column (once)
CREATE POLICY "Reviewee can update own response"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = reviewee_id)
  WITH CHECK (auth.uid() = reviewee_id);
