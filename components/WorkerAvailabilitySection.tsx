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
        setMessage(data.error || "Hindi masave. Subukan muli.");
      }
    } catch {
      setMessage("May nangyaring error. Subukan muli.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-sm text-gray-500">Sinisilip ang availability...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 p-3 space-y-2">
      <p className="text-sm font-medium text-gray-700">Availability</p>
      <p className="text-xs text-gray-500 mb-2">
        Piliin kung kailan ka available para sa mga job. Araw-araw 10 PM PHT, magre-reset ito sa Not Available kung hindi mo babaguhin.
      </p>
      <select
        value={availability}
        onChange={(e) => handleChange(e.target.value)}
        disabled={saving}
        className="w-full min-h-touch rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {message && (
        <p className={`text-xs ${message.includes("Na-update") ? "text-green-600" : "text-amber-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
