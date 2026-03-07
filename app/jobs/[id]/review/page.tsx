import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JobReviewForm from "@/components/JobReviewForm";
import { PageContainer } from "@/components/PageContainer";

export default async function JobReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/jobs/" + id + "/review");

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, homeowner_id, worker_id, status")
    .eq("id", id)
    .single();

  if (error || !job) notFound();
  if (job.status !== "completed") redirect("/jobs/" + id);

  const isHomeowner = job.homeowner_id === user.id;
  if (!isHomeowner) redirect("/jobs/" + id);

  const revieweeId = job.worker_id;
  if (!revieweeId) redirect("/jobs/" + id);

  let revieweeDisplayName = "Worker";
  const { data: revieweeUser } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", revieweeId)
    .single();
  if (revieweeUser?.display_name) revieweeDisplayName = revieweeUser.display_name;

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("job_id", id)
    .eq("reviewer_id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen py-8 max-w-[480px] mx-auto page-bg"><PageContainer>
      <h1 className="font-display text-2xl lg:text-[28px] font-bold text-text-primary tracking-tight mb-2">
        Leave a review
      </h1>
      <p className="text-[15px] font-body text-text-secondary leading-relaxed mb-6">
        Rate and review {revieweeDisplayName} for the completed job.
      </p>

      {existingReview ? (
        <div className="card-kumpuni p-6 text-center">
          <p className="text-[15px] font-body font-medium text-text-primary mb-4">
            Salamat! Na-submit na ang review mo para sa job na ito.
          </p>
          <Link href={`/jobs/${id}`} className="btn-primary inline-flex">
            Back to job detail
          </Link>
        </div>
      ) : (
        <JobReviewForm
          jobId={id}
          revieweeId={revieweeId}
          revieweeDisplayName={revieweeDisplayName}
        />
      )}
    </PageContainer></main>
  );
}
