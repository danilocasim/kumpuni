"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const REVIEW_TAGS = [
  "Maagap",
  "Malinis ang trabaho",
  "Mabait",
  "Sulit",
  "Mahal",
  "Na-late",
] as const;

export default function JobReviewForm({
  jobId,
  revieweeId,
  revieweeDisplayName,
}: {
  jobId: string;
  revieweeId: string;
  revieweeDisplayName: string;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating == null || rating < 1 || rating > 5) {
      setError("Piliin ang rating (1–5 stars).");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Kailangan mag-log in.");
        return;
      }
      const { error: insertErr } = await supabase.from("reviews").insert({
        job_id: jobId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        comment: comment.trim().slice(0, 300) || null,
        tags: tags.length > 0 ? tags : [],
      });
      if (insertErr) {
        setError(insertErr.message || "Hindi masave ang review. Subukan muli.");
        return;
      }
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="card-kumpuni p-6 text-center">
        <p className="text-body font-medium text-slate-text mb-4">
          Salamat! Na-submit na ang review mo.
        </p>
        <Link href={`/jobs/${jobId}`} className="btn-primary inline-flex">
          Balik sa job detail
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="label-kumpuni">Rating (1–5 stars) *</p>
        <div className="flex gap-2 mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="min-h-[48px] min-w-[48px] rounded-kumpuni-sm border-2 bg-white text-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-kumpuni-blue"
              style={{
                borderColor: rating != null && star <= rating ? "#8B6914" : "#E0D5C5",
                color: rating != null && star <= rating ? "#8B6914" : "#E0D5C5",
              }}
              aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="label-kumpuni">
          Komento (opsyonal, max 300 character)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 300))}
          maxLength={300}
          rows={3}
          className="input-kumpuni min-h-[100px] py-3 resize-y"
        />
        <p className="text-caption text-muted-gray mt-1">{comment.length}/300</p>
      </div>

      <div>
        <p className="label-kumpuni">Tags (optional, pili ng lahat na applicable)</p>
        <div className="flex flex-wrap gap-2 mt-1">
          {REVIEW_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-kumpuni-sm px-3 py-2 text-caption font-medium border-2 transition-colors ${
                tags.includes(tag)
                  ? "bg-blue-light border-kumpuni-blue text-kumpuni-blue"
                  : "bg-white border-warm-border-input text-muted-gray hover:border-kumpuni-blue"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-caption text-danger-red" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || rating == null}
        className="btn-primary w-full disabled:opacity-50"
      >
        {submitting ? "Sinusave..." : "I-SUBMIT ANG REVIEW"}
      </button>

      <Link href={`/jobs/${jobId}`} className="btn-ghost block text-center text-caption">
        ← Balik sa job detail
      </Link>
    </form>
  );
}
