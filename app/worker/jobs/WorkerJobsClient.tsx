"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Map, List, MapPin } from "lucide-react";
import { JobMap } from "@/components/JobMap";

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  carpentry: "Carpentry",
  painting: "Painting",
  masonry: "Masonry",
  general: "General Repair",
};

const URGENCY_LABELS: Record<string, string> = {
  asap: "ASAP",
  this_week: "This Week",
  flexible: "Flexible",
};

type JobItem = {
  id: string;
  category: string;
  description: string;
  barangay: string;
  urgency: string;
  budget_range: string | null;
  matching_mode: string;
  created_at: string;
  distance_km: number;
  interested_count: number;
  lat?: number;
  lng?: number;
};

export default function WorkerJobsClient({ initialJobs }: { initialJobs: JobItem[] }) {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  
  const mapJobs = initialJobs.filter(j => j.lat != null && j.lng != null).map(j => ({
    lat: j.lat!,
    lng: j.lng!,
    id: j.id
  }));

  // Simple heuristic: focus map on the first job or Metro Manila center
  const center: [number, number] = mapJobs.length > 0 ? [mapJobs[0].lat, mapJobs[0].lng] : [14.5995, 120.9842];

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Available jobs</h1>
          <p className="text-text-secondary text-lg">Jobs na match sa skills mo at malapit sa service area mo.</p>
        </div>
        
        {/* View Toggle */}
        <div className="bg-surface-light p-1 rounded-lg inline-flex border border-subtle">
           <button
             onClick={() => setViewMode("list")}
             className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === "list" ? "bg-white shadow-sm text-kumpuni-blue" : "text-text-secondary hover:text-text-primary"}`}
           >
             <List className="w-4 h-4" />
             List
           </button>
           <button
             onClick={() => setViewMode("map")}
             className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === "map" ? "bg-white shadow-sm text-kumpuni-blue" : "text-text-secondary hover:text-text-primary"}`}
           >
             <Map className="w-4 h-4" />
             Map
           </button>
        </div>
      </div>

      {!initialJobs.length ? (
        <div className="card-kumpuni p-8 text-center text-text-secondary">
          No open jobs near your area right now. Try again later.
        </div>
      ) : viewMode === "map" ? (
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-subtle h-[600px] animate-in slide-in-from-bottom-4 duration-500 fade-in">
           <JobMap jobCenter={center} workerLocations={mapJobs} className="h-full w-full rounded-xl" zoom={12} />
        </div>
      ) : (
        <ul className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 fade-in">
          {initialJobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/worker/jobs/${job.id}`}
                className="block card-kumpuni hover:border-kumpuni-blue/30 hover:bg-blue-50/30 transition-colors group"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`badge-status ${job.matching_mode === "fast" ? "badge-asap" : "badge-flexible"}`}>
                      {job.matching_mode === "fast" ? "Fast Match" : "Flexible"}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-text-primary">
                        {CATEGORY_LABELS[job.category] ?? job.category}
                      </span>
                    </div>
                  </div>

                  <p className="text-lg font-semibold text-text-primary line-clamp-2 mb-3 group-hover:text-kumpuni-blue transition-colors">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-tertiary mb-3 pt-3 border-t border-subtle">
                    <span className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      {job.barangay}
                      {typeof job.distance_km === "number" && ` (${job.distance_km.toFixed(1)} km)`}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {URGENCY_LABELS[job.urgency] ?? job.urgency}
                    </span>
                    {job.budget_range && (
                      <span className="flex items-center gap-1.5 font-medium text-text-secondary">
                        {job.budget_range}
                      </span>
                    )}
                    {job.matching_mode === "fast" && typeof job.interested_count === "number" && (
                      <span className="flex items-center gap-1.5 text-action-orange font-medium bg-orange-50 px-2 py-0.5 rounded-full">
                        {job.interested_count} interested
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-text-tertiary">
                    Posted: {format(new Date(job.created_at), "MMM d, h:mm a")}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
