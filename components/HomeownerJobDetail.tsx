"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PageContainer } from "@/components/PageContainer";

const STATUS_LABELS: Record<string, string> = {
  open: "Bukas",
  matched: "May Nahanap",
  in_progress: "Ginagawa",
  completed: "Tapos Na",
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
  asap: "Ngayon Din / ASAP",
  this_week: "Ngayong Linggo",
  flexible: "Kahit Kailan / Flexible",
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
  const [reopening, setReopening] = useState(false);
  const [reopenError, setReopenError] = useState("");
  const [hasReview, setHasReview] = useState(false);

  // Check if homeowner already left a review for this job
  useEffect(() => {
    if (job.status !== "completed") return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("reviews")
        .select("id")
        .eq("job_id", jobId)
        .eq("reviewer_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setHasReview(true);
        });
    });
  }, [job.status, jobId]);

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

  const handleReopen = async () => {
    if (job.status !== "cancelled") return;
    setReopenError("");
    setReopening(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "reopen" }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setReopenError(data.error || "Hindi ma-reopen. Subukan muli.");
        return;
      }
      setJob((prev) => ({ ...prev, status: "open" }));
    } finally {
      setReopening(false);
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
    <main className="min-h-screen page-bg py-6 sm:py-10">
      <PageContainer>
        {/* Header & Back Navigation */}
        <div className="mb-6 space-y-4">
          <Link href="/dashboard" className="btn-ghost inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors pr-4 py-2 -ml-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            <span className="font-medium">Bumalik sa Dashboard</span>
          </Link>
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight line-clamp-2">
              {job.description || "Detalye ng Trabaho"}
            </h1>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 text-kumpuni-blue text-sm font-semibold border border-blue-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                {CATEGORY_LABELS[job.category] ?? job.category}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-bold uppercase tracking-widest border
                ${job.status === 'open' ? 'bg-green-50 text-success-green border-green-100' :
                  job.status === 'matched' ? 'bg-kumpuni-blue/10 text-kumpuni-blue border-kumpuni-blue/20' :
                  job.status === 'completed' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                  'bg-orange-50 text-action-orange border-orange-100'}`}>
                <span className={`w-2 h-2 rounded-full ${
                  job.status === 'open' ? 'bg-success-green' :
                  job.status === 'matched' ? 'bg-kumpuni-blue' :
                  job.status === 'completed' ? 'bg-gray-400' : 'bg-action-orange'
                }`}></span>
                {STATUS_LABELS[job.status] ?? job.status}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Progress/Status Tracker */}
        <div className="card-kumpuni mb-6 p-5 sm:p-8 overflow-hidden">
          <p className="text-sm font-bold text-text-tertiary mb-8 uppercase tracking-widest">Status ng Request</p>

          <div className="relative flex items-start justify-between mx-auto px-0 mb-4 mt-2">
            {/* Connecting Line background */}
            <div className="absolute top-4 sm:top-5 left-[12.5%] right-[12.5%] h-[2px] bg-slate-200 z-0"></div>

            {/* Active Connecting Line */}
            <div className="absolute top-4 sm:top-5 left-[12.5%] h-[2px] bg-kumpuni-blue z-0 transition-all duration-500 ease-in-out" style={{ width: `${(Math.max(0, currentStepIndex) / (statusSteps.length - 1)) * 75}%` }}></div>

            {statusSteps.map((step, i) => {
              const done = isCancelled
                ? cancelledAfterIndex >= 0 && i <= cancelledAfterIndex
                : i <= currentStepIndex;
              const isCurrent = i === currentStepIndex && !isCancelled;

              return (
                <div key={step} className="flex flex-col items-center gap-3 relative z-10 px-0 sm:px-2 transition-all duration-300 w-1/4">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300
                    ${(done || isCurrent) ? "bg-white border-[2.5px] border-kumpuni-blue text-kumpuni-blue shadow-sm" :
                      "bg-white text-slate-300 border-[2px] border-slate-200"}`}
                  >
                    {(done && !isCurrent) ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-kumpuni-blue"><path d="M20 6 9 17l-5-5"/></svg>
                    ) : (
                      <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${isCurrent ? 'bg-kumpuni-blue' : 'bg-slate-200'}`}></span>
                    )}
                  </div>
                  <span className={`text-[11px] sm:text-sm font-bold text-center
                    ${isCurrent ? "text-kumpuni-blue" : "text-slate-500"}`}>
                    {STATUS_LABELS[step] ?? step}
                  </span>
                </div>
              );
            })}
          </div>

          {isOpen && isFlexible && (
            <div className="mt-4 p-4 sm:p-5 bg-blue-50/50 rounded-xl flex items-start gap-4 text-kumpuni-blue text-sm sm:text-base border border-blue-100/50">
              <div className="mt-0.5 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              <p className="leading-relaxed text-text-secondary">
                <strong className="text-kumpuni-blue">Kasalukuyang naghahanap.</strong> Ang iyong job post ay bukas pa. Maaari mo nang tingnan ang mga worker sa iyong lugar na pwede mong imbitahan para mas mapabilis ang pag-match.
              </p>
            </div>
          )}

          {isOpen && isFast && (
            <div className="mt-4 p-4 sm:p-5 bg-orange-50/50 rounded-xl flex items-start gap-4 text-action-orange text-sm sm:text-base border border-orange-100/50">
              <div className="mt-0.5 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <p className="leading-relaxed text-text-secondary">
                <strong className="text-action-orange">Naghahanap na ng Worker.</strong> Awtomatikong nag-no-notify ang system sa mga available na worker. Hintayin ang kanilang pag-accept.
              </p>
            </div>
          )}

          {isCancelled && (
            <div className="mt-4 p-4 sm:p-5 bg-danger-light rounded-xl flex items-start gap-4 text-danger-red text-sm sm:text-base border border-danger-red/20">
              <div className="mt-0.5 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </div>
              <p className="font-semibold text-danger-red">
                Ang request na ito ay na-cancel na.
              </p>
            </div>
          )}

          {isCancelled && (
            <div className="mt-4 card-kumpuni bg-gradient-to-br from-orange-50 to-white border border-action-orange/20 p-6 sm:p-8 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-action-orange/10 transform rotate-12 transition-transform group-hover:rotate-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div className="relative z-10 max-w-lg">
                <h3 className="font-extrabold text-action-orange text-xl sm:text-2xl mb-2">Gusto mo bang maghanap ulit?</h3>
                <p className="text-base text-text-secondary mb-6 leading-relaxed">
                  I-reopen ang job na ito para maghanap muli ng available na kumpunero gamit ang Fast Match.
                </p>
                {reopenError && (
                  <div className="mb-4 p-3 bg-danger-light text-danger-red rounded-xl text-sm font-medium border border-danger-red/20 flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>{reopenError}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleReopen}
                  disabled={reopening}
                  className="btn-primary w-full sm:w-auto !bg-action-orange !border-action-orange hover:!bg-orange-600 inline-flex justify-center gap-2 items-center disabled:opacity-50"
                >
                  {reopening ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      <span>Ino-open muli...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                      <span>Fast Match Ulit</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Job Information Card */}
        <div className="card-kumpuni p-0 mb-6 overflow-hidden">
          <div className="p-5 sm:p-6 bg-surface-light border-b border-subtle flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 text-kumpuni-blue border border-subtle">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-tertiary mb-1 uppercase tracking-widest">Serbisyo</h2>
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
                  <p className="text-base text-text-primary font-medium">{URGENCY_LABELS[job.urgency] ?? job.urgency}</p>
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
                  <p className="text-sm text-text-secondary font-medium">{new Date(job.created_at).toLocaleString("en-PH", { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        {isOpen && (
          <div className="space-y-4 mb-8">
            {isFlexible && (
              <div className="card-kumpuni bg-gradient-to-br from-blue-50 to-white border border-kumpuni-blue/20 p-6 sm:p-8 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 text-kumpuni-blue/10 transform rotate-12 transition-transform group-hover:rotate-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div className="relative z-10 max-w-lg">
                  <h3 className="font-extrabold text-kumpuni-blue text-xl sm:text-2xl mb-2">Pumili ng Kumpunero</h3>
                  <p className="text-base text-text-secondary mb-6 leading-relaxed">
                    Tingnan ang mapa at listahan ng mga available na kumpunero sa iyong lugar. Pumili at i-message sila nang direkta.
                  </p>
                  <Link
                    href={`/jobs/${jobId}/browse`}
                    className="btn-primary w-full sm:w-auto inline-flex justify-center gap-2 items-center"
                  >
                    <span>Tingnan ang mga Kumpunero</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </Link>
                </div>
              </div>
            )}

            {isFast && (
              <div className="card-kumpuni bg-gradient-to-br from-orange-50 to-white border border-action-orange/20 p-6 sm:p-8 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 text-action-orange/10 transform rotate-12 transition-transform group-hover:rotate-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <div className="relative z-10 max-w-lg">
                  <h3 className="font-extrabold text-action-orange text-xl sm:text-2xl mb-2">Fast Match Pinas!</h3>
                  <p className="text-base text-text-secondary mb-6 leading-relaxed">
                    Kasalukuyang naghahanap ang system ng mga available na kumpunero at inaabisuhan sila. Hintayin silang mag-apply.
                  </p>
                  <Link
                    href={`/jobs/${jobId}/fast`}
                    className="btn-primary w-full sm:w-auto !bg-action-orange !border-action-orange hover:!bg-orange-600 inline-flex justify-center gap-2 items-center"
                  >
                    <span>Tingnan ang Match Results</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {isCompleted && (
          <div className="card-kumpuni border-success-green border bg-green-50/50 mb-8 p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-success-green/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
            </div>
            <div className="relative z-10 max-w-lg flex flex-col sm:flex-row items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-success-green flex items-center justify-center text-white shrink-0 mt-1 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <div>
                <h3 className="font-extrabold text-success-green text-xl sm:text-2xl mb-2">Tapos Na Ang Trabaho!</h3>
                {hasReview ? (
                  <p className="text-base text-text-secondary leading-relaxed">
                    Salamat sa pag-iwan ng review! Nakakatulong ito sa ibang homeowners na pumili ng tamang kumpunero.
                  </p>
                ) : (
                  <>
                    <p className="text-base text-text-secondary mb-6 leading-relaxed">
                      Maraming salamat sa paggamit ng Kumpuni. Tulungan ang iba sa pamamagitan ng pagbibigay ng review sa kumpunero.
                    </p>
                    <Link
                      href={`/jobs/${jobId}/review`}
                      className="btn-primary w-full sm:w-auto !bg-success-green !border-success-green hover:!bg-green-700 bg-opacity-100 shadow-sm inline-flex justify-center items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      <span>Mag-iwan ng Review</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Section */}
        {canCancel && (
          <div className="mt-10 pt-6 border-t border-subtle flex flex-col items-center sm:items-start text-center sm:text-left">
            <h4 className="text-sm font-bold text-text-primary mb-2">Nagbago ba ang isip mo?</h4>
            <p className="text-sm text-text-secondary mb-4 max-w-md">
              Kung hindi mo na kailangan ng kumpunero, maaari mong i-cancel ang trabahong ito. Hindi na ito makikita ng mga kumpunero.
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
              {cancelling ? "Kinakansela..." : "I-cancel ang Trabaho"}
            </button>
          </div>
        )}
      </PageContainer>
    </main>
  );
}
