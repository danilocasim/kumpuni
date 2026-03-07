-- T043: For SMS digest — workers with at least one open Flexible job in their area/skills (optionally since time).

CREATE OR REPLACE FUNCTION public.get_sms_digest_recipients(p_since timestamptz DEFAULT (now() - interval '12 hours'))
RETURNS TABLE (worker_user_id uuid, phone text, job_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  WITH worker_area AS (
    SELECT wp.user_id, wp.service_center, wp.service_radius_km, wp.skills
    FROM public.worker_profiles wp
    WHERE wp.service_center IS NOT NULL
      AND wp.skills IS NOT NULL
      AND array_length(wp.skills, 1) > 0
  ),
  counts AS (
    SELECT
      wa.user_id AS worker_user_id,
      COUNT(j.id)::bigint AS job_count
    FROM worker_area wa
    JOIN public.jobs j ON (
      j.status = 'open'
      AND j.matching_mode = 'flexible'
      AND j.created_at >= p_since
      AND wa.skills @> ARRAY[j.category::text]
      AND ST_DWithin(j.location::extensions.geography, wa.service_center::extensions.geography, wa.service_radius_km * 1000)
    )
    GROUP BY wa.user_id
    HAVING COUNT(j.id) > 0
  )
  SELECT c.worker_user_id, u.phone, c.job_count
  FROM counts c
  JOIN public.users u ON u.id = c.worker_user_id
  WHERE u.phone IS NOT NULL AND trim(u.phone) <> '';
$$;
