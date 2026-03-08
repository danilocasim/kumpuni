"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import WorkerJobDetail from "@/components/WorkerJobDetail";
import WorkerJobStatusActions from "@/components/WorkerJobStatusActions";
import WorkerEarningsReport from "@/components/WorkerEarningsReport";
import ReviewResponseForm from "@/components/ReviewResponseForm";

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  carpentry: "Carpentry",
  painting: "Painting",
  masonry: "Masonry",
  general: "General Repair",
};

type JobSnapshot = {
  id: string;
  worker_id: string | null;
  homeowner_id: string;
  category: string;
  description: string;
  barangay: string;
  address: string | null;
  urgency: string;
  budget_range: string | null;
  status: string;
  matching_mode: string;
  fast_match_expires_at: string | null;
  created_at: string;
  worker_reported_amount?: number | null;
};

type EmployerReview = {
  id: string;
  rating: number;
  comment: string | null;
  tags: string[] | null;
  response: string | null;
  created_at: string;
};

export default function WorkerJobPageClient({
  jobId,
  currentUserId,
  initialJob,
  homeownerPhone,
  alreadyInterested,
  employerReview,
}: {
  jobId: string;
  currentUserId: string;
  initialJob: JobSnapshot;
  homeownerPhone: string | null;
  alreadyInterested: boolean;
  employerReview?: EmployerReview | null;
}) {
  const [job, setJob] = useState<JobSnapshot>(initialJob);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`worker_job:${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          const newRow = payload.new as JobSnapshot;
          if (newRow) setJob((prev) => ({ ...prev, ...newRow }));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  const handleCancel = async () => {
    if (job.status !== "matched" || job.worker_id !== currentUserId) return;
    setCancelError("");
    setCancelling(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error || "Could not cancel. Try again.");
        return;
      }
      setJob((prev) => ({ ...prev, status: "cancelled" }));
    } finally {
      setCancelling(false);
    }
  };

  const isFastMatch =
    job.matching_mode === "fast" &&
    job.status === "open" &&
    (!job.fast_match_expires_at || new Date(job.fast_match_expires_at) > new Date());

  const isAssignedWorker = job.worker_id === currentUserId;
  const showContact = isAssignedWorker && (job.status === "matched" || job.status === "in_progress");
  const canCancelWorker = isAssignedWorker && job.status === "matched";

  return (
    <main className="min-h-screen page-bg py-8">
      <div className="max-w-lg mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/worker/jobs" className="btn-ghost inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors pr-4 py-2 -ml-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            <span className="font-medium">Bumalik sa Listahan</span>
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight mb-6">
          Detalye ng Trabaho
        </h1>

        <div className="card-kumpuni p-0 mb-6 overflow-hidden">
          <div className="p-5 sm:p-6 bg-surface-light border-b border-subtle flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 text-kumpuni-blue border border-subtle">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-tertiary mb-1 uppercase tracking-widest">Kategorya</h2>
              <p className="text-xl font-bold text-text-primary">{CATEGORY_LABELS[job.category] ?? job.category}</p>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <h3 className="text-sm font-bold text-text-tertiary mb-2 uppercase tracking-widest">Ano ang kailangang gawin?</h3>
            <div className="bg-surface-light/50 p-4 rounded-xl border border-subtle">
              <p className="text-base text-text-primary leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6 border-t border-subtle pt-6">
              <div className="flex gap-3 items-start">
                <div className="mt-0.5 text-text-tertiary">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-tertiary mb-0.5 uppercase tracking-wider">Lokasyon</p>
                  <p className="text-base text-text-primary font-medium">{job.barangay}</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="mt-0.5 text-text-tertiary">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-tertiary mb-0.5 uppercase tracking-wider">Kailan</p>
                  <p className="text-base text-text-primary font-medium">
                    {job.urgency === "asap"
                      ? "Ngayon Din (ASAP)"
                      : job.urgency === "this_week"
                        ? "Ngayong Linggo"
                        : "Kahit Kailan (Flexible)"}
                  </p>
                </div>
              </div>

              {job.budget_range && (
                <div className="flex gap-3 items-start">
                  <div className="mt-0.5 text-text-tertiary">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-tertiary mb-0.5 uppercase tracking-wider">Est. Budget</p>
                    <p className="text-base text-text-primary font-medium">{job.budget_range}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 items-start">
                 <div className="mt-0.5 text-text-tertiary">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                 </div>
                <div>
                  <p className="text-xs font-bold text-text-tertiary mb-0.5 uppercase tracking-wider">Petsa Naka-Post</p>
                  <p className="text-sm text-text-secondary font-medium">{new Date(job.created_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showContact && (
          <div className="mb-6 card-kumpuni border-kumpuni-blue/30 bg-gradient-to-br from-blue-50 to-white p-6 sm:p-8 space-y-4 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 text-kumpuni-blue/5 transform rotate-[-10deg] transition-transform group-hover:rotate-0">
               <svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>

            <h3 className="text-xl font-extrabold text-kumpuni-blue mb-2 relative z-10">Detalye ng May-ari</h3>
            <div className="space-y-4 relative z-10 w-full">
              <div className="bg-white p-4 rounded-xl border border-kumpuni-blue/10 shadow-sm">
                <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-1">Eksaktong Address</span>
                <span className="text-base text-text-primary font-medium">{(job.address && job.address.trim()) ? job.address : job.barangay}</span>
              </div>

              {homeownerPhone && (
                <div className="bg-white p-4 rounded-xl border border-kumpuni-blue/10 shadow-sm">
                  <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-1">Numero ng Telepono</span>
                  <a href={`tel:${homeownerPhone}`} className="text-lg text-kumpuni-blue font-bold hover:text-blue-700 flex items-center gap-3 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </div>
                    {homeownerPhone}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {isAssignedWorker && (job.status === "matched" || job.status === "in_progress") && (
          <div className="mb-6">
            <WorkerJobStatusActions jobId={jobId} currentStatus={job.status as "matched" | "in_progress"} />
          </div>
        )}

        {canCancelWorker && (
          <div className="mt-8 pt-6 border-t border-subtle flex flex-col items-center sm:items-start text-center sm:text-left">
            <h4 className="text-sm font-bold text-text-primary mb-2">Hindi mo ba kaya gawin?</h4>
            <p className="text-sm text-text-secondary mb-4 max-w-md">
              Kung may emergency o hindi mo na kaya puntahan ang trabaho, pwede mong i-cancel ito.
            </p>
            {cancelError && (
              <div className="w-full max-w-md p-3 bg-danger-light text-danger-red rounded-xl text-sm font-medium mb-4 border border-danger-red/20 text-left flex gap-2 items-start">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{cancelError}</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="btn-danger w-full sm:w-auto px-8 transition-colors"
            >
              {cancelling ? "Kinakansela..." : "I-cancel (Huwag Ituloy)"}
            </button>
          </div>
        )}

        {job.status === "open" && (
          <div className="mb-6">
            <WorkerJobDetail
              jobId={jobId}
              isFastMatch={isFastMatch}
              alreadyInterested={alreadyInterested}
              fastMatchExpiresAt={job.fast_match_expires_at}
            />
          </div>
        )}

        {job.status === "completed" && isAssignedWorker && (
          <div className="mb-6 space-y-4">
            <div className="card-kumpuni border-success-green/30 bg-success-light p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-success-green flex items-center justify-center text-white shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <p className="text-text-primary font-medium">Na-complete mo na ang job na ito.</p>
            </div>

            {employerReview && (
              <div className="card-kumpuni p-5 border-l-4 border-l-wood-brown/40">
                <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-wider mb-3">Review mula sa employer</h3>
                <div className="flex items-center gap-2 text-text-tertiary text-sm mb-2">
                  <span className="text-wood-brown font-semibold" aria-label={`${employerReview.rating} star rating`}>
                    {"★".repeat(employerReview.rating)}{"☆".repeat(5 - employerReview.rating)}
                  </span>
                  <span>{new Date(employerReview.created_at).toLocaleDateString("en-PH", { dateStyle: "medium" })}</span>
                </div>
                {employerReview.comment && (
                  <p className="text-text-primary leading-relaxed mb-3">{employerReview.comment}</p>
                )}
                {Array.isArray(employerReview.tags) && employerReview.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {employerReview.tags.map((t) => (
                      <span key={t} className="rounded px-2 py-0.5 text-xs bg-surface-light border border-subtle text-text-secondary">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {employerReview.response && (
                  <p className="text-text-primary text-sm pl-3 border-l-2 border-wood-brown/30 italic">Iyong response: {employerReview.response}</p>
                )}
                {!employerReview.response && (
                  <ReviewResponseForm reviewId={employerReview.id} initialResponse={null} />
                )}
              </div>
            )}

            <WorkerEarningsReport
              jobId={jobId}
              initialAmount={job.worker_reported_amount ?? null}
            />
          </div>
        )}

        {job.status === "cancelled" && (
          <div className="mb-6 card-kumpuni border-subtle bg-surface-light p-4 text-center">
            <p className="text-text-secondary font-medium">Na-cancel na ang job na ito.</p>
          </div>
        )}
      </div>
    </main>
  );
}
