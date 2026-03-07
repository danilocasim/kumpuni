"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LocationPicker, type LocationValue } from "@/components/LocationPicker";
import { JobPhotoUpload, type JobPhotoFile } from "@/components/JobPhotoUpload";

const CATEGORIES = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "carpentry", label: "Carpentry" },
  { value: "painting", label: "Painting" },
  { value: "masonry", label: "Masonry" },
  { value: "general", label: "General Repair" },
];

const URGENCY_OPTIONS = [
  { value: "asap", label: "Today / ASAP" },
  { value: "this_week", label: "This Week" },
  { value: "flexible", label: "Flexible / No Rush" },
];

const BUDGET_OPTIONS = [
  { value: "under_1k", label: "Under ₱1,000" },
  { value: "1k_3k", label: "₱1,000 – ₱3,000" },
  { value: "3k_5k", label: "₱3,000 – ₱5,000" },
  { value: "5k_10k", label: "₱5,000 – ₱10,000" },
  { value: "10k_plus", label: "₱10,000+" },
  { value: "not_sure", label: "Not Sure" },
];

export default function NewJobPage() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [photos, setPhotos] = useState<JobPhotoFile[]>([]);
  const [urgency, setUrgency] = useState("this_week");
  const [budget, setBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!location) {
      setError("Kailangan pumili ng lokasyon.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?role=homeowner&next=/jobs/new");
        return;
      }

      const photoUrls: string[] = [];
      if (photos.length > 0) {
        const prefix = `${user.id}/${Date.now()}`;
        for (let i = 0; i < photos.length; i++) {
          const ext = photos[i].file.name.split(".").pop() || "jpg";
          const path = `${prefix}_${i}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from("jobs")
            .upload(path, photos[i].file, { upsert: false });
          if (uploadErr) throw uploadErr;
          const { data: urlData } = supabase.storage.from("jobs").getPublicUrl(path);
          photoUrls.push(urlData.publicUrl);
        }
      }

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description: description.slice(0, 500),
          photo_urls: photoUrls,
          lat: location.lat,
          lng: location.lng,
          barangay: location.barangay,
          urgency,
          budget_range: budget || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hindi masave ang job.");

      if (urgency === "asap") {
        router.push(`/jobs/${data.id}/fast`);
      } else {
        router.push(`/jobs/${data.id}/browse`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "May nangyaring error. Subukan muli.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen p-4 pb-24 max-w-[480px] mx-auto page-bg">
      <h1 className="font-heading text-headline-mobile font-bold text-slate-text mb-6">
        Mag-post ng Job
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="category" className="label-kumpuni">
            Kategorya
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="input-kumpuni"
          >
            <option value="">Piliin ang kategorya...</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="label-kumpuni">
            Deskripsyon (max 500 character)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            required
            rows={3}
            className="input-kumpuni min-h-[100px] py-3 resize-y"
          />
          <p className="text-caption text-muted-gray mt-1">{description.length}/500</p>
        </div>

        <JobPhotoUpload value={photos} onChange={setPhotos} />

        <div>
          <label className="label-kumpuni">Lokasyon</label>
          <LocationPicker value={location} onChange={setLocation} />
        </div>

        <div>
          <label htmlFor="urgency" className="label-kumpuni">
            Urgency
          </label>
          <select
            id="urgency"
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            className="input-kumpuni"
          >
            {URGENCY_OPTIONS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="budget" className="label-kumpuni">
            Budget (optional)
          </label>
          <select
            id="budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="input-kumpuni"
          >
            <option value="">Piliin...</option>
            {BUDGET_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-caption text-danger-red" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full disabled:opacity-50 disabled:pointer-events-none"
        >
          {submitting ? "Sinusave..." : "I-POST ANG JOB"}
        </button>
      </form>
    </main>
  );
}
