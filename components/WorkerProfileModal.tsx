"use client";

import { useState } from "react";

const SKILL_LABELS: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  carpentry: "Carpentry",
  painting: "Painting",
  masonry: "Masonry",
  general: "General",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  this_week: "This Week",
  weekends: "Weekends",
  open_anytime: "Open Anytime",
  available_now: "Available Now",
  not_available: "Not Available",
};

export type WorkerForProfile = {
  worker_id: string;
  display_name: string | null;
  avatar_url: string | null;
  skills: string[] | null;
  avg_rating: number;
  rate_min: number | null;
  rate_max: number | null;
  total_jobs: number;
  distance_km: number | null;
  availability: string;
  is_verified: boolean;
  review_count: number;
};

export default function WorkerProfileModal({
  worker,
  jobId,
  onClose,
}: {
  worker: WorkerForProfile;
  jobId: string;
  onClose: () => void;
}) {
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContact = async () => {
    if (phone !== null) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worker_id: worker.worker_id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load number.");
        return;
      }
      setPhone(data.phone || "");
    } finally {
      setLoading(false);
    }
  };

  const skills = (worker.skills ?? []).map(
    (s) => SKILL_LABELS[s] || s
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto card-kumpuni p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-3">
          <h2 className="font-display text-xl font-bold text-text-primary">Profile ng worker</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-touch min-w-touch rounded p-1 text-text-tertiary hover:bg-surface-light border border-transparent hover:border-dim"
            aria-label="Isara"
          >
            ×
          </button>
        </div>

        <div className="flex gap-3 mb-4">
          {worker.avatar_url ? (
            <img
              src={worker.avatar_url}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-surface-light shrink-0 flex items-center justify-center text-text-tertiary text-xl font-display font-medium border border-dim">
              {(worker.display_name || "W")[0]}
            </div>
          )}
          <div>
            <p className="font-display font-bold text-[18px] text-text-primary">{worker.display_name || "Worker"}</p>
            {worker.is_verified && (
              <span className="text-caption font-medium text-success-green bg-success-green/10 px-1.5 py-0.5 rounded">Verified</span>
            )}
            <p className="text-[15px] font-body text-text-secondary">
              ★ {Number(worker.avg_rating).toFixed(1)} ({worker.review_count} review
              {worker.review_count !== 1 ? "s" : ""})
            </p>
            {worker.distance_km != null && (
              <p className="text-caption text-text-tertiary">{worker.distance_km} km away</p>
            )}
          </div>
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {skills.map((s) => (
              <span
                key={s}
                className="rounded bg-surface-light border border-dim px-2 py-1 text-caption text-text-secondary"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        <p className="text-[15px] font-body text-text-secondary mb-1">
          Availability: {AVAILABILITY_LABELS[worker.availability] ?? worker.availability}
        </p>
        <p className="text-[15px] font-body text-text-secondary mb-1">
          Rate: ₱{worker.rate_min ?? "?"} – ₱{worker.rate_max ?? "?"} / day
        </p>
        <p className="text-[15px] font-body text-text-secondary mb-4">
          {worker.total_jobs} completed job{worker.total_jobs !== 1 ? "s" : ""}
        </p>

        {error && (
          <p className="text-caption text-danger-red mb-3 p-2 bg-danger-red/10 rounded-kumpuni-sm">{error}</p>
        )}

        {phone !== null ? (
          <div className="card-kumpuni p-4 bg-success-green/5 border-success-green/20">
            <p className="text-[15px] font-medium text-success-green">Contact number</p>
            <a
              href={`tel:${phone}`}
              className="font-medium text-success-green/80 underline underline-offset-2"
            >
              {phone}
            </a>
            <p className="text-caption text-success-green/70 mt-1">
              Pwede na tumawag o mag-SMS.
            </p>
          </div>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={handleContact}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Loading..." : "Contact (show number)"}
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="btn-secondary w-full mt-3"
        >
          Isara
        </button>
      </div>
    </div>
  );
}
