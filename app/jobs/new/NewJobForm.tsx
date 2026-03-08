"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LocationPicker, type LocationValue } from "@/components/LocationPicker";
import imageCompression from "browser-image-compression";

const CATEGORIES = [
  { value: "plumbing", label: "Plumbing (Tubero)", icon: "🔧" },
  { value: "electrical", label: "Electrical (Elektrisyan)", icon: "⚡" },
  { value: "carpentry", label: "Carpentry (Karpintero)", icon: "🪚" },
  { value: "painting", label: "Painting (Pintor)", icon: "🎨" },
  { value: "masonry", label: "Masonry (Mason)", icon: "🧱" },
  { value: "general", label: "General Repair (Iba pa)", icon: "🛠️" },
];

const URGENCY_OPTIONS = [
  { value: "asap", label: "Ngayon Din / ASAP", sub: "Fast match — mai-alerto agad ang mga kumpunero" },
  { value: "this_week", label: "Ngayong Linggo", sub: "Pumili ka ng kumpunero sa listahan" },
  { value: "flexible", label: "Kahit Kailan", sub: "Walang rush, maghanap ng pinaka-magaling" },
];

type AIAnalysis = {
  category: string;
  title: string;
  description: string;
  urgency: string;
  estimatedCost: { min: number; max: number };
  confidence: number;
};

type Step = "capture" | "analyzing" | "review" | "location" | "submitting";

