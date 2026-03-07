import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getSessionRole, canUseHomeownerFeatures } from "@/lib/auth-role";
import { PageContainer } from "@/components/PageContainer";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  matched: "Matched",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-light text-kumpuni-blue",
  matched: "bg-orange-light text-action-orange",
  in_progress: "bg-orange-light text-action-orange",
  completed: "bg-green-light text-verified-green",
  cancelled: "bg-gray-100 text-muted-gray",
};

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  carpentry: "Carpentry",
  painting: "Painting",
  masonry: "Masonry",
  general: "General Repair",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const supabase = await createClient();
  const { user, role } = await getSessionRole(supabase);
  if (!user) redirect("/");
  if (!canUseHomeownerFeatures(role)) redirect("/worker/dashboard?message=homeowner_only");

  const { message } = await searchParams;

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, category, description, status, created_at, urgency, matching_mode")
    .eq("homeowner_id", user.id)
    .order("created_at", { ascending: false });

  const completedIds = (jobs ?? []).filter((j) => j.status === "completed").map((j) => j.id);
  let reviewedJobIds: string[] = [];
  if (completedIds.length > 0) {
    const { data: reviews } = await supabase
      .from("reviews")
      .select("job_id")
      .eq("reviewer_id", user.id)
      .in("job_id", completedIds);
    reviewedJobIds = (reviews ?? []).map((r) => r.job_id);
  }

  const cardAccentByStatus: Record<string, string> = {
    open: "card-accent-open",
    matched: "card-accent-open",
    in_progress: "card-accent-open",
    completed: "card-accent-completed",
    cancelled: "card-accent-cancelled",
  };

  if (error) {
    return (
      <main className="min-h-screen page-bg pt-6">
        <PageContainer>
          <p className="text-danger-red text-body">Error loading jobs. Try again.</p>
        </PageContainer>
      </main>
    );
  }

  return (
    <main className="min-h-screen page-bg pt-6 pb-6">
      <PageContainer>
      <h1 className="font-display text-2xl lg:text-[28px] font-bold text-slate-text mb-6 tracking-tight" style={{ letterSpacing: "-0.3px" }}>
        My Jobs
      </h1>
      {message === "worker_only" && (
        <div className="mb-4 p-3 rounded-kumpuni-sm bg-blue-light/50 border border-kumpuni-blue/30 text-body text-slate-text">
          That section is for workers only. Here you can post jobs and view their status.
        </div>
      )}
      {!jobs?.length ? (
        <>
          <p className="text-body text-slate-text">You haven&apos;t posted any jobs yet.</p>
          <Link href="/jobs/new" className="btn-primary mt-4 inline-flex">
            POST A JOB
          </Link>
        </>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <div className={`card-kumpuni ${cardAccentByStatus[job.status] ?? ""}`}>
                <Link href={`/jobs/${job.id}`} className="block">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${
                        STATUS_STYLES[job.status] ?? "bg-gray-100 text-slate-text"
                      }`}
                    >
                      {STATUS_LABELS[job.status] ?? job.status}
                    </span>
                    <span className="text-caption text-muted-gray">
                      {CATEGORY_LABELS[job.category] ?? job.category}
                    </span>
                  </div>
                  <p className="text-body text-slate-text line-clamp-2 mt-1">
                    {job.description}
                  </p>
                  <p className="text-caption text-muted-gray mt-1">
                    {new Date(job.created_at).toLocaleDateString("en-PH", {
                      dateStyle: "short",
                    })}
                  </p>
                </Link>
                {job.status === "open" && (
                  <div className="mt-2 flex gap-2">
                    <Link href={`/jobs/${job.id}`} className="btn-ghost text-caption">
                      Details
                    </Link>
                    {job.matching_mode === "flexible" && (
                      <Link
                        href={`/jobs/${job.id}/browse`}
                        className="btn-ghost text-caption font-medium"
                      >
                        Browse workers
                      </Link>
                    )}
                    {job.matching_mode === "fast" && (
                      <Link
                        href={`/jobs/${job.id}/fast`}
                        className="btn-ghost text-caption font-medium text-action-orange"
                      >
                        Fast Match
                      </Link>
                    )}
                  </div>
                )}
                {job.status === "completed" && !reviewedJobIds.includes(job.id) && (
                  <div className="mt-2">
                    <Link
                      href={`/jobs/${job.id}/review`}
                      className="btn-ghost text-caption font-medium text-verified-green"
                    >
                      Leave a review →
                    </Link>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 flex justify-start">
        <Link href="/jobs/new" className="btn-primary inline-flex">
          POST A JOB
        </Link>
      </div>
      </PageContainer>
    </main>
  );
}
