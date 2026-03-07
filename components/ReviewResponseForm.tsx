"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ReviewResponseForm({
  reviewId,
  initialResponse,
}: {
  reviewId: string;
  initialResponse: string | null;
}) {
  const [response, setResponse] = useState(initialResponse ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (initialResponse && !response) setResponse(initialResponse);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = response.trim().slice(0, 200);
    setError("");
    setSaving(true);
    try {
      const supabase = createClient();
      const { error: updateErr } = await supabase
        .from("reviews")
        .update({ response: trimmed || null })
        .eq("id", reviewId);
      if (updateErr) {
        setError(updateErr.message || "Could not save. Try again.");
        return;
      }
      setResponse(trimmed);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <label htmlFor={`response-${reviewId}`} className="text-caption font-medium text-slate-text">
        Iyong response (max 200 character, isang beses lang)
      </label>
      <textarea
        id={`response-${reviewId}`}
        value={response}
        onChange={(e) => setResponse(e.target.value.slice(0, 200))}
        maxLength={200}
        rows={2}
        disabled={!!initialResponse}
        className="input-kumpuni mt-1 min-h-[60px] py-2 text-body disabled:opacity-70"
      />
      <p className="text-caption text-muted-gray">{response.length}/200</p>
      {!initialResponse && (
        <button
          type="submit"
          disabled={saving || !response.trim()}
          className="btn-secondary mt-2 text-sm py-2 disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved" : "Save response"}
        </button>
      )}
      {error && (
        <p className="text-caption text-danger-red mt-1" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
