import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageContainer } from "@/components/PageContainer";
import WorkerJobsClient from "./WorkerJobsClient";

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
    lat?: number;
    lng?: number;
  }>;

  return (
    <main className="min-h-screen page-bg py-8">
      <PageContainer>
         <WorkerJobsClient initialJobs={list} />
      </PageContainer>
    </main>
  );
}