export default function NewJobForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [userNote, setUserNote] = useState("");

  // AI analysis state
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Editable fields (populated by AI, tweakable by user)
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("this_week");

  // Location & submit
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Flow step
  const [step, setStep] = useState<Step>("capture");

  // ─── Photo Capture ────────────────────────────────────────
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.15,
        maxWidthOrHeight: 640,
        useWebWorker: true,
      });
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPhotoPreview(dataUrl);
        setPhotoFile(compressed);
      };
      reader.readAsDataURL(compressed);
    } catch {
      setAnalyzeError("Hindi ma-process ang litrato. Subukan ulit.");
    }
    e.target.value = "";
  }, []);

  // ─── AI Analysis ──────────────────────────────────────────
  const [analyzeDisabled, setAnalyzeDisabled] = useState(false);
  async function analyzePhoto(imageBase64: string, note: string) {
    if (analyzeDisabled) return;
    setStep("analyzing");
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/jobs/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64, note: note.trim() || undefined }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed.");

      setAnalysis(data);
      setCategory(data.category);
      setDescription(data.description);
      setUrgency(data.urgency);
      setStep("review");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Hindi ma-analyze. Subukan ulit.";
      setAnalyzeError(msg);
      setStep("capture");
      // Cooldown to avoid hitting rate limits with rapid retries
      setAnalyzeDisabled(true);
      setTimeout(() => setAnalyzeDisabled(false), 10_000);
    }
  }

  function retakePhoto() {
    setPhotoPreview(null);
    setPhotoFile(null);
    setAnalysis(null);
    setAnalyzeError(null);
    setUserNote("");
    setStep("capture");
  }

  // ─── Submit Job ───────────────────────────────────────────
  async function handleSubmit() {
    if (!location) {
      setSubmitError("Pumili muna ng lokasyon.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setStep("submitting");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?role=homeowner&next=/jobs/new");
        return;
      }

      // Upload photo
      const photoUrls: string[] = [];
      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}_0.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("jobs")
          .upload(path, photoFile, { upsert: false });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("jobs").getPublicUrl(path);
        photoUrls.push(urlData.publicUrl);
      }

      // Determine budget range string from AI estimate
      let budgetRange: string | null = null;
      if (analysis?.estimatedCost) {
        const { min, max } = analysis.estimatedCost;
        if (max <= 1000) budgetRange = "under_1k";
        else if (max <= 3000) budgetRange = "1k_3k";
        else if (max <= 5000) budgetRange = "3k_5k";
        else if (max <= 10000) budgetRange = "5k_10k";
        else budgetRange = "10k_plus";
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
          budget_range: budgetRange,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hindi masave ang job.");

      router.push(`/jobs/${data.id}/fast`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "May error. Subukan ulit.");
      setStep("location");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Format peso ──────────────────────────────────────────
  function formatPeso(n: number) {
    return `₱${n.toLocaleString("en-PH")}`;
  }

  const getCategoryLabel = (val: string) => CATEGORIES.find((c) => c.value === val)?.label ?? val;
  const getCategoryIcon = (val: string) => CATEGORIES.find((c) => c.value === val)?.icon ?? "🛠️";

  // ─── Step indicator ───────────────────────────────────────
  const stepLabels = ["Litrato", "Suriin", "Lokasyon", "I-post"];
  const stepIndex =
    step === "capture" ? 0 :
    step === "analyzing" ? 0 :
    step === "review" ? 1 :
    step === "location" ? 2 :
    3;

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-8">

      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
          Mag-post ng Trabaho
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Kunan ng litrato — ipa-analyze sa AI — i-post agad
        </p>
      </div>

      {/* Step Progress */}
      <div className="flex items-center justify-center gap-0 mb-8 px-4">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                ${i < stepIndex ? "bg-kumpuni-blue text-white" :
                  i === stepIndex ? "bg-white border-2 border-kumpuni-blue text-kumpuni-blue shadow-sm" :
                  "bg-gray-100 text-gray-400 border border-gray-200"}`}>
                {i < stepIndex ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-[11px] font-bold ${i <= stepIndex ? "text-kumpuni-blue" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < stepLabels.length - 1 && (
              <div className={`w-8 sm:w-12 h-[2px] mx-1 mb-5 transition-colors duration-300 ${i < stepIndex ? "bg-kumpuni-blue" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* ═══════════ STEP 1: Capture Photo ═══════════ */}
      {step === "capture" && (
        <div className="space-y-4">
          <div className="card-kumpuni p-6 sm:p-8 text-center space-y-5 border-t-4 border-t-kumpuni-blue shadow-md">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 mx-auto flex items-center justify-center shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-kumpuni-blue">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-text-primary mb-2 tracking-tight">
                Kunan ng Litrato ang Problema
              </h2>
              <p className="text-base text-text-secondary leading-relaxed max-w-sm mx-auto">
                I-photo ang sirang tubo, saksakan, dingding, o anumang kailangang kumpunihin. Ipa-analyze ng AI para mas mabilis ang pag-post.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={handleFileSelect}
              className="sr-only"
            />

            {!photoPreview ? (
              /* No photo yet — show camera button */
              <>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-primary flex-1 py-4 text-base flex items-center justify-center gap-2.5 shadow-xl hover:-translate-y-1 transition-transform"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                      <circle cx="12" cy="13" r="3"/>
                    </svg>
                    Kumuha o Pumili ng Litrato
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => { setStep("review"); setAnalysis(null); }}
                    className="btn-ghost text-sm font-bold text-text-tertiary hover:text-kumpuni-blue transition-colors"
                  >
                    O mag-type nang manu-mano →
                  </button>
                </div>
              </>
            ) : (
              /* Photo taken — show preview + optional note + analyze button */
              <>
                <div className="relative mx-auto w-full max-w-[280px] rounded-2xl overflow-hidden shadow-md border-2 border-kumpuni-blue/30">
                  <img src={photoPreview} alt="Preview" className="w-full aspect-[4/3] object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    aria-label="Remove photo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>

                <div className="text-left w-full">
                  <label htmlFor="userNote" className="text-sm font-bold text-text-primary mb-1.5 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-kumpuni-blue"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Idagdag ang detalye
                    <span className="font-normal text-text-tertiary text-xs">(opsyonal)</span>
                  </label>
                  <textarea
                    id="userNote"
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    maxLength={200}
                    rows={2}
                    placeholder='Hal: "Gusto kong magdagdag ng outlet sa pader na ito" o "Tumutulo lang kapag umuulan"'
                    className="input-kumpuni py-2.5 resize-none border-2 focus:border-kumpuni-blue text-sm"
                  />
                  <p className="text-xs text-text-tertiary mt-1">Makakatulong ito sa AI na mas maintindihan kung anong gusto mong gawin.</p>
                </div>

                <button
                  type="button"
                  onClick={() => analyzePhoto(photoPreview!, userNote)}
                  disabled={analyzeDisabled}
                  className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2.5 shadow-xl hover:-translate-y-1 transition-transform disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72z"/><path d="m14 7 3 3"/></svg>
                  I-analyze ng AI
                </button>
              </>
            )}
          </div>

          {analyzeError && (
            <div className="p-4 bg-danger-light border border-danger-red/20 rounded-xl flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger-red shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <p className="text-sm font-bold text-danger-red">{analyzeError}</p>
                <p className="text-xs text-text-secondary mt-1">Pwede mong subukang kumuha ulit ng litrato o mag-type nang manu-mano.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ STEP 1.5: Analyzing ═══════════ */}
      {step === "analyzing" && (
        <div className="card-kumpuni p-8 sm:p-10 text-center space-y-6">
          {photoPreview && (
            <div className="relative mx-auto w-full max-w-[240px] rounded-2xl overflow-hidden shadow-md border-2 border-kumpuni-blue/30">
              <img src={photoPreview} alt="Analyzing" className="w-full aspect-[4/3] object-cover" />
              <div className="absolute inset-0 bg-kumpuni-blue/10 backdrop-blur-[1px] flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <svg className="animate-spin h-8 w-8 text-kumpuni-blue" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>
              </div>
            </div>
          )}
          <div>
            <h2 className="text-xl font-extrabold text-text-primary mb-2">Ina-analyze ng AI...</h2>
            <p className="text-sm text-text-secondary">Tinitingnan ang litrato para malaman kung anong kailangan ayusin at magkano ang magiging gastos.</p>
          </div>
          <div className="flex justify-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-kumpuni-blue animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2.5 h-2.5 rounded-full bg-kumpuni-blue animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2.5 h-2.5 rounded-full bg-kumpuni-blue animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}

      {/* ═══════════ STEP 2: Review AI Analysis ═══════════ */}
      {step === "review" && (
        <div className="space-y-4">
          {/* AI Results Banner */}
          {analysis && (
            <div className="card-kumpuni border-kumpuni-blue/30 border-2 bg-gradient-to-br from-blue-50/80 to-white p-5 sm:p-6 space-y-4 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-kumpuni-blue/5">
                <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"/></svg>
              </div>
              <div className="flex items-center gap-2 text-kumpuni-blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72z"/><path d="m14 7 3 3"/></svg>
                <span className="text-sm font-extrabold uppercase tracking-widest">AI Analysis</span>
                {analysis.confidence >= 70 && (
                  <span className="ml-auto bg-green-100 text-success-green text-xs font-bold px-2 py-0.5 rounded-md">
                    {analysis.confidence}% confident
                  </span>
                )}
                {analysis.confidence < 70 && analysis.confidence >= 40 && (
                  <span className="ml-auto bg-orange-100 text-action-orange text-xs font-bold px-2 py-0.5 rounded-md">
                    {analysis.confidence}% confident
                  </span>
                )}
              </div>

              <div className="flex items-start gap-4">
                {photoPreview && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-subtle shadow-sm">
                    <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-extrabold text-text-primary leading-snug mb-1">
                    {analysis.title}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <span>{getCategoryIcon(analysis.category)}</span>
                    <span className="font-semibold">{getCategoryLabel(analysis.category)}</span>
                  </div>
                </div>
              </div>

              {/* Cost estimate */}
              <div className="bg-white rounded-xl p-4 border border-subtle flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success-green"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Estimated na Gastos</p>
                  <p className="text-xl font-extrabold text-text-primary">
                    {formatPeso(analysis.estimatedCost.min)} – {formatPeso(analysis.estimatedCost.max)}
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">Tantyang presyo lang — pag-uusapan pa sa kumpunero</p>
                </div>
              </div>
            </div>
          )}

          {/* Editable Form Fields */}
          <div className="card-kumpuni p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-text-primary">
                {analysis ? "I-review at i-edit kung kailangan" : "Isulat ang detalye"}
              </h3>
              {analysis && (
                <button type="button" onClick={retakePhoto} className="text-xs font-bold text-kumpuni-blue hover:underline">
                  Ibang litrato
                </button>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="text-sm font-bold text-text-primary mb-2 block">Kategorya</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`p-4 rounded-xl border-2 text-center transition-all duration-200 hover:-translate-y-1 ${
                      category === c.value
                        ? "border-kumpuni-blue bg-blue-50 shadow-md ring-2 ring-kumpuni-blue/20"
                        : "border-gray-100 bg-white hover:border-kumpuni-blue/30 hover:shadow-sm"
                    }`}
                  >
                    <span className="text-3xl block mb-2">{c.icon}</span>
                    <span className={`text-xs font-bold block ${category === c.value ? "text-kumpuni-blue" : "text-text-secondary"}`}>
                      {c.label.split(" (")[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="text-sm font-bold text-text-primary mb-1.5 flex justify-between">
                <span>Deskripsyon ng Problema</span>
                <span className="font-normal text-text-tertiary text-xs">{description.length}/500</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                required
                rows={3}
                placeholder="Ilarawan ang kailangang ayusin..."
                className="input-kumpuni py-3 resize-y border-2 focus:border-kumpuni-blue"
              />
            </div>

            {/* Urgency */}
            <div>
              <label className="text-sm font-bold text-text-primary mb-2 block">Kailan dapat gawin?</label>
              <div className="space-y-2">
                {URGENCY_OPTIONS.map((u) => (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => setUrgency(u.value)}
                    className={`w-full p-3.5 rounded-xl border-2 text-left transition-all duration-150 flex items-center gap-3 ${
                      urgency === u.value
                        ? "border-kumpuni-blue bg-blue-50/50"
                        : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      urgency === u.value ? "border-kumpuni-blue" : "border-gray-300"
                    }`}>
                      {urgency === u.value && <div className="w-2.5 h-2.5 rounded-full bg-kumpuni-blue" />}
                    </div>
                    <div>
                      <span className={`text-sm font-bold block ${urgency === u.value ? "text-kumpuni-blue" : "text-text-primary"}`}>{u.label}</span>
                      <span className="text-xs text-text-tertiary">{u.sub}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Next Step Button */}
          <button
            type="button"
            onClick={() => setStep("location")}
            disabled={!category || !description.trim()}
            className="btn-primary w-full py-4 text-base shadow-xl flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 mt-6"
          >
            Magpatuloy — Pumili ng Lokasyon
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
      )}

      {/* ═══════════ STEP 3: Location ═══════════ */}
      {(step === "location" || step === "submitting") && (
        <div className="space-y-4">
          {/* Summary banner */}
          <div className="card-kumpuni p-4 flex items-center gap-3 bg-surface-light">
            {photoPreview && (
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-subtle">
                <img src={photoPreview} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-primary truncate">
                {getCategoryIcon(category)} {getCategoryLabel(category)}
              </p>
              <p className="text-xs text-text-secondary truncate">{description.slice(0, 60)}...</p>
            </div>
            <button type="button" onClick={() => setStep("review")} className="text-xs font-bold text-kumpuni-blue hover:underline shrink-0">
              I-edit
            </button>
          </div>

          <div className="card-kumpuni p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-danger-red"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              <h3 className="text-base font-extrabold text-text-primary">Saan ang lokasyon ng trabaho?</h3>
            </div>
            <LocationPicker value={location} onChange={setLocation} />
          </div>

          {/* Cost Estimate Reminder */}
          {analysis?.estimatedCost && (
            <div className="card-kumpuni p-4 bg-green-50/50 border-success-green/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success-green"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">
                  Estimated: {formatPeso(analysis.estimatedCost.min)} – {formatPeso(analysis.estimatedCost.max)}
                </p>
                <p className="text-xs text-text-tertiary">Tantyahin lang — ang kumpunero ang magbibigay ng final na presyo</p>
              </div>
            </div>
          )}

          {submitError && (
            <div className="p-3 bg-danger-light border border-danger-red/20 rounded-xl flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger-red shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="text-sm font-bold text-danger-red">{submitError}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !location}
            className="btn-primary w-full py-4 text-base shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Sine-save...
              </span>
            ) : (
              <>
                I-POST ANG TRABAHO
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
