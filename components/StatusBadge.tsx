"use client";

const VARIANT_MAP: Record<string, string> = {
  open: "badge-this-week",
  bukas: "badge-this-week",
  completed: "badge-completed",
  "tapos na": "badge-completed",
  in_progress: "badge-in-progress",
  ginagawa: "badge-in-progress",
  matched: "badge-matched",
  "na-match": "badge-matched",
  cancelled: "badge-cancelled",
  "na-cancel": "badge-cancelled",
  asap: "badge-asap",
  this_week: "badge-this-week",
  available_now: "badge-available",
  open_anytime: "badge-available",
  not_available: "badge-not-available",
  flexible: "badge-flexible",
  weekends: "badge-this-week",
};

export function StatusBadge({
  label,
  variant,
  pulse = false,
}: {
  label: string;
  variant: string;
  pulse?: boolean;
}) {
  const key = variant.toLowerCase().replace(/\s/g, "_");
  const badgeClass = VARIANT_MAP[key] ?? "badge-flexible";

  return (
    <span className={`badge-status ${badgeClass} uppercase`}>
      <span className={`badge-dot ${pulse ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
}
