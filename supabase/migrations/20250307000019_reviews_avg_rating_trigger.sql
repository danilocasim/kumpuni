-- T051: After each new review for a worker, recompute worker_profiles.avg_rating;
-- Add admin flag when avg_rating < 2.5 and review count >= 5 (admin review via Supabase Studio).

ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS low_rating_flagged boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.worker_profiles.low_rating_flagged IS 'True when avg_rating < 2.5 and review count >= 5; for admin review in Studio';

CREATE OR REPLACE FUNCTION public.recompute_worker_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reviewee_id uuid;
  v_avg numeric(2,1);
  v_count bigint;
  v_flag boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_reviewee_id := OLD.reviewee_id;
  ELSE
    v_reviewee_id := NEW.reviewee_id;
  END IF;

  SELECT ROUND(AVG(rating)::numeric, 1), COUNT(*)
  INTO v_avg, v_count
  FROM public.reviews
  WHERE reviewee_id = v_reviewee_id;

  v_avg := COALESCE(v_avg, 0);
  v_flag := (v_avg < 2.5 AND v_count >= 5);

  UPDATE public.worker_profiles
  SET avg_rating = v_avg,
      low_rating_flagged = v_flag
  WHERE user_id = v_reviewee_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_reviews_recompute_rating ON public.reviews;
CREATE TRIGGER trigger_reviews_recompute_rating
  AFTER INSERT OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.recompute_worker_rating();

-- Backfill avg_rating and low_rating_flagged for existing reviews
WITH rev AS (
  SELECT reviewee_id,
    ROUND(AVG(rating)::numeric, 1) AS avg_r,
    COUNT(*) AS cnt
  FROM public.reviews
  GROUP BY reviewee_id
)
UPDATE public.worker_profiles wp
SET
  avg_rating = COALESCE(rev.avg_r, 0),
  low_rating_flagged = COALESCE(rev.avg_r < 2.5 AND rev.cnt >= 5, false)
FROM rev
WHERE rev.reviewee_id = wp.user_id;
