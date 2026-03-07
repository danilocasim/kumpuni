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
        setError(data.error || "Hindi ma-load ang numero.");
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
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-lg font-bold">Profile ng worker</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-touch min-w-touch rounded p-1 text-gray-500 hover:bg-gray-100"
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
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-medium">
              {(worker.display_name || "W")[0]}
            </div>
          )}
          <div>
            <p className="font-semibold">{worker.display_name || "Worker"}</p>
            {worker.is_verified && (
              <span className="text-xs text-green-600 font-medium">Verified</span>
            )}
            <p className="text-sm text-gray-600">
              ★ {Number(worker.avg_rating).toFixed(1)} ({worker.review_count} review
              {worker.review_count !== 1 ? "s" : ""})
            </p>
            {worker.distance_km != null && (
              <p className="text-xs text-gray-500">{worker.distance_km} km away</p>
            )}
          </div>
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {skills.map((s) => (
              <span
                key={s}
                className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        <p className="text-sm text-gray-600 mb-1">
          Availability: {AVAILABILITY_LABELS[worker.availability] ?? worker.availability}
        </p>
        <p className="text-sm text-gray-600 mb-1">
          Rate: ₱{worker.rate_min ?? "?"} – ₱{worker.rate_max ?? "?"} / day
        </p>
        <p className="text-sm text-gray-600 mb-4">
          {worker.total_jobs} completed job{worker.total_jobs !== 1 ? "s" : ""}
        </p>

        {error && (
          <p className="text-sm text-red-600 mb-2">{error}</p>
        )}

        {phone !== null ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="text-sm text-green-800 font-medium">Contact number</p>
            <a
              href={`tel:${phone}`}
              className="text-green-700 font-medium underline"
            >
              {phone}
            </a>
            <p className="text-xs text-green-600 mt-1">
              Pwede na tumawag o mag-SMS.
            </p>
          </div>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={handleContact}
            className="min-h-touch w-full rounded-lg bg-blue-600 px-4 font-medium text-white disabled:opacity-50"
          >
            {loading ? "Naglo-load..." : "Contact (ipakita ang numero)"}
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-lg border border-gray-300 py-2 text-sm text-gray-700"
        >
          Isara
        </button>
      </div>
    </div>
  );
}
