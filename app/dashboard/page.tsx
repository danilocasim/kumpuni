import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  matched: "Matched",
  in_progress: "In Progress",
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

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, category, description, status, created_at, urgency, matching_mode")
    .eq("homeowner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen p-4 page-bg">
        <p className="text-danger-red text-body">May error sa pag-load ng jobs. Subukan muli.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 pb-24 max-w-[480px] mx-auto page-bg">
      <h1 className="font-heading text-headline-mobile font-bold text-slate-text mb-6">
        Mga Job ko
      </h1>
      {!jobs?.length ? (
        <>
          <p className="text-body text-slate-text">Wala ka pang na-post na job.</p>
          <Link href="/jobs/new" className="btn-primary mt-4 inline-flex">
            MAG-POST NG JOB
          </Link>
        </>
      ) : (
        <ul className="space-y-card-gap">
          {jobs.map((job) => (
            <li key={job.id}>
              <div className="card-kumpuni p-4">
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
                      Detail
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
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6">
        <Link href="/jobs/new" className="btn-primary inline-flex">
          MAG-POST NG JOB
        </Link>
      </div>
    </main>
  );
}
