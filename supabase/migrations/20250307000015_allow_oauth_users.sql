-- Allow Google OAuth users who may not have a phone number
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;

-- Drop the old unique index and recreate as a partial index (only non-null)
DROP INDEX IF EXISTS idx_users_phone;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_phone_key;
CREATE UNIQUE INDEX idx_users_phone_unique ON public.users(phone) WHERE phone IS NOT NULL;

-- Add email column for OAuth users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email varchar(255);
CREATE UNIQUE INDEX idx_users_email_unique ON public.users(email) WHERE email IS NOT NULL;
