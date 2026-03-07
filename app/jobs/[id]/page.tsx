import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  matched: "Matched",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  carpentry: "Carpentry",
  painting: "Painting",
  masonry: "Masonry",
  general: "General Repair",
};

const URGENCY_LABELS: Record<string, string> = {
  asap: "Today / ASAP",
  this_week: "This Week",
  flexible: "Flexible / No Rush",
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/jobs/" + id);

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, homeowner_id, category, description, status, urgency, budget_range, barangay, matching_mode, created_at")
    .eq("id", id)
    .single();

  if (error || !job) notFound();
  if (job.homeowner_id !== user.id) redirect("/dashboard");

  const isOpen = job.status === "open";
  const isFlexible = job.matching_mode === "flexible";
  const isFast = job.matching_mode === "fast";

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Job detail</h1>

      <div className="rounded-lg border border-gray-200 p-4 space-y-2 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {STATUS_LABELS[job.status] ?? job.status}
          </span>
          <span className="text-sm text-gray-600">
            {CATEGORY_LABELS[job.category] ?? job.category}
          </span>
        </div>
        <p className="text-gray-700">{job.description}</p>
        <p className="text-sm text-gray-600">Barangay: {job.barangay}</p>
        <p className="text-sm text-gray-600">
          Urgency: {URGENCY_LABELS[job.urgency] ?? job.urgency}
        </p>
        {job.budget_range && (
          <p className="text-sm text-gray-600">Budget: {job.budget_range}</p>
        )}
        <p className="text-xs text-gray-500">
          Posted {new Date(job.created_at).toLocaleString("en-PH")}
        </p>
      </div>

      {isOpen && (
        <div className="space-y-3 mb-6">
          {isFlexible && (
            <Link
              href={`/jobs/${id}/browse`}
              className="block w-full min-h-touch rounded-lg bg-blue-600 px-4 py-3 font-medium text-white text-center"
            >
              Browse workers — makita ang list at map, i-contact ang worker
            </Link>
          )}
          {isFast && (
            <Link
              href={`/jobs/${id}/fast`}
              className="block w-full min-h-touch rounded-lg bg-amber-600 px-4 py-3 font-medium text-white text-center"
            >
              Tingnan ang Fast Match — live list ng interested workers
            </Link>
          )}
        </div>
      )}

      <Link href="/dashboard" className="text-blue-600 underline text-sm">
        ← Balik sa Mga Job ko
      </Link>
    </main>
  );
}
