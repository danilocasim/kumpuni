-- RPC for cron: set all worker_profiles.availability = not_available (10 PM PHT daily)

CREATE OR REPLACE FUNCTION public.reset_all_worker_availability()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count bigint;
BEGIN
  UPDATE public.worker_profiles
  SET availability = 'not_available';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
