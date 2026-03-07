"use client";

import { useEffect, useState } from "react";

const OPTIONS: { value: string; label: string }[] = [
  { value: "available_now", label: "Available Now" },
  { value: "this_week", label: "This Week" },
  { value: "weekends", label: "Weekends" },
  { value: "open_anytime", label: "Open Anytime" },
  { value: "not_available", label: "Not Available" },
];

export default function WorkerAvailabilitySection() {
  const [availability, setAvailability] = useState<string>("not_available");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/worker/availability", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.availability) setAvailability(data.availability);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function handleChange(value: string) {
    setAvailability(value);
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/worker/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: value }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Na-update ang availability mo.");
      } else {
        setMessage(data.error || "Could not save. Try again.");
      }
    } catch {
      setMessage("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="card-kumpuni p-6 animate-pulse">
        <p className="text-text-secondary">Sinisilip ang availability...</p>
      </div>
    );
  }

  return (
    <div className="card-kumpuni p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Availability</h2>
        <p className="text-sm text-text-secondary">
          Choose when you&apos;re available for jobs. Every day at 10 PM PHT this resets to Not Available unless you change it.
        </p>
      </div>
      <div className="relative">
        <select
          value={availability}
          onChange={(e) => handleChange(e.target.value)}
          disabled={saving}
          className="input-kumpuni appearance-none cursor-pointer pr-10"
        >
          {OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-tertiary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
      {message && (
        <p className={`text-sm font-medium ${message.includes("Na-update") ? "text-success-green" : "text-action-orange"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
