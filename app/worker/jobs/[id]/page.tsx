import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import WorkerJobPageClient from "@/components/WorkerJobPageClient";

export default async function WorkerJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?role=worker&next=/worker/jobs/" + id);

  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("jobs")
    .select(
      "id, worker_id, homeowner_id, category, description, barangay, address, urgency, budget_range, status, matching_mode, fast_match_expires_at, created_at, worker_reported_amount"
    )
    .eq("id", id)
    .single();

  if (error || !job) notFound();

  if (job.status !== "open" && job.worker_id !== user.id) {
    return (
      <main className="min-h-screen p-4 page-bg">
        <p className="text-body text-text-primary">This job is not available.</p>
        <Link href="/worker/jobs" className="btn-ghost mt-2 inline-block">
          Back to job list
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

  return (
    <WorkerJobPageClient
      jobId={id}
      currentUserId={user.id}
      initialJob={{
        id: job.id,
        worker_id: job.worker_id,
        homeowner_id: job.homeowner_id,
        category: job.category,
        description: job.description,
        barangay: job.barangay,
        address: job.address,
        urgency: job.urgency,
        budget_range: job.budget_range,
        status: job.status,
        matching_mode: job.matching_mode,
        fast_match_expires_at: job.fast_match_expires_at,
        created_at: job.created_at,
        worker_reported_amount: job.worker_reported_amount,
      }}
      homeownerPhone={homeownerPhone}
      alreadyInterested={alreadyInterested}
    />
  );
}
