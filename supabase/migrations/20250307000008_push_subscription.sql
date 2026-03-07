-- T019: Store Web Push subscription for workers (Fast Match notifications)
ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS push_subscription jsonb;

COMMENT ON COLUMN public.worker_profiles.push_subscription IS 'Web Push subscription (endpoint, keys) for browser push; used by Fast Match (T026)';
