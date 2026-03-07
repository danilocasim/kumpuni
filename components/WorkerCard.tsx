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
      return "border-l-[3px] border-l-verified-green";
    case "this_week":
    case "weekends":
      return "border-l-[3px] border-l-kumpuni-blue";
    default:
      return "border-l-[3px] border-l-muted-gray";
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

  const cardClass = `card-kumpuni flex w-full items-start gap-3 transition-shadow ${availabilityBorderClass(worker.availability)}`;

  const content = (
    <>
      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-kumpuni-blue bg-concrete-white">
        {worker.avatar_url ? (
          <img
            src={worker.avatar_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="font-heading text-lg font-bold text-muted-gray">
            {(worker.display_name || "W")[0]}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-heading text-[15px] font-bold text-slate-text truncate">
            {worker.display_name || "Worker"}
          </span>
          {worker.is_verified && (
            <ShieldCheck
              className="h-4 w-4 flex-shrink-0 text-verified-green"
              strokeWidth={2}
              aria-hidden
            />
          )}
        </div>
        {skills.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {skills.map((s) => (
              <span
                key={s}
                className="rounded px-1.5 py-0.5 text-xs font-medium text-kumpuni-blue bg-blue-light"
              >
                {s}
              </span>
            ))}
          </div>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-slate-text">
          <span className="text-wood-brown">
            ★ {Number(worker.avg_rating).toFixed(1)}
          </span>
          <span className="font-mono text-muted-gray">
            ({worker.review_count})
          </span>
          <span className="text-muted-gray">·</span>
          <span className="font-mono text-slate-text">{rateStr}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[13px]">
          {showDistance && worker.distance_km != null && (
            <>
              <span className="text-muted-gray">
                {worker.distance_km.toFixed(1)} km
              </span>
              <span className="text-muted-gray">·</span>
            </>
          )}
          <span className={availabilityBadgeClass(worker.availability)}>
            <span className="badge-dot" />
            {AVAILABILITY_LABELS[worker.availability] ?? worker.availability}
          </span>
        </div>
      </div>
      <ChevronRight
        className="h-5 w-5 flex-shrink-0 text-muted-gray"
        strokeWidth={2}
        aria-hidden
      />
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => onClick(worker.worker_id)}
        className={`${cardClass} text-left`}
      >
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {content}
      </Link>
    );
  }

  return <div className={cardClass}>{content}</div>;
}
