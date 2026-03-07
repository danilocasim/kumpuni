-- T041: Worker job feed — open jobs within worker service area, category in worker skills; distance + interest count

CREATE OR REPLACE FUNCTION public.get_worker_job_feed(p_worker_id uuid)
RETURNS TABLE (
  id uuid,
  category text,
  description varchar(500),
  barangay varchar(100),
  urgency text,
  budget_range varchar(30),
  matching_mode text,
  created_at timestamptz,
  distance_km numeric,
  interested_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  WITH wp AS (
    SELECT wp.service_center, wp.service_radius_km, wp.skills
    FROM public.worker_profiles wp
    WHERE wp.user_id = p_worker_id
      AND wp.service_center IS NOT NULL
      AND wp.skills IS NOT NULL
      AND array_length(wp.skills, 1) > 0
  ),
  jobs_in_range AS (
    SELECT
      j.id,
      j.category::text,
      j.description,
      j.barangay,
      j.urgency::text,
      j.budget_range,
      j.matching_mode::text,
      j.created_at,
      ROUND((ST_Distance(j.location::extensions.geography, wp.service_center::extensions.geography) / 1000.0)::numeric, 2) AS distance_km
    FROM public.jobs j
    CROSS JOIN wp
    WHERE j.status = 'open'
      AND wp.skills @> ARRAY[j.category::text]
      AND ST_DWithin(j.location::extensions.geography, wp.service_center::extensions.geography, wp.service_radius_km * 1000)
  ),
  interests AS (
    SELECT ji.job_id, COUNT(*)::bigint AS cnt
    FROM public.job_interests ji
    GROUP BY ji.job_id
  )
  SELECT
    jir.id,
    jir.category,
    jir.description,
    jir.barangay,
    jir.urgency,
    jir.budget_range,
    jir.matching_mode,
    jir.created_at,
    jir.distance_km,
    COALESCE(i.cnt, 0)::bigint AS interested_count
  FROM jobs_in_range jir
  LEFT JOIN interests i ON i.job_id = jir.id
  ORDER BY jir.created_at DESC
  LIMIT 50;
$$;
