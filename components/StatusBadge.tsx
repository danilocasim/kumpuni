"use client";

/**
 * Reusable status badge with dot + text. Rounded-[4px], 11px uppercase, DM Sans 700.
 */
const VARIANT_STYLES: Record<
  string,
  { text: string; bg: string; dot: string }
> = {
  open: { text: "text-kumpuni-blue", bg: "bg-blue-light", dot: "bg-kumpuni-blue" },
  bukas: { text: "text-kumpuni-blue", bg: "bg-blue-light", dot: "bg-kumpuni-blue" },
  completed: { text: "text-verified-green", bg: "bg-green-light", dot: "bg-verified-green" },
  "tapos na": { text: "text-verified-green", bg: "bg-green-light", dot: "bg-verified-green" },
  in_progress: { text: "text-action-orange", bg: "bg-orange-light", dot: "bg-action-orange" },
  ginagawa: { text: "text-action-orange", bg: "bg-orange-light", dot: "bg-action-orange" },
  matched: { text: "text-wood-brown", bg: "bg-[#FDF6E3]", dot: "bg-wood-brown" },
  "na-match": { text: "text-wood-brown", bg: "bg-[#FDF6E3]", dot: "bg-wood-brown" },
  cancelled: { text: "text-danger-red", bg: "bg-[#FDEDEC]", dot: "bg-danger-red" },
  "na-cancel": { text: "text-danger-red", bg: "bg-[#FDEDEC]", dot: "bg-danger-red" },
  asap: { text: "text-action-orange", bg: "bg-orange-light", dot: "bg-action-orange" },
  this_week: { text: "text-kumpuni-blue", bg: "bg-blue-light", dot: "bg-kumpuni-blue" },
  available_now: { text: "text-verified-green", bg: "bg-green-light", dot: "bg-verified-green" },
  open_anytime: { text: "text-verified-green", bg: "bg-green-light", dot: "bg-verified-green" },
  not_available: { text: "text-muted-gray", bg: "bg-[#F0F0F0]", dot: "bg-muted-gray" },
  flexible: { text: "text-muted-gray", bg: "bg-[#F0F0F0]", dot: "bg-muted-gray" },
  weekends: { text: "text-kumpuni-blue", bg: "bg-blue-light", dot: "bg-kumpuni-blue" },
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
  const styles = VARIANT_STYLES[key] ?? {
    text: "text-slate-text",
    bg: "bg-gray-100",
    dot: "bg-muted-gray",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider font-body ${styles.bg} ${styles.text}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot} ${
          pulse ? "animate-pulse" : ""
        }`}
      />
      {label}
    </span>
  );
}
