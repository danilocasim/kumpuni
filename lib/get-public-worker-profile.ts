import { createAdminClient } from "@/lib/supabase/admin";

/**
 * T037/T038: Fetch public worker profile (safe columns only; no phone, no valid_id_url).
 */
export async function getPublicWorkerProfile(workerUserId: string) {
  const admin = createAdminClient();

  const { data: user, error: userErr } = await admin
    .from("users")
    .select("id, display_name, avatar_url, created_at")
    .eq("id", workerUserId)
    .single();

  if (userErr || !user) return null;

  const { data: profile, error: profileErr } = await admin
    .from("worker_profiles")
    .select(
      "user_id, skills, experience_level, rate_min, rate_max, bio, service_radius_km, service_center, availability, is_verified, total_jobs, avg_rating, portfolio_urls"
    )
    .eq("user_id", workerUserId)
    .single();

  if (profileErr || !profile) return null;

  let serviceLat: number | null = null;
  let serviceLng: number | null = null;
  const raw = profile.service_center as { type?: string; coordinates?: number[] } | null;
  if (raw && typeof raw === "object" && Array.isArray(raw.coordinates) && raw.coordinates.length >= 2) {
    serviceLng = raw.coordinates[0];
    serviceLat = raw.coordinates[1];
  }

  const { data: reviews } = await admin
    .from("reviews")
    .select("id, reviewer_id, rating, comment, tags, response, created_at")
    .eq("reviewee_id", workerUserId)
    .order("created_at", { ascending: false })
    .limit(5);

  const { service_center: _sc, ...profileSafe } = profile;
  return {
    user: {
      id: user.id,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    },
    profile: {
      ...profileSafe,
      service_lat: serviceLat,
      service_lng: serviceLng,
    },
    recent_reviews: reviews ?? [],
  };
}
