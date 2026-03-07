-- Exclude workers with availability = not_available from Flexible Match browse (homeowners should not see them)

CREATE OR REPLACE FUNCTION public.get_flexible_match_workers(p_job_id uuid, p_min_rating numeric DEFAULT 3.0)
RETURNS TABLE (
  worker_id uuid,
  display_name text,
  avatar_url text,
  skills text[],
  avg_rating numeric,
  rate_min integer,
  rate_max integer,
  total_jobs integer,
  distance_km numeric,
  availability text,
  is_verified boolean,
  response_rate numeric,
  review_count bigint,
  composite_score numeric,
  service_lat double precision,
  service_lng double precision
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  WITH job_loc AS (
    SELECT j.location AS loc, j.category AS cat
    FROM public.jobs j
    WHERE j.id = p_job_id
  ),
  workers_with_dist AS (
    SELECT
      u.id AS worker_id,
      u.display_name,
      u.avatar_url,
      wp.skills,
      wp.avg_rating,
      wp.rate_min,
      wp.rate_max,
      wp.total_jobs,
      ROUND((ST_Distance(wp.service_center::extensions.geography, jl.loc::extensions.geography) / 1000.0)::numeric, 2) AS distance_km,
      wp.availability::text,
      wp.is_verified,
      ST_Y(wp.service_center::geometry) AS service_lat,
      ST_X(wp.service_center::geometry) AS service_lng,
      CASE WHEN wp.current_location IS NOT NULL THEN ST_Y(wp.current_location::geometry) END AS current_lat,
      CASE WHEN wp.current_location IS NOT NULL THEN ST_X(wp.current_location::geometry) END AS current_lng
    FROM job_loc jl
    JOIN public.worker_profiles wp ON (
      wp.availability IN ('this_week', 'weekends', 'open_anytime', 'available_now')
      AND wp.skills IS NOT NULL
      AND wp.skills @> ARRAY[jl.cat::text]
      AND wp.service_center IS NOT NULL
      AND ST_DWithin(wp.service_center::extensions.geography, jl.loc::extensions.geography, 15000)
    )
    JOIN public.users u ON u.id = wp.user_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.jobs j2
      WHERE j2.worker_id = wp.user_id
        AND j2.status IN ('matched', 'in_progress')
    )
    AND COALESCE(wp.avg_rating, 0) >= p_min_rating
  ),
  response_counts AS (
    SELECT
      ji.worker_id,
      COUNT(*) FILTER (
        WHERE j.matching_mode = 'fast'
          AND j.created_at > (now() - interval '30 days')
          AND ji.created_at <= COALESCE(j.fast_match_expires_at, j.created_at + interval '15 minutes')
      )::numeric AS fast_interest_count
    FROM public.job_interests ji
    JOIN public.jobs j ON j.id = ji.job_id
    WHERE j.created_at > (now() - interval '30 days')
    GROUP BY ji.worker_id
  ),
  review_counts AS (
    SELECT reviewee_id, COUNT(*) AS cnt
    FROM public.reviews
    GROUP BY reviewee_id
  )
  SELECT
    w.worker_id,
    w.display_name,
    w.avatar_url,
    w.skills,
    w.avg_rating,
    w.rate_min,
    w.rate_max,
    w.total_jobs,
    w.distance_km,
    w.availability,
    w.is_verified,
    LEAST(1.0, COALESCE(rc.fast_interest_count, 0) / 10.0) AS response_rate,
    COALESCE(rv.cnt, 0)::bigint AS review_count,
    (
      (COALESCE(w.avg_rating, 0) / 5.0) * 0.4
      + (1.0 / (1.0 + NULLIF(w.distance_km, 0))) * 0.3
      + (LEAST(w.total_jobs, 50) / 50.0) * 0.2
      + LEAST(1.0, COALESCE(rc.fast_interest_count, 0) / 10.0) * 0.1
    ) AS composite_score,
    COALESCE(w.current_lat, w.service_lat) AS service_lat,
    COALESCE(w.current_lng, w.service_lng) AS service_lng
  FROM workers_with_dist w
  LEFT JOIN response_counts rc ON rc.worker_id = w.worker_id
  LEFT JOIN review_counts rv ON rv.reviewee_id = w.worker_id
  ORDER BY (
    (COALESCE(w.avg_rating, 0) / 5.0) * 0.4
    + (1.0 / (1.0 + NULLIF(w.distance_km, 0))) * 0.3
    + (LEAST(w.total_jobs, 50) / 50.0) * 0.2
    + LEAST(1.0, COALESCE(rc.fast_interest_count, 0) / 10.0) * 0.1
  ) DESC;
$$;
