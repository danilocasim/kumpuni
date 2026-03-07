import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HomeownerJobDetail from "@/components/HomeownerJobDetail";

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

  return (
    <HomeownerJobDetail
      jobId={id}
      initialJob={{
        id: job.id,
        homeowner_id: job.homeowner_id,
        category: job.category,
        description: job.description,
        status: job.status,
        urgency: job.urgency,
        budget_range: job.budget_range,
        barangay: job.barangay,
        matching_mode: job.matching_mode,
        created_at: job.created_at,
      }}
    />
  );
}
