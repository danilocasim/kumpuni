-- T012: Storage buckets — avatars, portfolios, jobs (public); verification (private, admin-only)
-- Requires: storage schema (default in Supabase)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('portfolios', 'portfolios', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('jobs', 'jobs', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('verification', 'verification', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Public buckets: authenticated users can upload to their own path; anyone can read
-- Avatars: user can upload/update/delete own (name prefix = user id)
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Avatar files are publicly readable"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Portfolios: worker can upload to own path
CREATE POLICY "Users can upload own portfolio"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portfolios' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own portfolio"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'portfolios' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own portfolio"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'portfolios' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Portfolio files are publicly readable"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'portfolios');

-- Jobs: homeowner can upload (path can include job id or user id)
CREATE POLICY "Authenticated can upload job photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'jobs');

CREATE POLICY "Users can update own job photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'jobs');

CREATE POLICY "Users can delete own job photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'jobs');

CREATE POLICY "Job photos are publicly readable"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'jobs');

-- Verification: private; only upload by owner (worker), read by service role only (admin)
-- No SELECT policy for authenticated = only service role can read (admin via Dashboard/API)
CREATE POLICY "Workers can upload own verification"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Workers can update own verification"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'verification' AND (storage.foldername(name))[1] = auth.uid()::text);

-- No SELECT/DELETE for authenticated; admin uses service role key
