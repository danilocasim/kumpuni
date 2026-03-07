-- T038: Public worker profile access.
-- worker_profiles and users are NOT given public SELECT (would expose valid_id_url and phone).
-- Public profile is served only via app layer: getPublicWorkerProfile() / GET /api/workers/[id]/profile
-- which use service role and return only safe columns (no valid_id_url, no phone).

COMMENT ON TABLE public.worker_profiles IS 'RLS: owner read/write. Public profile data via app API only (safe columns).';
