-- Worker current/live location for map display (optional; falls back to service_center when null)

ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS current_location extensions.geography(Point, 4326),
  ADD COLUMN IF NOT EXISTS current_location_updated_at timestamptz;

COMMENT ON COLUMN public.worker_profiles.current_location IS 'Worker last-shared GPS position; used for map marker when set';
COMMENT ON COLUMN public.worker_profiles.current_location_updated_at IS 'When current_location was last updated';

-- RPC so API can set current_location with proper geography cast
CREATE OR REPLACE FUNCTION public.set_worker_current_location(p_user_id uuid, p_lng double precision, p_lat double precision)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  UPDATE public.worker_profiles
  SET
    current_location = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography,
    current_location_updated_at = now()
  WHERE user_id = p_user_id;
$$;
