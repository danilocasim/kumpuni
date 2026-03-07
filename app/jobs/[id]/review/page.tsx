import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JobReviewForm from "@/components/JobReviewForm";

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
  const isWorker = job.worker_id === user.id;
  if (!isHomeowner && !isWorker) redirect("/dashboard");

  const revieweeId = isHomeowner ? job.worker_id : job.homeowner_id;
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
    <main className="min-h-screen p-4 pb-24 max-w-[480px] mx-auto page-bg">
      <h1 className="font-heading text-headline-mobile font-bold text-slate-text mb-2">
        Mag-iwan ng review
      </h1>
      <p className="text-body text-muted-gray mb-6">
        I-rate at i-review si {revieweeDisplayName} para sa natapos na job.
      </p>

      {existingReview ? (
        <div className="card-kumpuni p-6 text-center">
          <p className="text-body font-medium text-slate-text mb-4">
            Salamat! Na-submit na ang review mo para sa job na ito.
          </p>
          <Link href={`/jobs/${id}`} className="btn-primary inline-flex">
            Balik sa job detail
          </Link>
        </div>
      ) : (
        <JobReviewForm
          jobId={id}
          revieweeId={revieweeId}
          revieweeDisplayName={revieweeDisplayName}
        />
      )}
    </main>
  );
}
