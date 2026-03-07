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
        setError(data.error || "Hindi masave. Subukan muli.");
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
      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
        <p className="text-green-800 font-medium">Na-complete mo na ang job na ito.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <p className="text-sm font-medium text-gray-700">Status</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {status === "matched" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => updateStatus("in_progress")}
            className="min-h-touch rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Sinusave..." : "On My Way"}
          </button>
        )}
        {status === "in_progress" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => updateStatus("completed")}
            className="min-h-touch rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Sinusave..." : "Mark as Completed"}
          </button>
        )}
      </div>
    </div>
  );
}
