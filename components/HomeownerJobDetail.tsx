"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  CalendarClock,
  Banknote,
  Clock,
  Wrench,
  Search,
  X,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  carpentry: "Carpentry",
  painting: "Painting",
  masonry: "Masonry",
  general: "General Repair",
};

const URGENCY_LABELS: Record<string, string> = {
  asap: "Ngayong Araw (ASAP)",
  this_week: "Sa Loob ng Linggo",
  flexible: "Flexible / Walang Nagmamadali",
};

const STEPPER_LABELS = ["Bukas", "May Nahanap", "Ginagawa", "Tapos Na"];

const STATUS_BADGE: Record<
  string,
  { label: string; className: string; pulse?: boolean }
> = {
  open: {
    label: "BUKAS",
    className:
      "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-100",
    pulse: true,
  },
  matched: {
    label: "MAY NAHANAP",
    className:
      "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100",
  },
  in_progress: {
    label: "GINAGAWA",
    className:
      "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100",
  },
  completed: {
    label: "TAPOS NA",
    className:
      "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200",
  },
  cancelled: {
    label: "NA-CANCEL",
    className:
      "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-100",
  },
};

function formatPostedDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-PH", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

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

function Stepper({
  currentStep,
  isCancelled,
}: {
  currentStep: number;
  isCancelled: boolean;
}) {
  const steps = STEPPER_LABELS;
  const effectiveStep = isCancelled ? Math.max(0, currentStep) : currentStep;

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-orange-500 rounded-full z-0 transition-all duration-500"
          style={{
            width: isCancelled
              ? "0%"
              : `${(effectiveStep / (steps.length - 1)) * 100}%`,
          }}
        />
        {steps.map((step, index) => {
          const isActive = isCancelled ? false : index <= effectiveStep;
          const isCurrent = index === effectiveStep && !isCancelled;
          return (
            <div
              key={step}
              className="relative z-10 flex flex-col items-center group"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 bg-white
                  ${isActive ? "border-orange-500" : "border-gray-300"}
                  ${isCurrent ? "ring-4 ring-orange-100" : ""}
                `}
              >
                {isActive ? (
                  <Check
                    className="w-4 h-4 text-orange-500"
                    strokeWidth={3}
                  />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                )}
              </div>
              <span
                className={`mt-3 text-xs md:text-sm font-medium absolute top-10 w-24 text-center
                  ${isActive ? "text-slate-800" : "text-gray-400"}
                `}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusMessage({
  status,
  matchingMode,
}: {
  status: string;
  matchingMode: string;
}) {
  if (status === "cancelled") {
    return (
      <div className="mt-10 p-4 bg-red-50 rounded-lg border border-red-100 flex items-start gap-3">
        <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-red-800">
          <strong className="font-semibold">Na-cancel.</strong> Ang job na ito
          ay hindi na aktibo.
        </p>
      </div>
    );
  }
  if (status === "completed") {
    return (
      <div className="mt-10 p-4 bg-green-50 rounded-lg border border-green-100 flex items-start gap-3">
        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
        <p className="text-sm text-green-800">
          <strong className="font-semibold">Tapos na!</strong> Pwede mo nang
          i-confirm at mag-iwan ng review.
        </p>
      </div>
    );
  }
  if (status === "in_progress") {
    return (
      <div className="mt-10 p-4 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-3">
        <Wrench className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong className="font-semibold">Ginagawa na.</strong> Ang worker ay
          nagtatrabaho na sa job na ito.
        </p>
      </div>
    );
  }
  if (status === "matched") {
    return (
      <div className="mt-10 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
        <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          <strong className="font-semibold">May napili ka nang worker.</strong>{" "}
          Maghintay hanggang magsimula o matapos ang trabaho.
        </p>
      </div>
    );
  }
  // open
  return (
    <div className="mt-10 p-4 bg-orange-50 rounded-lg border border-orange-100 flex items-start gap-3">
      <Search className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
      <p className="text-sm text-orange-800">
        <strong className="font-semibold">Naghahanap na kami!</strong> Ang iyong
        job post ay bukas pa. Maaari mo nang tingnan ang mga worker sa iyong
        lugar na pwede mong imbitahan.
      </p>
    </div>
  );
}

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

  const statusSteps = ["open", "matched", "in_progress", "completed"] as const;
  const currentStepIndex = statusSteps.includes(job.status as (typeof statusSteps)[number])
    ? statusSteps.indexOf(job.status as (typeof statusSteps)[number])
    : 0;
  const isOpen = job.status === "open";
  const isCompleted = job.status === "completed";
  const isCancelled = job.status === "cancelled";
  const canCancel =
    (job.status === "open" || job.status === "matched") && !isCancelled;
  const isFast = job.matching_mode === "fast";
  const isFlexible = job.matching_mode === "flexible";
  const workersHref = isFast ? `/jobs/${jobId}/fast` : `/jobs/${jobId}/browse`;
  const badge = STATUS_BADGE[job.status] ?? STATUS_BADGE.open;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 pb-20">
      <main className="max-w-3xl mx-auto px-4 pt-8">
        <Link
          href="/dashboard"
          className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-6 text-sm font-medium group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Bumalik sa My Jobs
        </Link>

        <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {job.description?.trim()
                ? job.description.slice(0, 80) + (job.description.length > 80 ? "…" : "")
                : "Job detail"}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                <Wrench className="w-3.5 h-3.5 mr-1.5" />
                {CATEGORY_LABELS[job.category] ?? job.category}
              </span>
              <span className={badge.className}>
                {badge.pulse && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                )}
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Status ng Request
          </h2>
          <Stepper
            currentStep={currentStepIndex}
            isCancelled={isCancelled}
          />
          <StatusMessage status={job.status} matchingMode={job.matching_mode} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              Mga Detalye ng Trabaho
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base">
              {job.description || "—"}
            </p>
          </div>
          <div className="bg-gray-50/50 p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <MapPin className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Lokasyon
                </p>
                <p className="text-slate-800 font-semibold mt-0.5">
                  {job.barangay || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <Clock className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Kailan Kailangan
                </p>
                <p className="text-slate-800 font-semibold mt-0.5">
                  {URGENCY_LABELS[job.urgency] ?? job.urgency}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <Banknote className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Budget
                </p>
                <p className="text-slate-800 font-semibold mt-0.5">
                  {job.budget_range || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <CalendarClock className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Petsa Na-post
                </p>
                <p className="text-slate-800 font-semibold mt-0.5">
                  {formatPostedDate(job.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {isCompleted && (
            <Link
              href={`/jobs/${jobId}/review`}
              className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all active:scale-[0.98]"
            >
              <Check className="w-5 h-5 mr-2" />
              I-confirm at mag-iwan ng review
            </Link>
          )}

          {isOpen && (
            <>
              <div className="text-center md:text-left mb-2">
                <p className="text-sm text-slate-600">
                  Tingnan ang mapa at listahan ng mga worker, pagkatapos ay
                  kontakin ang napili mo.
                </p>
              </div>
              <Link
                href={workersHref}
                className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-[#D97736] hover:bg-[#C2672B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all active:scale-[0.98]"
              >
                <Search className="w-5 h-5 mr-2" />
                Tingnan ang mga Worker
              </Link>
            </>
          )}

          {canCancel && (
            <>
              {cancelError && (
                <p className="text-sm text-red-600" role="alert">
                  {cancelError}
                </p>
              )}
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full flex justify-center items-center py-4 px-6 border-2 border-red-200 rounded-xl shadow-sm text-base font-bold text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <X className="w-5 h-5 mr-2" />
                {cancelling ? "Kinansela..." : "I-cancel ang Job"}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
