"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Clock, MapPin, Wrench, Zap, CheckCircle2, User, Star, ArrowRight, ShieldCheck, FileCheck } from "lucide-react";
import { JobMap } from "@/components/JobMap";

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
  lat?: number;
  lng?: number;
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
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  // Realtime: job status/expiry
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

  const formatTimeLeft = (totalSeconds: number | null) => {
    if (totalSeconds === null) return "--:--";
    const d = Math.floor(Math.max(0, totalSeconds) / (3600 * 24));
    const h = Math.floor((Math.max(0, totalSeconds) % (3600 * 24)) / 3600);
    const m = Math.floor((Math.max(0, totalSeconds) % 3600) / 60);
    const s = Math.max(0, totalSeconds) % 60;

    const timeStr = [
      d > 0 || h > 0 ? String(h).padStart(2, "0") : null,
      String(m).padStart(2, "0"),
      String(s).padStart(2, "0"),
    ]
      .filter(Boolean)
      .join(":");

    if (d > 0) {
      return `${d}d ${timeStr}`;
    }
    return timeStr;
  };

  if (selectedResult) {
    return (
      <div className="card-kumpuni p-8 border-success-green/30 bg-gradient-to-b from-success-green/5 to-transparent text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-success-green/20 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-success-green" />
        </div>
        <h2 className="font-display font-bold text-text-primary text-2xl mb-2">It's a Match!</h2>
        <p className="text-[15px] font-body text-text-secondary mb-6 max-w-md mx-auto">
          You've successfully selected a worker. Here is your job's contact information.
        </p>

        <div className="w-full max-w-md bg-white border border-border-dim rounded-xl p-5 text-left space-y-4 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-kumpuni-blue mt-0.5" />
            <div>
              <p className="text-sm font-medium text-text-tertiary">Phone Number</p>
              <a href={`tel:${selectedResult.homeowner_phone}`} className="font-medium text-text-primary underline decoration-border-dim underline-offset-4 hover:decoration-kumpuni-blue">
                {selectedResult.homeowner_phone}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-kumpuni-blue mt-0.5" />
            <div>
              <p className="text-sm font-medium text-text-tertiary">Job Address</p>
              <p className="font-medium text-text-primary">{selectedResult.job_address}</p>
            </div>
          </div>
        </div>

        <Link
          href={`/jobs/${jobId}`}
          className="btn-primary w-full max-w-md justify-center py-3"
        >
          View Full Job Detail
        </Link>
      </div>
    );
  }

  if (isMatched) {
    return (
      <div className="card-kumpuni p-8 border-border-dim text-center flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mb-4">
          <FileCheck className="w-6 h-6 text-kumpuni-blue" />
        </div>
        <h2 className="font-display font-bold text-text-primary text-xl mb-2">Job is Matched</h2>
        <p className="text-[15px] font-body text-text-secondary mb-6">
          This job has already been matched with a worker.
        </p>
        <Link href={`/jobs/${jobId}`} className="btn-secondary w-full max-w-xs justify-center">
          View Job Detail
        </Link>
      </div>
    );
  }

  // Group real worker locations if we mapped them in the API or they exist
  // We don't have worker raw coordinates returned in this endpoint yet except via a Join if we wanted.
  // We can just show the job center for now.
  const jobCenter: [number, number] | null = (job?.lat && job?.lng) ? [job.lat, job.lng] : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {jobCenter && !isExpired && (
        <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
           <JobMap jobCenter={jobCenter} className="h-48 sm:h-64 rounded-2xl border border-subtle shadow-md" zoom={14} />
        </div>
      )}

      {!isExpired && (
        <div className="relative flex flex-col items-center justify-center p-8 overflow-hidden bg-white rounded-2xl border border-border-dim shadow-sm">
          {/* Radar rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-[150px] h-[150px] rounded-full border border-kumpuni-blue/20 animate-[ping_3s_ease-in-out_infinite]" />
            <div className="absolute w-[250px] h-[250px] rounded-full border border-kumpuni-blue/10 animate-[ping_3s_ease-in-out_infinite_1s]" />
            <div className="absolute w-[350px] h-[350px] rounded-full border border-kumpuni-blue/5 animate-[ping_3s_ease-in-out_infinite_2s]" />
          </div>

          <div className="relative z-10 bg-gradient-to-br from-kumpuni-blue to-blue-600 w-20 h-20 rounded-full flex items-center justify-center shadow-lg shadow-kumpuni-blue/30 mb-6">
            <Zap className="text-white w-10 h-10 animate-pulse fill-white/20" />
          </div>

          <div className="relative z-10 text-center space-y-2 max-w-sm">
            <h3 className="font-display text-2xl font-bold text-text-primary tracking-tight">
              {workers.length > 0 ? "Workers Found!" : "Scanning for Workers..."}
            </h3>
            <p className="text-text-secondary text-[15px] leading-relaxed">
              {workers.length > 0
                ? "Workers in your area are interested. Review and select the best fit below."
                : "Hold tight! We're sending notifications to skilled professionals near your location."}
            </p>
          </div>

          {expiresAt && (
            <div className="relative z-10 mt-8 mb-2 flex items-center gap-4 bg-surface-light px-5 py-3 rounded-full border border-border-dim">
              <div className="flex items-center gap-2 text-warning">
                <Clock className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-medium uppercase tracking-wider">Fast Match Ends In</span>
              </div>
              <span className="font-mono text-xl font-bold text-text-primary tracking-tighter text-center min-w-[4rem]">
                {formatTimeLeft(secondsLeft)}
              </span>
            </div>
          )}
        </div>
      )}

      {isExpired && (
        <div className="card-kumpuni p-6 border-warning/20 bg-warning-light/50 flex items-start gap-4">
          <Clock className="w-6 h-6 text-warning shrink-0 mt-1" />
          <div>
            <h3 className="font-display font-bold text-text-primary text-lg">Fast Match completed</h3>
            <p className="text-text-secondary text-[15px] mt-1">
              The priority time window has ended. The job is now on Flexible Match and and will remain visible on the job board. You can select a worker at any time.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-danger-red/10 border border-danger-red/20 p-4 flex items-center gap-3 text-danger-red">
          <ShieldCheck className="w-5 h-5" />
          <p className="text-[14px] font-medium">{error}</p>
        </div>
      )}

      {newInterestCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className="bg-success-green text-white px-5 py-3 rounded-full shadow-lg font-medium flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            New interest received!
          </div>
        </div>
      )}

      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border-dim">
          <h2 className="font-display font-bold text-lg text-text-primary flex items-center gap-2">
            Interested Workers
            <span className="bg-surface-hover text-text-secondary text-xs px-2 py-0.5 rounded-full font-medium">
              {workers.length}
            </span>
          </h2>
          <Link
            href={`/jobs/${jobId}`}
            className="text-sm font-medium text-action-orange hover:text-action-orange/80 flex items-center gap-1"
          >
            Job detail <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!workers.length ? (
          <div className="py-12 text-center">
            <Wrench className="w-12 h-12 text-border-dim mx-auto mb-4" />
            <p className="text-text-secondary text-[15px] mb-2 font-medium">No one has expressed interest yet.</p>
            <p className="text-text-tertiary text-sm max-w-md mx-auto">
              If no one responds before the timer ends, this job will automatically switch to Flexible Match so all workers can see it.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {workers.map((w) => (
              <li
                key={w.worker_id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-kumpuni p-4 hover:border-kumpuni-blue/40 transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-surface-hover rounded-full flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-text-secondary group-hover:text-kumpuni-blue transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-[17px] text-text-primary group-hover:text-kumpuni-blue transition-colors">
                      {w.display_name || "Verified Worker"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm font-body text-text-secondary">
                      <span className="flex items-center gap-1 text-action-orange font-medium">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {Number(w.avg_rating).toFixed(1)}
                      </span>
                      <span>•</span>
                      <span>{w.total_jobs} jobs done</span>
                      {w.distance_km != null && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {w.distance_km} km away
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-border-dim pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    {(w.rate_min != null || w.rate_max != null) ? (
                      <>
                        <p className="text-xs text-text-tertiary mb-0.5">Est. Rate</p>
                        <p className="font-medium text-text-primary">
                          ₱{w.rate_min ?? 0}
                          {w.rate_max && w.rate_max !== w.rate_min && ` - ₱${w.rate_max}`}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-text-tertiary">Rate TBD</span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={loading || isExpired}
                    onClick={() => handleSelect(w.worker_id)}
                    className="btn-primary py-2 px-6 shrink-0 shadow-sm hover:shadow active:scale-95 disabled:hover:scale-100 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Selecting..." : "Select Worker"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
