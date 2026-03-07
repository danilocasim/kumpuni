-- Enable Supabase Realtime (postgres_changes) for job_interests and jobs.
-- Required so that "I'm Interested" updates appear live on the Fast Match page
-- and job status updates stream to the client.
-- See: https://supabase.com/docs/guides/realtime/postgres-changes

ALTER PUBLICATION supabase_realtime ADD TABLE public.job_interests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
