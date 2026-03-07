import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ShareLocationButton from "@/components/ShareLocationButton";
import WorkerAvailabilitySection from "@/components/WorkerAvailabilitySection";
import { PageContainer } from "@/components/PageContainer";

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  carpentry: "Carpentry",
  painting: "Painting",
  masonry: "Masonry",
  general: "General Repair",
};

const STATUS_LABELS: Record<string, string> = {
  matched: "Na-match",
  in_progress: "Ginagawa",
  completed: "Tapos na",
};

export default async function WorkerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?role=worker&next=/worker/dashboard");

  const { message } = await searchParams;

  const admin = createAdminClient();

  const [
    activeJobsResult,
    historyJobsResult,
    profileResult,
    userRowResult,
  ] = await Promise.all([
    admin
      .from("jobs")
      .select("id, category, description, barangay, address, status, homeowner_id, created_at")
      .eq("worker_id", user.id)
      .in("status", ["matched", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1),
    admin
      .from("jobs")
      .select("id, category, status, completed_at, worker_reported_amount")
      .eq("worker_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(20),
    admin
      .from("worker_profiles")
      .select("user_id, skills, rate_min, rate_max, service_center, is_verified")
      .eq("user_id", user.id)
      .single(),
    admin
      .from("users")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single(),
  ]);

  const activeJob = activeJobsResult.data?.[0] ?? null;
  const historyJobs = historyJobsResult.data ?? [];
  const profile = profileResult.data;
  const userRow = userRowResult.data;

  let homeownerPhone: string | null = null;
  if (activeJob?.homeowner_id) {
    const { data: homeowner } = await admin
      .from("users")
      .select("phone")
      .eq("id", activeJob.homeowner_id)
      .single();
    homeownerPhone = homeowner?.phone ?? null;
  }

  const completedIds = historyJobs.map((j) => j.id);
  let ratingsByJob: Record<string, number> = {};
  if (completedIds.length > 0) {
    const { data: reviews } = await admin
      .from("reviews")
      .select("job_id, rating")
      .eq("reviewee_id", user.id)
      .in("job_id", completedIds);
    for (const r of reviews ?? []) {
      ratingsByJob[r.job_id] = r.rating;
    }
  }

  const completeness = computeCompleteness(profile, userRow);

  return (
    <main className="min-h-screen page-bg pt-6 pb-6">
      <PageContainer>
      <h1 className="font-display text-2xl lg:text-[28px] font-bold text-slate-text mb-2 tracking-tight" style={{ letterSpacing: "-0.3px" }}>
        Worker dashboard
      </h1>
      <p className="text-body text-muted-gray mb-6">
        Here you see your availability, active job, and job history.
      </p>

      {message === "homeowner_only" && (
        <div className="mb-4 p-3 rounded-kumpuni-sm bg-blue-light/50 border border-kumpuni-blue/30 text-body text-slate-text">
          Only homeowners can post jobs. As a worker, you see your jobs and profile here.
        </div>
      )}

      {/* Profile completeness (T055) */}
      <div className={`card-kumpuni p-4 mb-6 ${completeness.complete ? "border-wood-brown/40" : "border-action-orange/30"}`}>
        <h2 className="font-heading text-[15px] font-bold text-slate-text mb-2">
          Profile mo
        </h2>
        {completeness.complete ? (
          <p className="text-body text-verified-green font-medium">Kumpleto</p>
        ) : (
          <>
            <p className="text-body text-slate-text font-medium">Kulang pa</p>
            <ul className="mt-2 text-caption text-muted-gray list-disc list-inside space-y-0.5">
              {completeness.missing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}
        <p className="text-caption text-muted-gray mt-1">
          Verified: {completeness.isVerified ? "Yes" : "Not yet"}
        </p>
        <Link href="/worker/setup" className="btn-ghost text-caption mt-2 inline-block">
          I-edit ang profile
        </Link>
      </div>

      <div className="space-y-6">
        <WorkerAvailabilitySection />
        <ShareLocationButton />

        {/* Active job (T053) */}
        {activeJob && (
          <div className="card-kumpuni p-4 border-kumpuni-blue/20">
            <h2 className="font-heading text-[15px] font-bold text-slate-text mb-2">
              Active job
            </h2>
            <p className="font-medium text-slate-text">
              {CATEGORY_LABELS[activeJob.category] ?? activeJob.category}
            </p>
            <p className="text-caption text-muted-gray line-clamp-2 mt-0.5">
              {activeJob.description}
            </p>
            <p className="text-caption text-muted-gray mt-1">
              {STATUS_LABELS[activeJob.status] ?? activeJob.status}
            </p>
            <div className="mt-3 p-3 rounded-kumpuni-sm bg-blue-light/50 space-y-1">
              <p className="text-caption font-medium text-slate-text">Contact / Address</p>
              <p className="text-body text-slate-text">
                {(activeJob.address && activeJob.address.trim()) ? activeJob.address : activeJob.barangay}
              </p>
              {homeownerPhone && (
                <p className="text-body">
                  <a href={`tel:${homeownerPhone}`} className="btn-ghost">
                    {homeownerPhone}
                  </a>
                </p>
              )}
            </div>
            <Link
              href={`/worker/jobs/${activeJob.id}`}
              className="btn-secondary mt-3 w-full inline-flex justify-center"
            >
              View job detail
            </Link>
          </div>
        )}

        {/* Job history (T053) */}
        <div>
          <h2 className="font-heading text-[15px] font-bold text-slate-text mb-2">
            Job history
          </h2>
          {historyJobs.length === 0 ? (
            <p className="text-body text-muted-gray">No completed jobs yet.</p>
          ) : (
            <ul className="space-y-2">
              {historyJobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/worker/jobs/${job.id}`}
                    className="card-kumpuni p-3 block hover:shadow-kumpuni-md transition-shadow"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-body font-medium text-slate-text">
                        {CATEGORY_LABELS[job.category] ?? job.category}
                      </span>
                      <span className="text-caption text-muted-gray">
                        {job.completed_at
                          ? new Date(job.completed_at).toLocaleDateString("en-PH", {
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                      {ratingsByJob[job.id] != null && (
                        <span className="text-wood-brown text-caption">
                          ★ {ratingsByJob[job.id]}
                        </span>
                      )}
                    </div>
                    {job.worker_reported_amount != null && (
                      <p className="text-caption text-muted-gray mt-1">
                        Na-report mo: ₱{job.worker_reported_amount}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          href="/worker/jobs"
          className="btn-primary w-full lg:w-auto inline-flex justify-center"
        >
          View available jobs
        </Link>
      </div>
      </PageContainer>
    </main>
  );
}

function computeCompleteness(
  profile: { skills?: string[]; rate_min?: number | null; rate_max?: number | null; service_center?: unknown; is_verified?: boolean } | null,
  userRow: { display_name?: string | null; avatar_url?: string | null } | null
): { complete: boolean; missing: string[]; isVerified: boolean } {
  const missing: string[] = [];
  if (!userRow?.display_name?.trim()) missing.push("Display name");
  if (!userRow?.avatar_url) missing.push("Larawan ng profile");
  const hasSkills = Array.isArray(profile?.skills) && profile.skills.length > 0;
  if (!hasSkills) missing.push("Skills (at least one)");
  if (profile?.rate_min == null && profile?.rate_max == null) missing.push("Rate (min/max)");
  if (!profile?.service_center) missing.push("Service area");
  return {
    complete: missing.length === 0,
    missing,
    isVerified: !!profile?.is_verified,
  };
}
