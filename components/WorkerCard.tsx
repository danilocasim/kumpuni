"use client";

import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";

const SKILL_LABELS: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  carpentry: "Carpentry",
  painting: "Painting",
  masonry: "Masonry",
  general: "General",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  available_now: "Available Now",
  this_week: "This Week",
  weekends: "Weekends",
  open_anytime: "Open Anytime",
  not_available: "Not Available",
};

function availabilityBorderClass(availability: string): string {
  switch (availability) {
    case "available_now":
    case "open_anytime":
      return "card-accent-available";
    case "this_week":
    case "weekends":
      return "border-l-[4px] border-l-kumpuni-blue";
    default:
      return "card-accent-not-available";
  }
}

function availabilityBadgeClass(availability: string): string {
  switch (availability) {
    case "available_now":
    case "open_anytime":
      return "badge-status badge-available";
    case "this_week":
    case "weekends":
      return "badge-status badge-this-week";
    default:
      return "badge-status badge-not-available";
  }
}

export type WorkerCardData = {
  worker_id: string;
  display_name: string | null;
  avatar_url: string | null;
  skills: string[];
  avg_rating: number;
  total_jobs: number;
  review_count: number;
  rate_min: number | null;
  rate_max: number | null;
  availability: string;
  is_verified: boolean;
  distance_km?: number | null;
};

export function WorkerCard({
  worker,
  href,
  onClick,
  showDistance = false,
}: {
  worker: WorkerCardData;
  href?: string;
  onClick?: (workerId: string) => void;
  showDistance?: boolean;
}) {
  const skills = worker.skills.slice(0, 3).map((s) => SKILL_LABELS[s] || s);
  const rateStr =
    worker.rate_min != null && worker.rate_max != null
      ? `₱${worker.rate_min}–₱${worker.rate_max}/araw`
      : worker.rate_min != null
        ? `₱${worker.rate_min}/araw`
        : "—";

  const cardClass = `card-kumpuni flex w-full items-start gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${availabilityBorderClass(worker.availability)}`;

  const content = (
    <>
      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-surface-light shadow-sm bg-kumpuni-blue/5">
        {worker.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={worker.avatar_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-xl font-black text-kumpuni-blue/40">
            {(worker.display_name || "W")[0]?.toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 py-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base font-extrabold text-text-primary truncate">
            {worker.display_name || "Worker"}
          </span>
          {worker.is_verified && (
            <ShieldCheck
              className="h-4 w-4 flex-shrink-0 text-success-green"
              strokeWidth={2}
              aria-hidden
            />
          )}
        </div>
        {skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span
                key={s}
                className="rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase text-text-secondary bg-surface-light border border-subtle"
              >
                {s}
              </span>
            ))}
          </div>
        )}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 text-sm text-text-primary bg-white/50 w-fit rounded-lg">
          <span className="text-action-orange font-bold flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-md border border-warning-light shadow-sm">
            ★ {Number(worker.avg_rating).toFixed(1)}
          </span>
          <span className="text-text-tertiary text-xs font-semibold">
            ({worker.review_count} reviews)
          </span>
          <span className="text-text-tertiary">·</span>
          <span className="text-text-secondary font-semibold bg-surface-light px-2 py-0.5 rounded-md border border-subtle shadow-sm">{rateStr}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {showDistance && worker.distance_km != null && (
            <>
              <span className="text-text-tertiary text-sm font-semibold bg-surface-light px-2 py-0.5 rounded-md">
                {worker.distance_km.toFixed(1)} km
              </span>
            </>
          )}
          <span className={`${availabilityBadgeClass(worker.availability)} shadow-sm`}>
            <span className="badge-dot" />
            {AVAILABILITY_LABELS[worker.availability] ?? worker.availability}
          </span>
        </div>
      </div>
      <div className="h-full flex flex-col justify-center mt-6">
         <div className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center text-text-tertiary group-hover:bg-kumpuni-blue group-hover:text-white transition-colors">
            <ChevronRight
              className="h-4 w-4 flex-shrink-0"
              strokeWidth={3}
              aria-hidden
            />
         </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => onClick(worker.worker_id)}
        className={`${cardClass} text-left group`}
      >
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} className={`${cardClass} group`}>
        {content}
      </Link>
    );
  }

  return <div className={cardClass}>{content}</div>;
}
