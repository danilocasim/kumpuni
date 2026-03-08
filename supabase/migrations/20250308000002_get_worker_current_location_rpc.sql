-- RPC to retrieve worker's current location as lat/lng
CREATE OR REPLACE FUNCTION public.get_worker_current_location(p_user_id uuid)
RETURNS TABLE(lat double precision, lng double precision)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    ST_Y(current_location::geometry) AS lat,
    ST_X(current_location::geometry) AS lng
  FROM public.worker_profiles
  WHERE user_id = p_user_id
    AND current_location IS NOT NULL;
$$;
