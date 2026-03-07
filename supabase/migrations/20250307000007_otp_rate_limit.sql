-- OTP send rate limit: max 3 per phone per 15 minutes (spec FR-021)
-- Used by app/api/auth/otp/send

CREATE TABLE IF NOT EXISTS public.otp_send_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone varchar(20) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_otp_send_attempts_phone_created ON public.otp_send_attempts(phone, created_at DESC);

-- RLS: no direct user access; only service role or API (via service role) can insert/select
ALTER TABLE public.otp_send_attempts ENABLE ROW LEVEL SECURITY;

-- No policies: table only accessed from API routes with service role for rate-limit check and insert
