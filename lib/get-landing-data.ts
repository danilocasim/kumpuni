import { createAdminClient } from "@/lib/supabase/admin";

export type FeaturedWorker = {
  worker_id: string;
  display_name: string | null;
  avatar_url: string | null;
  skills: string[];
  avg_rating: number;
  total_jobs: number;
  review_count: number;
  rate_min: number | null;
  rate_max: number | null;
  availability: string;
  is_verified: boolean;
};

export type LandingData = {
  workers: FeaturedWorker[];
  jobsCompletedThisMonth: number;
};

/**
 * Server-only. Fetches data for the landing page: up to 3 featured workers and jobs completed this month.
 */
export async function getLandingData(): Promise<LandingData> {
  const admin = createAdminClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [workersResult, jobsResult] = await Promise.all([
    admin
      .from("worker_profiles")
      .select(
        `
        user_id,
        skills,
        rate_min,
        rate_max,
        total_jobs,
        avg_rating,
        availability,
        is_verified
      `
      )
      .order("total_jobs", { ascending: false })
      .limit(3),
    admin
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("completed_at", startOfMonth.toISOString()),
  ]);

  const workerIds =
    workersResult.data?.map((r) => r.user_id as string).filter(Boolean) ?? [];
  if (workerIds.length === 0) {
    const workers: FeaturedWorker[] = [];
    return {
      workers,
      jobsCompletedThisMonth: jobsResult.count ?? 0,
    };
  }

  const [usersResult, reviewsResult] = await Promise.all([
    admin.from("users").select("id, display_name, avatar_url").in("id", workerIds),
    admin
      .from("reviews")
      .select("reviewee_id")
      .in("reviewee_id", workerIds),
  ]);

  const usersById = new Map(
    (usersResult.data ?? []).map((u) => [u.id, u])
  );
  const reviewCountByWorker = new Map<string, number>();
  for (const r of reviewsResult.data ?? []) {
    const id = r.reviewee_id as string;
    reviewCountByWorker.set(id, (reviewCountByWorker.get(id) ?? 0) + 1);
  }

  const workers: FeaturedWorker[] = (workersResult.data ?? []).map((row) => {
    const u = usersById.get(row.user_id as string);
    return {
      worker_id: row.user_id as string,
      display_name: u?.display_name ?? null,
      avatar_url: u?.avatar_url ?? null,
      skills: Array.isArray(row.skills) ? (row.skills as string[]) : [],
      avg_rating: Number(row.avg_rating) || 0,
      total_jobs: Number(row.total_jobs) || 0,
      review_count: reviewCountByWorker.get(row.user_id as string) ?? 0,
      rate_min: row.rate_min != null ? Number(row.rate_min) : null,
      rate_max: row.rate_max != null ? Number(row.rate_max) : null,
      availability: (row.availability as string) ?? "not_available",
      is_verified: Boolean(row.is_verified),
    };
  });

  return {
    workers,
    jobsCompletedThisMonth: jobsResult.count ?? 0,
  };
}
