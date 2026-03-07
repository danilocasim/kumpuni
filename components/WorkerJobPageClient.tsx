"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import WorkerJobDetail from "@/components/WorkerJobDetail";
import WorkerJobStatusActions from "@/components/WorkerJobStatusActions";
import WorkerEarningsReport from "@/components/WorkerEarningsReport";

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

export default function WorkerJobPageClient({
  jobId,
  currentUserId,
  initialJob,
  homeownerPhone,
  alreadyInterested,
}: {
  jobId: string;
  currentUserId: string;
  initialJob: JobSnapshot;
  homeownerPhone: string | null;
  alreadyInterested: boolean;
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
        setCancelError(data.error || "Hindi ma-cancel. Subukan muli.");
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
    <main className="min-h-screen p-4 pb-24 max-w-lg mx-auto page-bg">
      <h1 className="font-heading text-headline-mobile font-bold text-slate-text mb-4">
        Job detail
      </h1>
      <div className="card-kumpuni p-4 space-y-2">
        <p className="font-medium text-slate-text">{CATEGORY_LABELS[job.category] ?? job.category}</p>
        <p className="text-body text-slate-text">{job.description}</p>
        <p className="text-caption text-muted-gray">Barangay: {job.barangay}</p>
        <p className="text-caption text-muted-gray">
          Urgency:{" "}
          {job.urgency === "asap"
            ? "ASAP"
            : job.urgency === "this_week"
              ? "This Week"
              : "Flexible"}
        </p>
        {job.budget_range && (
          <p className="text-caption text-muted-gray">Budget: {job.budget_range}</p>
        )}
        <p className="text-xs text-muted-gray">
          Posted: {new Date(job.created_at).toLocaleString("en-PH")}
        </p>
      </div>

      {showContact && (
        <div className="mt-4 card-kumpuni border-kumpuni-blue/20 bg-blue-light/50 p-4 space-y-2">
          <p className="text-sm font-medium text-slate-text">Contact / Address</p>
          <p className="text-body text-slate-text">
            Address: {(job.address && job.address.trim()) ? job.address : job.barangay}
          </p>
          {homeownerPhone && (
            <p className="text-body text-slate-text">
              May-ari:{" "}
              <a href={`tel:${homeownerPhone}`} className="btn-ghost">
                {homeownerPhone}
              </a>
            </p>
          )}
        </div>
      )}

      {isAssignedWorker && (job.status === "matched" || job.status === "in_progress") && (
        <WorkerJobStatusActions jobId={jobId} currentStatus={job.status as "matched" | "in_progress"} />
      )}

      {canCancelWorker && (
        <div className="mt-4">
          {cancelError && (
            <p className="text-caption text-danger-red mb-2" role="alert">
              {cancelError}
            </p>
          )}
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full min-h-[48px] rounded-kumpuni-sm border-2 border-danger-red text-danger-red font-heading font-bold text-base bg-white hover:bg-red-50 disabled:opacity-50"
          >
            {cancelling ? "Sinusave..." : "I-cancel (huwag na tumuloy)"}
          </button>
        </div>
      )}

      {job.status === "open" && (
        <WorkerJobDetail
          jobId={jobId}
          isFastMatch={isFastMatch}
          alreadyInterested={alreadyInterested}
          fastMatchExpiresAt={job.fast_match_expires_at}
        />
      )}

      {job.status === "completed" && isAssignedWorker && (
        <>
          <div className="mt-4 card-kumpuni border-verified-green/30 bg-green-light/30 p-4">
            <p className="text-body text-slate-text mb-3">Na-complete mo na ang job na ito.</p>
            <Link
              href={`/jobs/${jobId}/review`}
              className="btn-primary inline-flex w-full justify-center"
            >
              Mag-iwan ng review
            </Link>
          </div>
          <WorkerEarningsReport
            jobId={jobId}
            initialAmount={job.worker_reported_amount ?? null}
          />
        </>
      )}

      {job.status === "cancelled" && (
        <div className="mt-4 card-kumpuni border-muted-gray bg-gray-100 p-3">
          <p className="text-body text-muted-gray">Na-cancel na ang job na ito.</p>
        </div>
      )}

      <div className="mt-6">
        <Link href="/worker/jobs" className="btn-ghost text-caption">
          Balik sa job list
        </Link>
      </div>
    </main>
  );
}
