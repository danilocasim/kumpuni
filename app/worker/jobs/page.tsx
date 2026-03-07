import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageContainer } from "@/components/PageContainer";

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  carpentry: "Carpentry",
  painting: "Painting",
  masonry: "Masonry",
  general: "General Repair",
};

const URGENCY_LABELS: Record<string, string> = {
  asap: "ASAP",
  this_week: "This Week",
  flexible: "Flexible",
};

export default async function WorkerJobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?role=worker&next=/worker/jobs");

  const admin = createAdminClient();
  const { data: jobs, error } = await admin.rpc("get_worker_job_feed", {
    p_worker_id: user.id,
  });

  if (error) {
    return (
      <main className="min-h-screen page-bg py-8">
        <PageContainer>
          <div className="card-kumpuni p-6 bg-danger-light border-danger-red/20">
            <p className="text-danger-red font-medium">Error loading. Try again.</p>
            <p className="text-sm text-danger-red/80 mt-1">Siguraduhing kumpleto ang profile mo (skills at service area).</p>
          </div>
        </PageContainer>
      </main>
    );
  }

  const list = (jobs ?? []) as Array<{
    id: string;
    category: string;
    description: string;
    barangay: string;
    urgency: string;
    budget_range: string | null;
    matching_mode: string;
    created_at: string;
    distance_km: number;
    interested_count: number;
  }>;

  return (
    <main className="min-h-screen page-bg py-8">
      <PageContainer>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Available jobs
        </h1>
        <p className="text-text-secondary text-lg">
          Jobs na match sa skills mo at malapit sa service area mo.
        </p>
      </div>

      {!list.length ? (
        <div className="card-kumpuni p-8 text-center text-text-secondary">
          No open jobs near your area right now. Try again later.
        </div>
      ) : (
        <ul className="space-y-4">
          {list.map((job) => (
            <li key={job.id}>
              <Link
                href={`/worker/jobs/${job.id}`}
                className="block card-kumpuni hover:border-kumpuni-blue/30 hover:bg-blue-50/30 transition-colors group"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`badge-status ${job.matching_mode === "fast" ? "badge-asap" : "badge-flexible"}`}>
                      {job.matching_mode === "fast" ? "Fast Match" : "Flexible"}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-text-primary">
                        {CATEGORY_LABELS[job.category] ?? job.category}
                      </span>
                    </div>
                  </div>

                  <p className="text-lg font-semibold text-text-primary line-clamp-2 mb-3 group-hover:text-kumpuni-blue transition-colors">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-tertiary mb-3 pt-3 border-t border-subtle">
                    <span className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      {job.barangay}
                      {typeof job.distance_km === "number" && ` (${job.distance_km.toFixed(1)} km)`}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {URGENCY_LABELS[job.urgency] ?? job.urgency}
                    </span>
                    {job.budget_range && (
                      <span className="flex items-center gap-1.5 font-medium text-text-secondary">
                        {job.budget_range}
                      </span>
                    )}
                    {job.matching_mode === "fast" && typeof job.interested_count === "number" && (
                      <span className="flex items-center gap-1.5 text-action-orange font-medium bg-orange-50 px-2 py-0.5 rounded-full">
                        {job.interested_count} interested
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-text-tertiary">
                    Posted: {new Date(job.created_at).toLocaleString("en-PH", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      </PageContainer>
    </main>
  );
}
