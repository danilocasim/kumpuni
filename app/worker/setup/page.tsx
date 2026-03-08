"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ServiceAreaPicker, type ServiceAreaValue } from "@/components/ServiceAreaPicker";
import { PageContainer } from "@/components/PageContainer";

const SKILLS = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "carpentry", label: "Carpentry" },
  { value: "painting", label: "Painting" },
  { value: "masonry", label: "Masonry" },
  { value: "general", label: "General Repair" },
];

const EXPERIENCE_LEVELS = [
  { value: "1_2yr", label: "1–2 years" },
  { value: "3_5yr", label: "3–5 years" },
  { value: "5_10yr", label: "5–10 years" },
  { value: "10yr_plus", label: "10+ years" },
];

export default function WorkerSetupPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [rateMin, setRateMin] = useState("");
  const [rateMax, setRateMax] = useState("");
  const [bio, setBio] = useState("");
  const [serviceArea, setServiceArea] = useState<ServiceAreaValue | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u ? { id: u.id } : null));
  }, [mounted]);

  const toggleSkill = (value: string) => {
    setSkills((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setAvatarFile(f);
      setAvatarPreview(URL.createObjectURL(f));
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdFile(e.target.files?.[0] ?? null);
  };

  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const next = portfolioFiles.concat(files).slice(0, 6);
    setPortfolioFiles(next);
    setPortfolioPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSubmitting(true);
    try {
      const supabase = createClient();
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const path = `${user.id}/${Date.now()}_avatar.${avatarFile.name.split(".").pop() || "jpg"}`;
        const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = urlData.publicUrl;
      }

      let validIdUrl: string | null = null;
      if (idFile) {
        const path = `${user.id}/${Date.now()}_id.${idFile.name.split(".").pop() || "pdf"}`;
        const { error: upErr } = await supabase.storage.from("verification").upload(path, idFile, { upsert: false });
        if (upErr) throw upErr;
        validIdUrl = path;
      }

      const portfolioUrls: string[] = [];
      for (let i = 0; i < portfolioFiles.length; i++) {
        const f = portfolioFiles[i];
        const path = `${user.id}/${Date.now()}_p${i}.${f.name.split(".").pop() || "jpg"}`;
        const { error: upErr } = await supabase.storage.from("portfolios").upload(path, f, { upsert: false });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("portfolios").getPublicUrl(path);
        portfolioUrls.push(urlData.publicUrl);
      }

      const res = await fetch("/api/worker/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          avatar_url: avatarUrl,
          skills,
          experience_level: experienceLevel || null,
          rate_min: rateMin ? parseInt(rateMin, 10) : null,
          rate_max: rateMax ? parseInt(rateMax, 10) : null,
          bio: bio.trim() || null,
          service_lat: serviceArea?.lat ?? null,
          service_lng: serviceArea?.lng ?? null,
          service_radius_km: serviceArea?.radius_km ?? 10,
          valid_id_url: validIdUrl,
          portfolio_urls: portfolioUrls,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save.");
      router.push(data.redirect || "/worker/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <main className="min-h-screen page-bg pt-6">
        <PageContainer>
          <p className="text-text-secondary font-body">Loading...</p>
        </PageContainer>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen page-bg pt-6 flex flex-col items-center justify-center">
        <PageContainer>
          <div className="card-kumpuni max-w-md mx-auto p-8 text-center space-y-4">
            <h1 className="font-display text-2xl font-extrabold text-text-primary tracking-tight">Worker Setup</h1>
            <p className="text-body text-text-secondary">
              Mag-log in muna upang ma-kumpleto ang iyong profile.
            </p>
            <Link
              href="/login?role=worker&next=/worker/setup"
              className="btn-primary w-full justify-center mt-4"
            >
              MAG-LOG IN
            </Link>
          </div>
        </PageContainer>
      </main>
    );
  }

  return (
    <main className="min-h-screen page-bg pt-8 pb-16">
      <PageContainer>
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-3xl font-extrabold text-text-primary mb-2 tracking-tight">
            I-setup ang iyong Profile
          </h1>
          <p className="text-text-secondary text-lg mb-8">Kumpletuhin ang mga detalye para makapagsimula nang tumanggap ng trabaho.</p>
          
          <form onSubmit={handleSubmit} className="card-kumpuni p-8 space-y-8 border-t-4 border-t-kumpuni-blue shadow-md">
            
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-text-primary">Display Name <span className="text-danger-red">*</span></label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                required
                placeholder="Buong pangalan o palayaw"
                className="input-kumpuni"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-text-primary">Larawan ng Profile <span className="text-danger-red">*</span></label>
              <div className="flex items-center gap-4">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="h-20 w-20 rounded-full object-cover border-4 border-surface-light shadow-sm" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-blue-50 text-kumpuni-blue flex items-center justify-center border-4 border-surface-light shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-kumpuni-blue hover:file:bg-blue-100 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-text-primary">Skills <span className="text-danger-red">*</span> <span className="text-xs text-text-tertiary font-normal">(piliin lahat ng akma)</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SKILLS.map((s) => (
                  <label key={s.value} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${skills.includes(s.value) ? "border-kumpuni-blue bg-blue-50" : "border-subtle hover:border-kumpuni-blue/30"}`}>
                    <input
                      type="checkbox"
                      checked={skills.includes(s.value)}
                      onChange={() => toggleSkill(s.value)}
                      className="rounded text-kumpuni-blue focus:ring-kumpuni-blue border-subtle w-4 h-4"
                    />
                    <span className="text-sm font-semibold text-text-primary">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-text-primary">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="input-kumpuni"
                >
                  <option value="">Pumili...</option>
                  {EXPERIENCE_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-text-primary">Arawang Rate (₱)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={rateMin}
                    onChange={(e) => setRateMin(e.target.value)}
                    placeholder="Min (e.g. 500)"
                    className="input-kumpuni w-full"
                  />
                  <span className="text-text-tertiary font-medium">-</span>
                  <input
                    type="number"
                    min={0}
                    value={rateMax}
                    onChange={(e) => setRateMax(e.target.value)}
                    placeholder="Max (e.g. 1500)"
                    className="input-kumpuni w-full"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-text-primary">Lugar / Service Area <span className="text-danger-red">*</span></label>
              <div className="p-4 border border-subtle rounded-xl bg-surface-light">
                 <ServiceAreaPicker
                   value={serviceArea}
                   onChange={setServiceArea}
                 />
                 {!serviceArea && (
                   <p className="text-xs font-medium text-warning-dark mt-2 flex items-center gap-1.5">
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                     Kailangan i-set ang iyong location para makita ng mga homeowner.
                   </p>
                 )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-text-primary block">Government ID <span className="text-xs text-text-tertiary font-normal">(Para sa verification)</span> <span className="text-danger-red">*</span></label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleIdChange}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-text-primary hover:file:bg-gray-200 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-text-primary flex justify-between">
                <span>Maikling Bio <span className="text-xs text-text-tertiary font-normal">(Opsyonal)</span></span>
                <span className="text-xs font-normal text-text-tertiary">{bio.length}/200</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="Ipakilala ang iyong sarili at mga karanasan bilang kumpunero..."
                className="input-kumpuni resize-y"
              />
            </div>

            <div className="space-y-1.5 border-t border-subtle pt-6">
              <label className="text-sm font-bold text-text-primary block">Portfolio <span className="text-xs text-text-tertiary font-normal">(Opsyonal, max 6 litrato ng iyong mga gawa)</span></label>
               <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePortfolioChange}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-text-primary hover:file:bg-gray-200 transition-colors mb-2"
              />
              {portfolioPreviews.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {portfolioPreviews.map((url, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden shadow-sm border border-subtle">
                       <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-danger-light border border-danger-red/20 rounded-xl flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger-red shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="text-sm font-bold text-danger-red">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || skills.length === 0 || !serviceArea || !displayName || !avatarFile}
              className="btn-primary w-full py-4 text-lg shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {submitting ? (
                 <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Sine-save...
                 </span>
              ) : "I-SAVE ANG PROFILE"}
            </button>
          </form>
        </div>
      </PageContainer>
    </main>
  );
}
