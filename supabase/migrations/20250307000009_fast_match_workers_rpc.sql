-- T025: RPC to get eligible workers for Fast Match (ASAP job)
-- Returns workers: available_now or open_anytime, category in skills, within 10km, no job in matched/in_progress

CREATE OR REPLACE FUNCTION public.get_fast_match_workers(p_job_id uuid)
RETURNS TABLE (worker_user_id uuid, phone text, push_subscription jsonb)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT u.id AS worker_user_id, u.phone, wp.push_subscription
  FROM public.jobs j
  JOIN public.worker_profiles wp ON (
    wp.availability IN ('available_now', 'open_anytime')
    AND (wp.skills IS NOT NULL AND wp.skills @> ARRAY[j.category::text])
    AND wp.service_center IS NOT NULL
    AND ST_DWithin(wp.service_center::extensions.geography, j.location::extensions.geography, 10000)
  )
  JOIN public.users u ON u.id = wp.user_id
  WHERE j.id = p_job_id
    AND NOT EXISTS (
      SELECT 1 FROM public.jobs j2
      WHERE j2.worker_id = wp.user_id
        AND j2.status IN ('matched', 'in_progress')
    );
$$;

-- T026: RPC to list interested workers for a Fast Match job (for homeowner fast page)
CREATE OR REPLACE FUNCTION public.get_interested_workers(p_job_id uuid)
RETURNS TABLE (
  worker_id uuid,
  display_name text,
  avg_rating numeric,
  rate_min integer,
  rate_max integer,
  total_jobs integer,
  distance_km numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    u.id AS worker_id,
    u.display_name,
    wp.avg_rating,
    wp.rate_min,
    wp.rate_max,
    wp.total_jobs,
    ROUND((ST_Distance(wp.service_center::extensions.geography, j.location::extensions.geography) / 1000.0)::numeric, 2) AS distance_km
  FROM public.job_interests ji
  JOIN public.users u ON u.id = ji.worker_id
  JOIN public.worker_profiles wp ON wp.user_id = u.id
  JOIN public.jobs j ON j.id = ji.job_id
  WHERE ji.job_id = p_job_id;
$$;
