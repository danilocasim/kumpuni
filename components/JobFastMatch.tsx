"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type WorkerRow = {
  worker_id: string;
  display_name: string | null;
  avg_rating: number;
  rate_min: number | null;
  rate_max: number | null;
  total_jobs: number;
  distance_km: number | null;
};

type JobInfo = {
  id: string;
  fast_match_expires_at: string | null;
  status: string;
  matching_mode: string;
};

export default function JobFastMatch({
  jobId,
  initialJob,
  initialWorkers,
}: {
  jobId: string;
  initialJob: JobInfo | null;
  initialWorkers: WorkerRow[];
}) {
  const [job, setJob] = useState(initialJob);
  const [workers, setWorkers] = useState<WorkerRow[]>(initialWorkers);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<{
    homeowner_phone: string;
    job_address: string;
  } | null>(null);
  const [error, setError] = useState("");

  const fetchInterests = async () => {
    const res = await fetch(`/api/jobs/${jobId}/interests`);
    if (!res.ok) return;
    const data = await res.json();
    setJob(data.job);
    setWorkers(data.workers ?? []);
  };

  useEffect(() => {
    fetchInterests();
  }, [jobId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`job_interests:${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "job_interests",
          filter: `job_id=eq.${jobId}`,
        },
        () => fetchInterests()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  const handleSelect = async (workerId: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/select-worker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worker_id: workerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Hindi ma-select ang worker.");
        return;
      }
      setSelectedResult({
        homeowner_phone: data.homeowner_phone || "",
        job_address: data.job_address || "",
      });
      fetchInterests();
    } finally {
      setLoading(false);
    }
  };

  const expiresAt = job?.fast_match_expires_at
    ? new Date(job.fast_match_expires_at).getTime()
    : 0;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(null);
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const isExpired = secondsLeft !== null && secondsLeft <= 0;
  const isMatched = job?.status === "matched";

  if (selectedResult) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <h2 className="font-semibold text-green-800">Na-match na!</h2>
        <p className="mt-2 text-sm text-green-700">
          Contact ng homeowner:{" "}
          <a href={`tel:${selectedResult.homeowner_phone}`} className="underline">
            {selectedResult.homeowner_phone}
          </a>
        </p>
        <p className="mt-1 text-sm text-green-700">
          Address: {selectedResult.job_address}
        </p>
        <Link
          href={`/jobs/${jobId}`}
          className="mt-4 inline-block min-h-touch min-w-touch rounded-lg bg-green-600 px-4 font-medium text-white inline-flex items-center justify-center"
        >
          Tingnan ang job
        </Link>
      </div>
    );
  }

  if (isMatched) {
    return (
      <p className="text-gray-600">
        Na-match na ang job na ito.{" "}
        <Link href={`/jobs/${jobId}`} className="text-blue-600 underline">
          Tingnan ang job
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {expiresAt && (
        <div
          className={`rounded-lg border p-3 text-center ${
            isExpired ? "border-gray-300 bg-gray-50" : "border-amber-200 bg-amber-50"
          }`}
        >
          {isExpired ? (
            <p className="text-gray-600">
              Tapos na ang Fast Match window. Automatic na itong naka-Flexible Match.
            </p>
          ) : (
            <p className="text-amber-800">
              Countdown:{" "}
              <span className="font-mono font-bold">
                {Math.floor((secondsLeft ?? 0) / 60)}:
                {String((secondsLeft ?? 0) % 60).padStart(2, "0")}
              </span>
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>
      )}

      <h2 className="font-semibold">Mga worker na interested</h2>
      {!workers.length ? (
        <p className="text-gray-600">
          Wala pang nag-express ng interest. Maghintay lang — real-time ang listahan.
        </p>
      ) : (
        <ul className="space-y-3">
          {workers.map((w) => (
            <li
              key={w.worker_id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 p-3"
            >
              <div>
                <p className="font-medium">
                  {w.display_name || "Worker"}
                </p>
                <p className="text-sm text-gray-600">
                  Rating: {Number(w.avg_rating).toFixed(1)} · Jobs: {w.total_jobs}
                  {w.distance_km != null && ` · ${w.distance_km} km`}
                </p>
                {(w.rate_min != null || w.rate_max != null) && (
                  <p className="text-xs text-gray-500">
                    Rate: ₱{w.rate_min ?? "?"}–₱{w.rate_max ?? "?"}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={loading || isExpired}
                onClick={() => handleSelect(w.worker_id)}
                className="min-h-touch min-w-touch rounded-lg bg-blue-600 px-4 font-medium text-white disabled:opacity-50"
              >
                Piliin
              </button>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/jobs/${jobId}`}
        className="inline-block text-sm text-blue-600 underline"
      >
        Tingnan ang job detail
      </Link>
    </div>
  );
}
