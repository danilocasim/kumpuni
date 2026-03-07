"use client";

import { useState } from "react";

export default function WorkerJobDetail({
  jobId,
  isFastMatch,
  alreadyInterested,
  fastMatchExpiresAt,
}: {
  jobId: string;
  isFastMatch: boolean;
  alreadyInterested: boolean;
  fastMatchExpiresAt: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(alreadyInterested);
  const [error, setError] = useState("");

  const handleInterest = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/interest`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save. Try again.");
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  const expired =
    fastMatchExpiresAt && new Date(fastMatchExpiresAt) < new Date();

  if (!isFastMatch) {
    return (
      <div className="mt-6 p-5 bg-surface-light border border-subtle rounded-xl text-center">
        <div className="inline-flex w-12 h-12 bg-white rounded-full items-center justify-center text-text-tertiary mb-3 shadow-sm border border-subtle">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <p className="text-base text-text-secondary font-medium">
          Flexible Match job ito.
        </p>
        <p className="text-sm text-text-tertiary mt-1">
          Makikita mo ito sa browse list ng homeowner.
        </p>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="mt-6 p-5 bg-orange-50 border border-warning-light rounded-xl text-center">
        <p className="text-action-orange font-bold flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Tapos na ang Fast Match
        </p>
        <p className="text-sm text-action-orange/80 mt-1">
          Hindi na pwede mag-apply para sa trabahong ito.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mt-6 border border-success-green/30 bg-green-50 p-5 rounded-xl text-center shadow-sm">
        <div className="inline-flex w-12 h-12 bg-success-green rounded-full items-center justify-center text-white mb-3 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <h4 className="text-lg font-extrabold text-success-green mb-1">Interesado Ka Dito!</h4>
        <p className="text-sm text-text-secondary">
          Naipadala na ang iyong interest. Maghintay kung ikaw ang pipiliin ng homeowner.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-6 card-kumpuni border-kumpuni-blue/20 bg-gradient-to-br from-blue-50 to-white shadow-sm">
      <div className="flex flex-col items-center text-center mb-5">
        <h3 className="text-xl font-extrabold text-kumpuni-blue mb-2">Gusto Mo Bang Gawin Ito?</h3>
        <p className="text-sm text-text-secondary">
          I-click ang button sa ibaba para malaman ng homeowner na available ka para gawin ang trabahong ito.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger-light border border-danger-red/20 rounded-lg flex items-start gap-2 text-danger-red text-sm font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={handleInterest}
        className="btn-primary w-full py-3 text-lg font-bold shadow-sm transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <span>{loading ? "Sinisend..." : "Oo, Interesado Ako"}</span>
        {!loading && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>}
      </button>
    </div>
  );
}
