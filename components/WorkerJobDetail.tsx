"use client";

import { useState } from "react";

export default function WorkerJobDetail({
  jobId,
  isFastMatch,
  alreadyInterested,
  fastMatchExpiresAt,
}: {
  jobId: string;
  isFastMatch: boolean;
  alreadyInterested: boolean;
  fastMatchExpiresAt: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(alreadyInterested);
  const [error, setError] = useState("");

  const handleInterest = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/interest`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Hindi ma-save. Subukan muli.");
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  const expired =
    fastMatchExpiresAt && new Date(fastMatchExpiresAt) < new Date();

  if (!isFastMatch) {
    return (
      <p className="mt-4 text-gray-600">
        Flexible Match job ito — makikita mo ito sa browse list ng homeowner.
      </p>
    );
  }

  if (expired) {
    return (
      <p className="mt-4 text-amber-700">
        Tapos na ang Fast Match window para sa job na ito.
      </p>
    );
  }

  if (done) {
    return (
      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
        <p className="text-green-800 font-medium">Na-express mo na ang interest mo.</p>
        <p className="text-sm text-green-700 mt-1">
          Maghintay kung pipiliin ka ng homeowner.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-gray-600 mb-2">
        Express interest para makita ka sa listahan ng homeowner.
      </p>
      {error && (
        <p className="mb-2 text-sm text-red-600">{error}</p>
      )}
      <button
        type="button"
        disabled={loading}
        onClick={handleInterest}
        className="min-h-touch min-w-touch rounded-lg bg-blue-600 px-4 font-medium text-white disabled:opacity-50"
      >
        {loading ? "Sinusubmit..." : "I'm Interested"}
      </button>
    </div>
  );
}
