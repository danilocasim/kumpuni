import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BrowseWorkersView from "@/components/BrowseWorkersView";
import { PageContainer } from "@/components/PageContainer";

export default async function JobBrowsePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ min_rating?: string }>;
}) {
  const { id } = await params;
  const { min_rating } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/jobs/" + id + "/browse");

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, homeowner_id")
    .eq("id", id)
    .single();

  if (error || !job) {
    return (
      <main className="min-h-screen page-bg pt-6">
        <PageContainer wide>
          <p className="text-danger-red text-body">Job not found.</p>
          <Link href="/dashboard" className="mt-2 inline-block btn-ghost">
            Back to dashboard
          </Link>
        </PageContainer>
      </main>
    );
  }
  if (job.homeowner_id !== user.id) {
    redirect("/dashboard");
  }

  const initialMinRating = min_rating != null ? parseFloat(min_rating) : 3.0;
  const safeRating =
    Number.isFinite(initialMinRating) && initialMinRating >= 0 && initialMinRating <= 5
      ? initialMinRating
      : 3.0;

  return (
    <main className="min-h-screen page-bg pt-6 pb-6">
      <PageContainer wide>
        <h1 className="font-display text-2xl lg:text-[28px] font-bold text-slate-text mb-2 tracking-tight" style={{ letterSpacing: "-0.3px" }}>
          Workers
        </h1>
        <p className="text-[13px] text-muted-gray font-body mb-4">
          View the list and map of workers nearby. Set minimum rating, then tap a worker to see their profile and Contact to reveal their number.
        </p>
        <BrowseWorkersView jobId={id} initialMinRating={safeRating} />
      </PageContainer>
    </main>
  );
}
