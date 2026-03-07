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
    <main className="min-h-screen page-bg py-8">
      <PageContainer>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Worker Dashboard
        </h1>
        <p className="text-text-secondary text-lg">
          Dito mo makikita ang iyong availability, active job, at job history.
        </p>
      </div>

      {message === "homeowner_only" && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-info-light text-text-primary flex gap-3 items-start shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-kumpuni-blue shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          <span className="font-medium text-sm">Mga homeowner lang ang pwede mag-post ng trabaho. Bilang kumpunero, dito mo makikita ang mga trabaho mo.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <WorkerAvailabilitySection />

          <div className="card-kumpuni p-6 relative overflow-hidden group">
            <h2 className="text-xl font-bold text-text-primary mb-4 relative z-10">Location Services</h2>
            <div className="relative z-10">
              <ShareLocationButton />
            </div>

            {/* Background Map Graphic that fades out on hover */}
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none z-0">
               <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
            </div>
          </div>

          {/* Active job (T053) */}
          {activeJob && (
            <div className="card-kumpuni p-6 border-l-4 border-l-kumpuni-blue relative overflow-hidden">
               <div className="absolute -right-4 -top-4 opacity-5 text-kumpuni-blue rotate-12">
                 <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
               </div>

              <div className="flex justify-between items-start mb-4 relative z-10">
                <h2 className="text-xl font-extrabold text-text-primary tracking-tight">
                  Ginagawang Trabaho
                </h2>
                <span className="badge-status badge-this-week shadow-sm">
                  {STATUS_LABELS[activeJob.status] ?? activeJob.status}
                </span>
              </div>
              <p className="font-semibold text-text-primary text-lg mb-1 relative z-10">
                {CATEGORY_LABELS[activeJob.category] ?? activeJob.category}
              </p>
              <p className="text-text-secondary mb-5 relative z-10">
                {activeJob.description}
              </p>

              <div className="bg-surface-light rounded-xl p-5 mb-5 border border-subtle shadow-inner relative z-10">
                <div className="flex items-center gap-2 mb-3 border-b border-subtle pb-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-kumpuni-blue"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                   <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Contact at Address</p>
                </div>

                <div className="space-y-2">
                   <div className="flex gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary shrink-0 mt-0.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      <p className="text-text-primary font-medium">
                        {(activeJob.address && activeJob.address.trim()) ? activeJob.address : activeJob.barangay}
                      </p>
                   </div>

                  {homeownerPhone && (
                    <div className="flex gap-2 items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-kumpuni-blue shrink-0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      <p className="text-text-primary">
                        <a href={`tel:${homeownerPhone}`} className="text-kumpuni-blue hover:underline font-bold text-lg">
                          {homeownerPhone}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Link
                href={`/worker/jobs/${activeJob.id}`}
                className="btn-primary w-full sm:w-auto inline-flex justify-center shadow-md relative z-10"
              >
                Tingnan ang Detalye
              </Link>
            </div>
          )}

          {/* Job history (T053) */}
          <div className="card-kumpuni p-6 relative overflow-hidden">

            <h2 className="text-xl font-bold text-text-primary mb-4 tracking-tight border-b border-subtle pb-4">
              Job History
            </h2>
            {historyJobs.length === 0 ? (
               <div className="text-center py-8">
                  <div className="w-12 h-12 bg-surface-light rounded-full flex items-center justify-center mx-auto mb-3 text-text-tertiary">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <p className="text-text-secondary">Wala ka pang natapos na trabaho.</p>
               </div>
            ) : (
              <ul className="space-y-4">
                {historyJobs.map((job) => (
                  <li key={job.id}>
                    <Link
                      href={`/worker/jobs/${job.id}`}
                      className="block p-4 rounded-xl border border-subtle hover:border-kumpuni-blue/40 hover:bg-blue-50/50 transition-all group hover:shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <span className="font-bold text-text-primary group-hover:text-kumpuni-blue transition-colors">
                          {CATEGORY_LABELS[job.category] ?? job.category}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-text-tertiary bg-white border border-subtle px-2 py-1 rounded-md">
                            {job.completed_at
                              ? new Date(job.completed_at).toLocaleDateString("en-PH", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                          </span>
                          {ratingsByJob[job.id] != null && (
                            <span className="text-action-orange text-sm font-bold bg-orange-50 px-2.5 py-1 rounded-full border border-warning-light shadow-sm flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                              {ratingsByJob[job.id]}
                            </span>
                          )}
                        </div>
                      </div>
                      {job.worker_reported_amount != null && (
                        <p className="text-sm font-medium text-success-green flex gap-1 items-center mt-3 bg-success-light/30 w-fit px-2 py-0.5 rounded-md">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                          Nai-report: ₱{job.worker_reported_amount}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8 pt-6 border-t border-subtle">
              <Link
                href="/worker/jobs"
                className="btn-secondary w-full justify-center shadow-sm hover:translate-y-[-2px] transition-transform"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Maghanap ng Trabaho sa Map
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          {/* Profile completeness (T055) */}
          <div className={`card-kumpuni p-6 sticky top-24 shadow-md bg-gradient-to-b from-white to-surface-light ${completeness.complete ? "border-t-4 border-t-success-green" : "border-t-4 border-t-action-orange"}`}>
            <h2 className="text-xl font-extrabold text-text-primary mb-4 tracking-tight">
              Profile mo
            </h2>
            {completeness.complete ? (
              <div className="flex items-center gap-2 text-success-green font-bold mb-5 bg-success-light p-3 rounded-xl border border-success-green/30 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                100% Kumpleto
              </div>
            ) : (
              <div className="mb-5 bg-orange-50 p-4 rounded-xl border border-warning-light">
                <p className="text-text-primary font-bold mb-3 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-action-orange"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                   Kulang pa ang profile:
                </p>
                <ul className="text-sm text-text-secondary list-none space-y-2">
                  {completeness.missing.map((item) => (
                    <li key={item} className="flex gap-2 items-start">
                       <span className="text-action-orange">•</span>
                       <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex items-center justify-between py-4 border-t border-b border-subtle mb-5">
              <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">Verification</span>
              {completeness.isVerified ? (
                <span className="badge-status badge-completed shadow-sm">Verified</span>
              ) : (
                <span className="badge-status badge-flexible border border-warning-light bg-orange-50 text-action-orange font-bold shadow-sm">Hindi Pa</span>
              )}
            </div>
            <Link href="/worker/setup" className="btn-secondary w-full justify-center">
              I-edit ang profile
            </Link>
          </div>
        </div>
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
