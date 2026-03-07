"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams?.get("role") ?? "";
  const nextParam = searchParams?.get("next") ?? "";

  const [role, setRole] = useState<"homeowner" | "worker" | "">(
    initialRole === "worker" ? "worker" : initialRole === "homeowner" ? "homeowner" : ""
  );
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"role" | "phone" | "code">(initialRole ? "phone" : "role");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devHint, setDevHint] = useState("");

  const nextPath = nextParam || (role === "worker" ? "/worker/setup" : "/jobs/new");

  function selectRole(r: "homeowner" | "worker") {
    setRole(r);
    setStep("phone");
    setError("");
  }

  async function handleSendOtp() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Hindi na-send ang code. Subukan ulit.");
        return;
      }
      setDevHint(data.devHint ?? "");
      setStep("code");
    } catch {
      setError("May nangyaring mali. Subukan ulit.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          token: token.trim(),
          role: role || "homeowner",
          next: nextPath,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code. Subukan ulit.");
        return;
      }
      router.push(data.redirect || nextPath);
      router.refresh();
    } catch {
      setError("May nangyaring mali. Subukan ulit.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center page-bg py-8">
      <PageContainer>
        <div className="w-full max-w-[440px] mx-auto">

          {/* Step 1: Role Selection */}
          {step === "role" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="text-center space-y-2">
                <h1 className="font-display text-3xl font-extrabold text-text-primary tracking-tight">
                  Maligayang pagdating!
                </h1>
                <p className="text-base text-text-secondary font-body leading-relaxed">
                  Ikaw ba ay naghahanap ng kumpunero, o ikaw mismo ang kumpunero?
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Homeowner Card */}
                <button
                  type="button"
                  onClick={() => selectRole("homeowner")}
                  className="card-kumpuni p-6 text-left group hover:border-kumpuni-blue hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-kumpuni-blue/10 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-kumpuni-blue"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-extrabold text-text-primary mb-1">
                        Magpa-kumpuni
                      </h2>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        May kailangang ayusin sa bahay? Mag-post ng trabaho at humanap ng kumpunero.
                      </p>
                    </div>
                    <div className="mt-2 text-text-tertiary group-hover:text-kumpuni-blue transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  </div>
                </button>

                {/* Worker Card */}
                <button
                  type="button"
                  onClick={() => selectRole("worker")}
                  className="card-kumpuni p-6 text-left group hover:border-action-orange hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 group-hover:bg-action-orange/10 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-action-orange"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-extrabold text-text-primary mb-1">
                        Maging Kumpunero
                      </h2>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        Plumber, electrician, o karpintero ka? Tumanggap ng trabaho at kumita.
                      </p>
                    </div>
                    <div className="mt-2 text-text-tertiary group-hover:text-action-orange transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  </div>
                </button>
              </div>

              <Link href="/" className="btn-ghost block text-center text-sm text-text-tertiary">
                Bumalik sa home
              </Link>
            </div>
          )}

          {/* Step 2: Phone Input */}
          {step === "phone" && (
            <div className="card-kumpuni p-6 sm:p-8 space-y-5 animate-in fade-in">
              <div className="text-center space-y-2">
                <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 ${role === "worker" ? "bg-orange-50" : "bg-blue-50"}`}>
                  {role === "worker" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-action-orange"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-kumpuni-blue"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  )}
                </div>
                <h1 className="font-display text-2xl font-extrabold text-text-primary tracking-tight">
                  {role === "worker" ? "Log in bilang Kumpunero" : "Log in bilang Homeowner"}
                </h1>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Ilagay ang iyong phone number. Padadalhan ka namin ng verification code.
                </p>
              </div>

              <div>
                <label htmlFor="phone" className="label-kumpuni text-sm font-bold text-text-primary mb-1.5 block">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-tertiary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+639XXXXXXXXX"
                    className="input-kumpuni pl-12"
                    aria-describedby="phone-hint"
                  />
                </div>
                <p id="phone-hint" className="text-xs text-text-tertiary mt-2">
                  Format: +63 followed by 10 digits (e.g. +639171234567)
                </p>
              </div>

              {error && (
                <div className="p-3 bg-danger-light text-danger-red rounded-xl text-sm font-medium border border-danger-red/20 flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading || !phone.trim()}
                className={`w-full py-3.5 font-bold text-base rounded-xl transition-all shadow-sm disabled:opacity-50 ${
                  role === "worker"
                    ? "bg-action-orange text-white hover:bg-orange-600"
                    : "btn-primary"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Sinasend...
                  </span>
                ) : "Magpadala ng Code"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("role"); setError(""); }}
                className="btn-ghost w-full text-sm text-text-tertiary"
              >
                Palitan ang role
              </button>
            </div>
          )}

          {/* Step 3: OTP Verification */}
          {step === "code" && (
            <div className="card-kumpuni p-6 sm:p-8 space-y-5 animate-in fade-in">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-green-50 mx-auto flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success-green"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <h1 className="font-display text-2xl font-extrabold text-text-primary tracking-tight">
                  Ilagay ang Code
                </h1>
                <p className="text-sm text-text-secondary">
                  Na-send na sa <span className="font-bold text-text-primary">{phone}</span>
                </p>
              </div>

              {devHint && (
                <div className="p-3 bg-warning-light border border-warning rounded-xl text-sm text-text-primary font-medium">
                  {devHint}
                </div>
              )}

              <div>
                <label htmlFor="token" className="label-kumpuni text-sm font-bold text-text-primary mb-1.5 block">
                  6-Digit Code
                </label>
                <input
                  id="token"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="000000"
                  className="input-kumpuni text-center text-2xl tracking-[0.5em] font-mono"
                />
              </div>

              {error && (
                <div className="p-3 bg-danger-light text-danger-red rounded-xl text-sm font-medium border border-danger-red/20 flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleVerify}
                disabled={loading || token.trim().length < 6}
                className={`w-full py-3.5 font-bold text-base rounded-xl transition-all shadow-sm disabled:opacity-50 ${
                  role === "worker"
                    ? "bg-action-orange text-white hover:bg-orange-600"
                    : "btn-primary"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Chine-check...
                  </span>
                ) : "I-verify"}
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setStep("phone"); setToken(""); setError(""); }}
                  className="btn-ghost flex-1 text-sm text-text-tertiary"
                >
                  Ibang number
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="btn-ghost flex-1 text-sm text-kumpuni-blue font-semibold disabled:opacity-50"
                >
                  I-resend ang code
                </button>
              </div>
            </div>
          )}

        </div>
      </PageContainer>
    </main>
  );
}
