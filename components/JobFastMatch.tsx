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
  const [newInterestCount, setNewInterestCount] = useState(0);

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

  // Realtime (WebSocket): new workers expressing interest — list updates live
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
        () => {
          setNewInterestCount((c) => c + 1);
          fetchInterests();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Optional: connection confirmed for debugging
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  // Realtime: job status/expiry (e.g. homeowner selected worker, or cron expired fast match)
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
          const newRow = payload.new as Partial<JobInfo>;
          if (newRow && (newRow.status != null || newRow.fast_match_expires_at != null || newRow.matching_mode != null))
            setJob((prev) => (prev ? { ...prev, ...newRow } : null));
        }
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
        setError(data.error || "Could not select worker.");
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

  // Clear "new interest" highlight after showing updated list
  useEffect(() => {
    if (newInterestCount === 0) return;
    const t = setTimeout(() => setNewInterestCount(0), 4000);
    return () => clearTimeout(t);
  }, [newInterestCount, workers.length]);

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
      <div className="card-kumpuni p-5 border-success-green/20 bg-success-green/5">
        <h2 className="font-display font-bold text-success-green text-lg">Na-match na!</h2>
        <p className="mt-2 text-[15px] font-body text-success-green/80">
          Contact ng homeowner:{" "}
          <a href={`tel:${selectedResult.homeowner_phone}`} className="underline">
            {selectedResult.homeowner_phone}
          </a>
        </p>
        <p className="mt-1 text-[15px] font-body text-success-green/80">
          Address: {selectedResult.job_address}
        </p>
        <Link
          href={`/jobs/${jobId}`}
          className="mt-4 btn-primary mt-6 w-full sm:w-auto inline-flex items-center justify-center"
        >
          View job
        </Link>
      </div>
    );
  }

  if (isMatched) {
    return (
      <p className="text-text-secondary text-[15px] font-body">
        Na-match na ang job na ito.{" "}
        <Link href={`/jobs/${jobId}`} className="font-medium text-action-orange hover:text-action-orange/80 underline-offset-4">
          View job
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {expiresAt && (
        <div
          className={`rounded-lg border p-3 text-center ${
            isExpired ? "border-dim bg-surface-light" : "border-warning/30 bg-warning-light"
          }`}
        >
          {isExpired ? (
            <p className="text-text-secondary text-[15px] font-body">
              Tapos na ang Fast Match window. Automatic na itong naka-Flexible Match.
            </p>
          ) : (
            <p className="text-warning font-medium">
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
        <p className="rounded bg-danger-red/10 border border-danger-red/20 text-danger-red p-3 rounded-kumpuni-sm text-[14px]">{error}</p>
      )}

      {newInterestCount > 0 && (
        <p className="card-kumpuni border-success-green/30 bg-success-green/10 px-4 py-3 text-[14px] font-medium text-success-green animate-in">
          New interest — list updated in real time
        </p>
      )}

      <h2 className="font-display font-bold text-lg text-text-primary">Interested Workers</h2>
      {!workers.length ? (
        <p className="text-text-secondary text-[15px] font-body">
          {isExpired
            ? "No workers in radius have expressed interest. The job is now on Flexible Match — you can view the list on the job detail page."
            : "No one has expressed interest yet. The list updates in real time. If no one is interested within 15 min, the job automatically switches to Flexible Match."}
        </p>
      ) : (
        <ul className="space-y-3">
          {workers.map((w) => (
            <li
              key={w.worker_id}
              className="flex flex-wrap items-center justify-between gap-2 card-kumpuni p-4 hover:border-kumpuni-blue/30 transition-colors"
            >
              <div>
                <p className="font-display font-medium text-[16px] text-text-primary">
                  {w.display_name || "Worker"}
                </p>
                <p className="text-sm text-text-secondary text-[15px] font-body">
                  Rating: {Number(w.avg_rating).toFixed(1)} · Jobs: {w.total_jobs}
                  {w.distance_km != null && ` · ${w.distance_km} km`}
                </p>
                {(w.rate_min != null || w.rate_max != null) && (
                  <p className="text-xs text-text-tertiary">
                    Rate: ₱{w.rate_min ?? "?"}–₱{w.rate_max ?? "?"}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={loading || isExpired}
                onClick={() => handleSelect(w.worker_id)}
                className="btn-primary whitespace-nowrap disabled:opacity-50"
              >
                Select
              </button>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/jobs/${jobId}`}
        className="inline-block text-sm font-medium text-action-orange hover:text-action-orange/80 underline-offset-4"
      >
        View job detail
      </Link>
    </div>
  );
}
