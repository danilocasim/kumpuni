import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import JobFastMatch from "@/components/JobFastMatch";
import { PageContainer } from "@/components/PageContainer";

export default async function JobFastPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/jobs/" + id + "/fast");

  const admin = createAdminClient();
  const { data: job, error: jobErr } = await admin
    .from("jobs")
    .select("id, homeowner_id, fast_match_expires_at, status, matching_mode, location")
    .eq("id", id)
    .single();

  if (jobErr || !job) {
    return (
      <main className="min-h-screen p-4">
        <p className="text-red-600">Job not found.</p>
        <Link href="/dashboard" className="mt-2 inline-block text-blue-600 underline">
          Back to dashboard
        </Link>
      </main>
    );
  }
  if (job.homeowner_id !== user.id) {
    redirect("/dashboard");
  }

  const { data: workers } = await admin.rpc("get_interested_workers", {
    p_job_id: id,
  });

  // parse location "POINT(lng lat)"
  let lat: number | undefined;
  let lng: number | undefined;
  if (job.location) {
    const match = job.location.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
    if (match) {
      lng = parseFloat(match[1]);
      lat = parseFloat(match[2]);
    }
  }

  const initialJob = {
    id: job.id,
    fast_match_expires_at: job.fast_match_expires_at,
    status: job.status,
    matching_mode: job.matching_mode,
    lat,
    lng,
  };
  const initialWorkers = (workers ?? []) as Array<{
    worker_id: string;
    display_name: string | null;
    avg_rating: number;
    rate_min: number | null;
    rate_max: number | null;
    total_jobs: number;
    distance_km: number | null;
  }>;

  return (
    <main className="min-h-screen page-bg pt-6 pb-12"><PageContainer>
      <h1 className="font-display text-2xl lg:text-3xl font-bold text-text-primary mb-6 tracking-tight">Fast Match — interested workers</h1>
      <JobFastMatch
        jobId={id}
        initialJob={initialJob}
        initialWorkers={initialWorkers}
      />
      </PageContainer>
    </main>
  );
}
