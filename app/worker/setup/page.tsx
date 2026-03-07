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
      <main className="min-h-screen page-bg pt-6">
        <PageContainer>
          <h1 className="font-display text-2xl font-bold text-text-primary mb-4">Worker setup</h1>
          <p className="text-body text-text-secondary mb-4">
            Log in first to complete your profile. OTP only.
          </p>
          <Link
            href="/login?role=worker&next=/worker/setup"
            className="btn-primary inline-flex justify-center"
          >
            MAG-LOG IN
          </Link>
        </PageContainer>
      </main>
    );
  }

  return (
    <main className="min-h-screen page-bg pt-6 pb-12">
      <PageContainer>
      <h1 className="font-display text-2xl lg:text-[28px] font-bold text-text-primary mb-4 tracking-tight" style={{ letterSpacing: "-0.3px" }}>
        Setup ng worker profile
      </h1>
      <form onSubmit={handleSubmit} className="card-kumpuni p-6 space-y-6">
        <div>
          <label className="label-kumpuni mb-1">Display name *</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            required
            placeholder="Pangalan o palayaw"
            className="input-kumpuni"
          />
        </div>

        <div>
          <label className="label-kumpuni mb-1">Larawan ng profile *</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="w-full text-sm"
          />
          {avatarPreview && (
            <img src={avatarPreview} alt="" className="mt-2 h-24 w-24 rounded-full object-cover" />
          )}
        </div>

        <div>
          <label className="label-kumpuni mb-1">Skills * (pili lahat na apply)</label>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((s) => (
              <label key={s.value} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={skills.includes(s.value)}
                  onChange={() => toggleSkill(s.value)}
                  className="rounded"
                />
                <span className="text-sm">{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="label-kumpuni mb-1">Experience level</label>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="input-kumpuni"
          >
            <option value="">Select...</option>
            {EXPERIENCE_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label-kumpuni mb-1">Rate min (₱/day)</label>
            <input
              type="number"
              min={0}
              value={rateMin}
              onChange={(e) => setRateMin(e.target.value)}
              placeholder="e.g. 500"
              className="input-kumpuni"
            />
          </div>
          <div>
            <label className="label-kumpuni mb-1">Rate max (₱/day)</label>
            <input
              type="number"
              min={0}
              value={rateMax}
              onChange={(e) => setRateMax(e.target.value)}
              placeholder="e.g. 1500"
              className="input-kumpuni"
            />
          </div>
        </div>

        <div>
          <label className="label-kumpuni mb-1">Service area *</label>
          <ServiceAreaPicker
            value={serviceArea}
            onChange={setServiceArea}
          />
          {!serviceArea && (
            <p className="text-caption text-warning mt-1">Set your center and radius to appear in browse.</p>
          )}
        </div>

        <div>
          <label className="label-kumpuni mb-1">Government ID (for verification) *</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleIdChange}
            className="w-full text-sm"
          />
        </div>

        <div>
          <label className="label-kumpuni mb-1">Bio (optional, max 200)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="Maikling intro..."
            className="input-kumpuni py-3"
          />
          <p className="text-caption text-text-tertiary">{bio.length}/200</p>
        </div>

        <div>
          <label className="label-kumpuni mb-1">Portfolio (optional, max 6 photos)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePortfolioChange}
            className="w-full text-sm"
          />
          {portfolioPreviews.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {portfolioPreviews.map((url, i) => (
                <img key={i} src={url} alt="" className="h-16 w-16 object-cover rounded" />
              ))}
            </div>
          )}
          <p className="text-caption text-text-tertiary">{portfolioFiles.length}/6</p>
        </div>

        {error && <p className="text-caption text-danger-red">{error}</p>}

        <button
          type="submit"
          disabled={submitting || skills.length === 0 || !serviceArea}
          className="btn-primary w-full disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save profile"}
        </button>
      </form>
      </PageContainer>
    </main>
  );
}
