import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  if (!user) redirect("/login?next=/worker/jobs");

  const admin = createAdminClient();
  const { data: jobs, error } = await admin.rpc("get_worker_job_feed", {
    p_worker_id: user.id,
  });

  if (error) {
    return (
      <main className="min-h-screen p-4">
        <p className="text-red-600">May error sa pag-load. Subukan muli.</p>
        <p className="text-xs text-gray-500 mt-1">Siguraduhing kumpleto ang profile mo (skills at service area).</p>
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
    <main className="min-h-screen p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Mga available na job</h1>
      <p className="text-sm text-gray-600 mb-4">
        Jobs na match sa skills mo at malapit sa service area mo.
      </p>
      {!list.length ? (
        <p className="text-gray-600">Wala pang open jobs ngayon na malapit sa area mo. Subukan mamaya.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((job) => (
            <li key={job.id}>
              <Link
                href={`/worker/jobs/${job.id}`}
                className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-amber-600">
                    {job.matching_mode === "fast" ? "Fast Match" : "Flexible"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {typeof job.distance_km === "number" ? `${job.distance_km} km` : ""}
                  </span>
                  {job.matching_mode === "fast" && typeof job.interested_count === "number" && (
                    <span className="text-xs text-gray-500">
                      {job.interested_count} interested
                    </span>
                  )}
                </div>
                <p className="font-medium">{CATEGORY_LABELS[job.category] ?? job.category}</p>
                <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {job.barangay} · {URGENCY_LABELS[job.urgency] ?? job.urgency}
                  {job.budget_range ? ` · ${job.budget_range}` : ""}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Posted: {new Date(job.created_at).toLocaleString("en-PH", { dateStyle: "short", timeStyle: "short" })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
