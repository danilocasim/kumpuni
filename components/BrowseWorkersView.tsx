"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import BrowseWorkersMap, { type WorkerMarker } from "./BrowseWorkersMap";
import WorkerProfileModal, { type WorkerForProfile } from "./WorkerProfileModal";
import { WorkerCard, type WorkerCardData } from "./WorkerCard";

const MIN_RATINGS = [0, 1.0, 2.0, 3.0, 4.0, 5.0];

export type BrowseWorker = WorkerForProfile & {
  service_lat: number | null;
  service_lng: number | null;
};

export default function BrowseWorkersView({
  jobId,
  initialMinRating = 0,
}: {
  jobId: string;
  initialMinRating?: number;
}) {
  const [minRating, setMinRating] = useState(initialMinRating);
  const [workers, setWorkers] = useState<BrowseWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<BrowseWorker | null>(null);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/jobs/${jobId}/browse?min_rating=${minRating}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (res.ok) {
        setWorkers(data.workers ?? []);
      } else {
        setWorkers([]);
        setError(data.error || "Hindi ma-load ang listahan. Subukan mag-log in muli.");
      }
    } catch {
      setWorkers([]);
      setError("May nangyaring error. Subukan muli o mag-refresh.");
    } finally {
      setLoading(false);
    }
  }, [jobId, minRating]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const mapWorkers: WorkerMarker[] = workers.map((w) => ({
    worker_id: w.worker_id,
    display_name: w.display_name,
    avatar_url: w.avatar_url ?? null,
    service_lat: w.service_lat,
    service_lng: w.service_lng,
  }));

  const cardData = (w: BrowseWorker): WorkerCardData => ({
    worker_id: w.worker_id,
    display_name: w.display_name,
    avatar_url: w.avatar_url,
    skills: w.skills ?? [],
    avg_rating: w.avg_rating,
    total_jobs: w.total_jobs,
    review_count: w.review_count,
    rate_min: w.rate_min,
    rate_max: w.rate_max,
    availability: w.availability,
    is_verified: w.is_verified,
    distance_km: w.distance_km,
  });

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="min-rating" className="label-kumpuni">
          Minimum rating
        </label>
        <select
          id="min-rating"
          value={minRating}
          onChange={(e) => setMinRating(parseFloat(e.target.value))}
          className="input-kumpuni"
        >
          {MIN_RATINGS.map((r) => (
            <option key={r} value={r}>
              {r === 0 ? "Any (walang minimum)" : `${r.toFixed(1)} star${r !== 1 ? "s" : ""}`}
            </option>
          ))}
        </select>
      </div>

      <div className="card-kumpuni overflow-hidden p-2">
        <p className="text-caption text-slate-text mb-2">
          Lokasyon ng workers (approximate)
          {workers.length > 0 && (
            <span className="ml-1 text-muted-gray">
              — {mapWorkers.filter((w) => w.service_lat != null && w.service_lng != null).length} sa map
            </span>
          )}
        </p>
        <BrowseWorkersMap
          workers={mapWorkers}
          onSelectWorker={(id) => {
            const w = workers.find((x) => x.worker_id === id);
            if (w) setSelectedWorker(w);
          }}
        />
      </div>

      <h2 className="font-heading text-[15px] font-bold text-slate-text">
        Mga worker
      </h2>
      {error && (
        <div className="card-kumpuni border-danger-red/30 bg-orange-light/50 p-3 text-body text-slate-text">
          {error}
          <button
            type="button"
            onClick={() => fetchWorkers()}
            className="btn-ghost mt-2"
          >
            Subukan muli
          </button>
        </div>
      )}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-kumpuni p-3 flex gap-3">
              <div className="h-14 w-14 rounded-full skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 skeleton" />
                <div className="h-3 w-full skeleton" />
                <div className="h-3 w-32 skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? null : workers.length === 0 ? (
        <div className="card-kumpuni p-4 space-y-1">
          <p className="font-medium text-slate-text">
            Walang worker na nag-match sa filter ngayon.
          </p>
          <p className="text-caption text-muted-gray">
            Subukan ibababa ang minimum rating (dropdown sa taas), o maghintay —
            may workers na magre-register na malapit sa area mo.
          </p>
        </div>
      ) : (
        <ul className="space-y-card-gap">
          {workers.map((w) => (
            <li key={w.worker_id}>
              <WorkerCard
                worker={cardData(w)}
                onClick={(workerId) => {
                  const worker = workers.find((x) => x.worker_id === workerId);
                  if (worker) setSelectedWorker(worker);
                }}
                showDistance={true}
              />
            </li>
          ))}
        </ul>
      )}

      {selectedWorker && (
        <WorkerProfileModal
          worker={selectedWorker}
          jobId={jobId}
          onClose={() => setSelectedWorker(null)}
        />
      )}

      <Link href={`/jobs/${jobId}`} className="btn-ghost text-caption mt-4 inline-block">
        Balik sa job detail
      </Link>
    </div>
  );
}
