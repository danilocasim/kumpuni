"use client";

import { useState } from "react";

type JobStatus = "matched" | "in_progress" | "completed";

export default function WorkerJobStatusActions({
  jobId,
  currentStatus,
}: {
  jobId: string;
  currentStatus: "matched" | "in_progress";
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<JobStatus>(currentStatus);
  const [error, setError] = useState("");

  async function updateStatus(newStatus: "in_progress" | "completed") {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save. Try again.");
        return;
      }
      setStatus(newStatus);
      if (typeof window !== "undefined") window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  if (status === "completed") {
    return (
      <div className="card-kumpuni border border-success-green/30 bg-green-50 p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-success-green flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-success-green">Trabaho Kumpleto!</h3>
          <p className="text-sm text-text-secondary mt-1">Maraming salamat! Na-mark mo na bilang tapos ang trabahong ito.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-kumpuni p-6 sm:p-8 space-y-5 bg-gradient-to-b from-white to-surface-light border-kumpuni-blue/20">
      <div className="flex flex-col mb-4">
        <h3 className="text-xl font-extrabold text-text-primary">I-update ang Job Status</h3>
        <p className="text-sm text-text-secondary mt-1">
          I-click ang button para i-update ang homeowner sa iyong progress.
        </p>
      </div>

      {error && (
        <div className="text-sm font-medium text-danger-red bg-danger-light p-3 rounded-xl border border-danger-red/20 flex gap-2 items-start">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {status === "matched" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => updateStatus("in_progress")}
            className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            {loading ? "Sinisend..." : "Papunta Na / Uumpisahan Na"}
          </button>
        )}

        {status === "in_progress" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => updateStatus("completed")}
            className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-2 !bg-success-green !border-success-green hover:!bg-green-700 active:scale-[0.98] transition-all shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
            {loading ? "Sinisend..." : "Tapos Na Ang Trabaho"}
          </button>
        )}
      </div>
    </div>
  );
}
