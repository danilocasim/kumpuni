import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import WorkerJobDetail from "@/components/WorkerJobDetail";
import WorkerJobStatusActions from "@/components/WorkerJobStatusActions";

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  carpentry: "Carpentry",
  painting: "Painting",
  masonry: "Masonry",
  general: "General Repair",
};

export default async function WorkerJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/worker/jobs/" + id);

  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("jobs")
    .select(
      "id, worker_id, homeowner_id, category, description, barangay, address, urgency, budget_range, status, matching_mode, fast_match_expires_at, created_at"
    )
    .eq("id", id)
    .single();

  if (error || !job) notFound();

  if (job.status !== "open" && job.worker_id !== user.id) {
    return (
      <main className="min-h-screen p-4">
        <p className="text-gray-600">Hindi available ang job na ito.</p>
        <Link href="/worker/jobs" className="mt-2 inline-block text-blue-600 underline">
          Balik sa job list
        </Link>
      </main>
    );
  }

  let homeownerPhone: string | null = null;
  if (job.worker_id === user.id && (job.status === "matched" || job.status === "in_progress") && job.homeowner_id) {
    const { data: homeowner } = await admin
      .from("users")
      .select("phone")
      .eq("id", job.homeowner_id)
      .single();
    homeownerPhone = homeowner?.phone ?? null;
  }

  let alreadyInterested = false;
  const { data: interest } = await supabase
    .from("job_interests")
    .select("id")
    .eq("job_id", id)
    .eq("worker_id", user.id)
    .maybeSingle();
  if (interest) alreadyInterested = true;

  const isFastMatch =
    job.matching_mode === "fast" &&
    job.status === "open" &&
    (!job.fast_match_expires_at || new Date(job.fast_match_expires_at) > new Date());

  const isAssignedWorker = job.worker_id === user.id;
  const showContact = isAssignedWorker && (job.status === "matched" || job.status === "in_progress");

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Job detail</h1>
      <div className="rounded-lg border border-gray-200 p-4 space-y-2">
        <p className="font-medium">{CATEGORY_LABELS[job.category] ?? job.category}</p>
        <p className="text-sm text-gray-700">{job.description}</p>
        <p className="text-sm text-gray-600">Barangay: {job.barangay}</p>
        <p className="text-sm text-gray-600">
          Urgency:{" "}
          {job.urgency === "asap"
            ? "ASAP"
            : job.urgency === "this_week"
              ? "This Week"
              : "Flexible"}
        </p>
        {job.budget_range && (
          <p className="text-sm text-gray-600">Budget: {job.budget_range}</p>
        )}
        <p className="text-xs text-gray-500">
          Posted: {new Date(job.created_at).toLocaleString("en-PH")}
        </p>
      </div>

      {showContact && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">
          <p className="text-sm font-medium text-gray-800">Contact / Address</p>
          <p className="text-sm text-gray-700">
            Address: {(job.address && job.address.trim()) ? job.address : job.barangay}
          </p>
          {homeownerPhone && (
            <p className="text-sm text-gray-700">
              Homeowner: <a href={`tel:${homeownerPhone}`} className="text-blue-600 underline">{homeownerPhone}</a>
            </p>
          )}
        </div>
      )}

      {isAssignedWorker && (job.status === "matched" || job.status === "in_progress") && (
        <WorkerJobStatusActions jobId={id} currentStatus={job.status} />
      )}

      {job.status === "open" && (
        <WorkerJobDetail
          jobId={id}
          isFastMatch={isFastMatch}
          alreadyInterested={alreadyInterested}
          fastMatchExpiresAt={job.fast_match_expires_at}
        />
      )}

      <div className="mt-6">
        <Link
          href="/worker/jobs"
          className="text-blue-600 underline"
        >
          Balik sa job list
        </Link>
      </div>
    </main>
  );
}
