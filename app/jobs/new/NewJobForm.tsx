"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LocationPicker, type LocationValue } from "@/components/LocationPicker";
import { JobPhotoUpload, type JobPhotoFile } from "@/components/JobPhotoUpload";

const CATEGORIES = [
  { value: "plumbing", label: "Plumbing (Tubero)" },
  { value: "electrical", label: "Electrical (Elektrisyan)" },
  { value: "carpentry", label: "Carpentry (Karpintero)" },
  { value: "painting", label: "Painting (Pintor)" },
  { value: "masonry", label: "Masonry (Mason)" },
  { value: "general", label: "General Repair (Iba pa)" },
];

const URGENCY_OPTIONS = [
  { value: "asap", label: "Ngayon Din / ASAP" },
  { value: "this_week", label: "Ngayong Linggo" },
  { value: "flexible", label: "Flexible / Walang Minamadali" },
];

const BUDGET_OPTIONS = [
  { value: "under_1k", label: "Pababa ng ₱1,000" },
  { value: "1k_3k", label: "₱1,000 – ₱3,000" },
  { value: "3k_5k", label: "₱3,000 – ₱5,000" },
  { value: "5k_10k", label: "₱5,000 – ₱10,000" },
  { value: "10k_plus", label: "₱10,000+" },
  { value: "not_sure", label: "Hindi pa sigurado" },
];

export default function NewJobForm() {
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
      setError("Please select a location.");
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
      if (!res.ok) throw new Error(data.error || "Could not save job.");

      if (urgency === "asap") {
        router.push(`/jobs/${data.id}/fast`);
      } else {
        router.push(`/jobs/${data.id}/browse`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="mb-8 text-center pb-6 border-b border-subtle">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
          Mag-post ng Trabaho
        </h1>
        <p className="text-text-secondary mt-2">Ibigay ang detalye ng kailangang gawin para makahanap ng tamang kumpunero.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card-kumpuni p-6 sm:p-8 space-y-6 bg-gradient-to-br from-white to-surface-light border-2 border-kumpuni-blue/20">

          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-subtle">
             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-kumpuni-blue font-bold">1</div>
             <h2 className="text-xl font-bold text-text-primary">Detalye ng Trabaho</h2>
          </div>

          <div>
            <label htmlFor="category" className="label-kumpuni font-bold mb-2 block text-base flex items-center gap-2">
              Kategorya
            </label>
            <div className="relative">
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="input-kumpuni appearance-none cursor-pointer pr-10 py-3 shadow-inner bg-white border-2 focus:border-kumpuni-blue font-medium"
              >
                <option value="" disabled>Pumili ng kategorya...</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-kumpuni-blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="label-kumpuni flex justify-between font-bold mb-2">
              <span className="text-base flex items-center gap-2">Deskripsyon</span>
              <span className="font-normal text-text-tertiary text-xs bg-surface-light px-2 py-0.5 rounded-md">Max 500 chars</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              required
              rows={4}
              placeholder="Ilarawan nang maayos ang kailangang gawin (Hal: 'Kailangan ng mag-aayos ng tubong tumutulo sa ilalim ng lababo')"
              className="input-kumpuni py-3 resize-y shadow-inner border-2 focus:border-kumpuni-blue"
            />
            <p className="text-xs font-medium text-text-tertiary mt-2 text-right">{description.length}/500</p>
          </div>

          <div>
            <label className="label-kumpuni font-bold mb-2 block text-base">Mga Litrato <span className="text-sm font-normal text-text-secondary">(Opsyonal)</span></label>
            <JobPhotoUpload value={photos} onChange={setPhotos} />
            <p className="text-sm mt-2 text-text-secondary">Mas madaling makahanap ng kumpunero kapag may malinaw na litrato ang sirang aayusin.</p>
          </div>

          <div className="pt-6 mt-2 border-t border-subtle border-dashed">
            <label className="label-kumpuni font-bold mb-2 block text-base flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-danger-red"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              Lokasyon ng Trabaho
            </label>
            <LocationPicker value={location} onChange={setLocation} />
          </div>
        </div>

        <div className="card-kumpuni p-6 sm:p-8 space-y-6 shadow-sm border border-subtle">
           <div className="flex items-center gap-3 mb-6 pb-2 border-b border-subtle">
             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-kumpuni-blue font-bold">2</div>
             <h2 className="text-xl font-bold text-text-primary">Matching Preferences</h2>
          </div>

          <div>
            <label htmlFor="urgency" className="label-kumpuni font-bold mb-2 block text-base flex items-center gap-2">
              Kailan dapat gawin?
            </label>
            <div className="relative">
              <select
                id="urgency"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="input-kumpuni appearance-none cursor-pointer pr-10 py-3 bg-white"
              >
                {URGENCY_OPTIONS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-text-tertiary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
            {urgency === "asap" && (
              <p className="text-sm font-medium text-action-orange mt-2 flex items-start gap-1 bg-orange-50 p-2 rounded-md border border-warning-light">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                Ang pagpili ng &quot;Ngayon Din&quot; ay awtomatikong gagamit ng Fast Match para ma-alerto agad ang mga malapit na kumpunero.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="budget" className="label-kumpuni font-bold mb-2 block text-base flex justify-between items-center">
              <span>Estimated na Budget</span>
              <span className="text-sm font-normal text-text-secondary">(Opsyonal)</span>
            </label>
            <div className="relative">
              <select
                id="budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="input-kumpuni appearance-none cursor-pointer pr-10 py-3 bg-white"
              >
                <option value="" disabled>Pumili ng inaasahang budget...</option>
                {BUDGET_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-text-tertiary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
            <p className="text-sm text-text-secondary mt-2">Ito ay basehan lamang at maaari pang makipag-negosasyon mismo sa kumpunero.</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-danger-light border border-danger-red/30 rounded-xl flex gap-2 items-start shadow-sm">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-danger-red shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            <p className="text-sm font-bold text-danger-red" role="alert">
              {error}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full shadow-lg text-lg py-4 flex items-center justify-center gap-2 hover:-translate-y-1 transition-transform"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
               <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               SINE-SAVE...
            </span>
          ) : "I-POST ANG TRABAHO"}
        </button>
      </form>
    </div>
  );
}
