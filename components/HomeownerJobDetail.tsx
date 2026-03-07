"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PageContainer } from "@/components/PageContainer";

const STATUS_LABELS: Record<string, string> = {
  open: "Bukas",
  matched: "Na-match",
  in_progress: "Ginagawa",
  completed: "Tapos na",
  cancelled: "Na-cancel",
};

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  carpentry: "Carpentry",
  painting: "Painting",
  masonry: "Masonry",
  general: "General Repair",
};

const URGENCY_LABELS: Record<string, string> = {
  asap: "Today / ASAP",
  this_week: "This Week",
  flexible: "Flexible / No Rush",
};

type JobRow = {
  id: string;
  homeowner_id: string;
  category: string;
  description: string;
  status: string;
  urgency: string;
  budget_range: string | null;
  barangay: string;
  matching_mode: string;
  created_at: string;
};

export default function HomeownerJobDetail({
  jobId,
  initialJob,
}: {
  jobId: string;
  initialJob: JobRow;
}) {
  const [job, setJob] = useState<JobRow>(initialJob);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`job:${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          const newRow = payload.new as JobRow;
          if (newRow?.status) setJob((prev) => ({ ...prev, ...newRow }));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  const handleCancel = async () => {
    if (job.status !== "open" && job.status !== "matched") return;
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

  const isOpen = job.status === "open";
  const isFlexible = job.matching_mode === "flexible";
  const isFast = job.matching_mode === "fast";
  const isCompleted = job.status === "completed";
  const isCancelled = job.status === "cancelled";
  const canCancel = (job.status === "open" || job.status === "matched") && !isCancelled;

  const statusSteps = ["open", "matched", "in_progress", "completed"] as const;
  const currentStepIndex = statusSteps.indexOf(job.status as (typeof statusSteps)[number]);
  const cancelledAfterIndex = isCancelled ? 1 : -1; // cancelled after "matched" or from "open"

  return (
    <main className="min-h-screen page-bg pt-6 pb-6">
      <PageContainer>
      <h1 className="font-display text-2xl lg:text-[28px] font-bold text-slate-text mb-6 tracking-tight" style={{ letterSpacing: "-0.3px" }}>
        Job detail
      </h1>

      {/* Status timeline */}
      <div className="card-kumpuni p-4 mb-4">
        <p className="text-caption font-medium text-muted-gray mb-2">Status</p>
        <div className="flex flex-wrap gap-2 items-center">
          {statusSteps.map((step, i) => {
            const done = isCancelled
              ? cancelledAfterIndex >= 0 && i <= cancelledAfterIndex
              : i <= currentStepIndex;
            return (
              <span
                key={step}
                className={`text-caption font-medium ${done ? "text-slate-text" : "text-muted-gray"}`}
              >
                {step === "open" && "Open"}
                {step === "matched" && "Matched"}
                {step === "in_progress" && "In Progress"}
                {step === "completed" && "Completed"}
                {i < statusSteps.length - 1 && " → "}
              </span>
            );
          })}
          {isCancelled && (
            <span className="text-caption font-medium text-danger-red ml-1">(Cancelled)</span>
          )}
        </div>
        <p className="text-body font-medium text-slate-text mt-2">
          {STATUS_LABELS[job.status] ?? job.status}
        </p>
      </div>

      <div className="card-kumpuni p-4 space-y-2 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded px-2 py-0.5 text-[11px] font-bold uppercase bg-blue-light text-kumpuni-blue">
            {STATUS_LABELS[job.status] ?? job.status}
          </span>
          <span className="text-caption text-muted-gray">
            {CATEGORY_LABELS[job.category] ?? job.category}
          </span>
        </div>
        <p className="text-body text-slate-text">{job.description}</p>
        <p className="text-caption text-muted-gray">Barangay: {job.barangay}</p>
        <p className="text-caption text-muted-gray">
          Urgency: {URGENCY_LABELS[job.urgency] ?? job.urgency}
        </p>
        {job.budget_range && (
          <p className="text-caption text-muted-gray">Budget: {job.budget_range}</p>
        )}
        <p className="text-xs text-muted-gray">
          Posted {new Date(job.created_at).toLocaleString("en-PH")}
        </p>
      </div>

      {isOpen && (
        <div className="space-y-3 mb-6">
          {isFlexible && (
            <div>
              <p className="text-caption text-muted-gray mb-2">
                View the list and map of workers, then contact a worker.
              </p>
              <Link
                href={`/jobs/${jobId}/browse`}
                className="btn-primary block w-full text-center"
              >
                TINGNAN ANG MGA WORKER
              </Link>
            </div>
          )}
          {isFast && (
            <div>
              <p className="text-caption text-muted-gray mb-2">
                Live list ng interested workers.
              </p>
              <Link
                href={`/jobs/${jobId}/fast`}
                className="btn-primary block w-full text-center"
              >
                View Fast Match
              </Link>
            </div>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="card-kumpuni p-4 mb-6 border-verified-green/30 bg-green-light/30">
          <p className="text-body text-slate-text mb-3">
            Job is complete. You can confirm and leave a review.
          </p>
          <Link
            href={`/jobs/${jobId}/review`}
            className="btn-primary flex w-full items-center justify-center"
          >
            I-confirm ang completion at mag-iwan ng review
          </Link>
        </div>
      )}

      {canCancel && (
        <div className="mb-6">
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
            {cancelling ? "Saving..." : "Cancel job"}
          </button>
        </div>
      )}

      <Link href="/dashboard" className="btn-ghost text-caption">
        ← Back to My Jobs
      </Link>
      </PageContainer>
    </main>
  );
}
