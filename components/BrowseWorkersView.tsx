"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Star,
  ChevronRight,
  ArrowLeft,
  BadgeCheck,
  SlidersHorizontal,
  Search,
  ChevronDown,
} from "lucide-react";
import BrowseWorkersMap, { type WorkerMarker } from "./BrowseWorkersMap";
import WorkerProfileModal, { type WorkerForProfile } from "./WorkerProfileModal";

const MIN_RATINGS = [0, 1.0, 2.0, 3.0, 4.0, 5.0];

const SKILL_LABELS: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  carpentry: "Carpentry",
  painting: "Painting",
  masonry: "Masonry",
  general: "General Repair",
};

const SKILL_FILTERS = ["All", "Plumbing", "Electrical", "Painting", "Carpentry", "Masonry"];

const AVAILABILITY_LABELS: Record<string, string> = {
  available_now: "AVAILABLE TODAY",
  this_week: "THIS WEEK",
  weekends: "WEEKENDS",
  open_anytime: "AVAILABLE",
  not_available: "BUSY",
};

function isAvailable(availability: string) {
  return availability === "available_now" || availability === "open_anytime";
}

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
  const [jobLocation, setJobLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<BrowseWorker | null>(null);
  const [activeSkillFilter, setActiveSkillFilter] = useState("All");
  const [ratingDropdownOpen, setRatingDropdownOpen] = useState(false);

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
        if (
          data.job_lat != null &&
          data.job_lng != null &&
          Number.isFinite(data.job_lat) &&
          Number.isFinite(data.job_lng)
        ) {
          setJobLocation({ lat: data.job_lat, lng: data.job_lng });
        } else {
          setJobLocation(null);
        }
      } else {
        setWorkers([]);
        setJobLocation(null);
        setError(data.error || "Could not load list. Try logging in again.");
      }
    } catch {
      setWorkers([]);
      setJobLocation(null);
      setError("Something went wrong. Try again or refresh.");
    } finally {
      setLoading(false);
    }
  }, [jobId, minRating]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const filteredWorkers = workers.filter((w) => {
    if (activeSkillFilter === "All") return true;
    const normalizedSkills = (w.skills ?? []).map(
      (s) => (SKILL_LABELS[s] || s).toLowerCase()
    );
    return normalizedSkills.includes(activeSkillFilter.toLowerCase());
  });

  const mapWorkers: WorkerMarker[] = filteredWorkers.map((w) => ({
    worker_id: w.worker_id,
    display_name: w.display_name,
    avatar_url: w.avatar_url ?? null,
    service_lat: w.service_lat,
    service_lng: w.service_lng,
  }));

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col lg:flex-row overflow-hidden">
      {/* LEFT: Map Area */}
      <div className="flex-none h-[40vh] lg:h-auto w-full lg:w-[55%] xl:w-[65%] relative border-b lg:border-b-0 border-dim z-10 shrink-0">
        <div className="h-full w-full">
          <BrowseWorkersMap
            workers={mapWorkers}
            jobLocation={jobLocation}
            onSelectWorker={(id) => {
              const w = workers.find((x) => x.worker_id === id);
              if (w) setSelectedWorker(w);
            }}
          />
        </div>
      </div>

      {/* RIGHT: Sidebar List */}
      <div className="flex-1 w-full lg:w-[45%] xl:w-[35%] flex flex-col h-full bg-[#F4F6F8] lg:border-l border-dim shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Context Header */}
          <div className="mb-6">
            <Link
              href={`/jobs/${jobId}`}
              className="flex items-center text-text-tertiary hover:text-kumpuni-blue text-sm font-medium mb-3 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              Back to Job Details
            </Link>
            <h2 className="text-2xl font-bold text-text-primary leading-tight font-display">
              Matchmaking
            </h2>
            <p className="text-sm text-text-tertiary mt-1">
              Select a pro below to view their profile.
            </p>
          </div>

          {/* Filter Container */}
          <div className="bg-white p-5 rounded-2xl border border-dim shadow-sm mb-6">
            {/* Skill Filter */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-text-primary">Filter by Skill</span>
                <SlidersHorizontal className="w-4 h-4 text-text-tertiary/70" />
              </div>
              <div className="flex flex-wrap gap-2">
                {SKILL_FILTERS.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => setActiveSkillFilter(skill)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                      activeSkillFilter === skill
                        ? "bg-kumpuni-blue text-white border-kumpuni-blue shadow-sm"
                        : "bg-white text-text-secondary border-dim hover:bg-surface-light/50 hover:border-light"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Min Rating Filter */}
            <div className="flex items-center justify-between pt-4 border-t border-dim/50">
              <span className="text-sm font-semibold text-text-primary">Min. rating</span>
              <div className="relative">
                <button
                  onClick={() => setRatingDropdownOpen(!ratingDropdownOpen)}
                  className="flex items-center justify-between w-32 px-3 py-2 bg-white border border-dim rounded-lg text-sm font-medium text-text-primary hover:bg-surface-light/50 transition-colors"
                >
                  {minRating === 0 ? "Any" : `${minRating.toFixed(1)} stars`}
                  <ChevronDown className="w-4 h-4 text-text-tertiary/70" />
                </button>
                {ratingDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-dim rounded-lg shadow-lg z-30 py-1">
                    {MIN_RATINGS.map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setMinRating(r);
                          setRatingDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-3 py-2 text-sm hover:bg-surface-light/50 ${
                          minRating === r ? "font-bold text-kumpuni-blue" : "text-text-primary"
                        }`}
                      >
                        {r === 0 ? "Any" : `${r.toFixed(1)} star${r !== 1 ? "s" : ""}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-white rounded-2xl border border-danger-red/30 p-4 mb-4 text-body text-text-primary">
              {error}
              <button
                type="button"
                onClick={() => fetchWorkers()}
                className="block mt-2 text-sm font-semibold text-kumpuni-blue hover:text-action-orange transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-dim/50 p-5 flex gap-4">
                  <div className="h-14 w-14 rounded-full skeleton shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-28 skeleton" />
                    <div className="h-3 w-full skeleton" />
                    <div className="h-3 w-32 skeleton" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? null : (
            /* Worker List */
            <div className="flex flex-col gap-4">
              {filteredWorkers.map((worker) => {
                const skills = (worker.skills ?? [])
                  .slice(0, 4)
                  .map((s) => SKILL_LABELS[s] || s);
                const available = isAvailable(worker.availability);
                const rateStr =
                  worker.rate_min != null
                    ? `₱${worker.rate_min.toLocaleString()}`
                    : "—";

                return (
                  <button
                    key={`list-${worker.worker_id}`}
                    type="button"
                    onClick={() => setSelectedWorker(worker)}
                    className="group relative bg-white rounded-2xl shadow-sm border border-dim/50 hover:border-kumpuni-blue/40 hover:shadow-md transition-all cursor-pointer overflow-hidden flex text-left"
                  >
                    {/* Status Indicator Left Border */}
                    <div
                      className={`w-[6px] shrink-0 ${
                        available ? "bg-emerald-500" : "bg-[#E5E9EC]"
                      }`}
                    />

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      {/* Top Row: Avatar & Details */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4">
                          <div className="w-14 h-14 rounded-full overflow-hidden shadow-sm bg-white border-2 border-kumpuni-blue shrink-0 flex items-center justify-center">
                            {worker.avatar_url ? (
                              <img
                                src={worker.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="font-heading text-lg font-bold text-text-tertiary">
                                {(worker.display_name || "W")[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-lg font-bold text-text-primary leading-none">
                                {worker.display_name || "Worker"}
                              </h3>
                              {worker.is_verified && (
                                <BadgeCheck
                                  className="w-4 h-4 text-blue-500"
                                  aria-label="Verified ID"
                                />
                              )}
                            </div>
                            <div className="flex items-center text-sm text-text-tertiary mt-1.5">
                              <Star className="w-4 h-4 text-[#F59E0B] fill-current mr-1" />
                              <span className="font-bold text-text-primary">
                                {Number(worker.avg_rating).toFixed(1)}
                              </span>
                              <span className="mx-1.5 text-text-tertiary/40">&bull;</span>
                              <span>({worker.review_count} reviews)</span>
                            </div>
                          </div>
                        </div>

                        {/* Distance */}
                        {worker.distance_km != null && (
                          <span className="text-xs font-semibold text-text-tertiary bg-surface-light px-2 py-1 rounded-md">
                            {worker.distance_km.toFixed(1)} km
                          </span>
                        )}
                      </div>

                      {/* Middle Row: Skills */}
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {skills.map((skill) => (
                            <span
                              key={`${worker.worker_id}-${skill}`}
                              className="px-2.5 py-1 bg-[#F0F4F8] text-[#3A5D80] text-xs font-medium rounded border border-[#D9E2EC]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Bottom Row: Price & Status */}
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-text-tertiary">
                          Starts at{" "}
                          <span className="font-bold text-text-primary text-base ml-1">
                            {rateStr}
                          </span>{" "}
                          / araw
                        </div>

                        <div className="flex items-center gap-2">
                          {available ? (
                            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              {AVAILABILITY_LABELS[worker.availability] ?? "AVAILABLE"}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-surface-light/50 text-text-tertiary px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                              {AVAILABILITY_LABELS[worker.availability] ?? "BUSY"}
                            </div>
                          )}
                          <ChevronRight className="w-5 h-5 text-text-tertiary/40 group-hover:text-kumpuni-blue transition-colors ml-1" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Empty State */}
              {filteredWorkers.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-dim border-dashed">
                  <Search className="w-10 h-10 text-text-tertiary/40 mx-auto mb-4" />
                  <p className="text-text-secondary font-medium">No pros found for this skill.</p>
                  <button
                    onClick={() => setActiveSkillFilter("All")}
                    className="text-kumpuni-blue hover:text-action-orange transition-colors text-sm mt-3 font-semibold"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Worker Profile Modal */}
      {selectedWorker && (
        <WorkerProfileModal
          worker={selectedWorker}
          jobId={jobId}
          onClose={() => setSelectedWorker(null)}
        />
      )}
    </div>
  );
}
