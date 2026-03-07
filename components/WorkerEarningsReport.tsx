"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function WorkerEarningsReport({
  jobId,
  initialAmount,
}: {
  jobId: string;
  initialAmount: number | null;
}) {
  const [amount, setAmount] = useState(initialAmount?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    const num = amount.trim() === "" ? null : parseInt(amount.trim(), 10);
    if (num != null && (Number.isNaN(num) || num < 0)) {
      setError("Enter amount in PHP (numbers only).");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const supabase = createClient();
      const { error: updateErr } = await supabase
        .from("jobs")
        .update({ worker_reported_amount: num })
        .eq("id", jobId);
      if (updateErr) {
        setError(updateErr.message || "Could not save. Try again.");
        return;
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 card-kumpuni p-4">
      <p className="text-caption font-medium text-slate-text mb-2">
        Report earnings (for your records only, optional)
      </p>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label htmlFor="worker-reported-amount" className="label-kumpuni">
            Halaga (₱)
          </label>
          <input
            id="worker-reported-amount"
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-kumpuni"
            placeholder="0"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-secondary py-2"
        >
          {saving ? "Saving..." : saved ? "Saved" : "Save"}
        </button>
      </div>
      {error && (
        <p className="text-caption text-danger-red mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
