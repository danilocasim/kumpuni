"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") ?? "homeowner";
  const nextPath = searchParams.get("next") ?? (role === "worker" ? "/worker/setup" : "/jobs/new");

  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devHint, setDevHint] = useState("");

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
        setError(data.error || "Hindi mapadala. Subukan muli.");
        return;
      }
      setDevHint(data.devHint ?? "");
      setStep("code");
    } catch {
      setError("May nangyaring error. Subukan muli.");
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
          role: role === "worker" ? "worker" : "homeowner",
          next: nextPath,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code. Subukan muli.");
        return;
      }
      router.push(data.redirect || nextPath);
      router.refresh();
    } catch {
      setError("May nangyaring error. Subukan muli.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-4 flex flex-col items-center justify-center page-bg">
      <div className="w-full max-w-[480px] space-y-4">
        <h1 className="font-heading text-headline-mobile font-bold text-slate-text text-center">
          Mag-log in
        </h1>

        {step === "phone" ? (
          <>
            <label htmlFor="phone" className="label-kumpuni">
              Numero ng telepono
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-kumpuni"
              aria-describedby="phone-hint"
            />
            <p id="phone-hint" className="text-caption text-muted-gray">
              Gamitin ang tunay na numero (E.164: +63 + 9 digits). Para sa Twilio trial, i-verify muna ang numero sa Twilio console.
            </p>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Nagpapadala..." : "PADALHAN NG CODE"}
            </button>
          </>
        ) : (
          <>
            <label htmlFor="token" className="label-kumpuni">
              Ilagay ang code na na-receive mo
            </label>
            {devHint && (
              <p className="text-caption text-slate-text bg-orange-light border border-action-orange/30 rounded-kumpuni-sm px-2 py-1.5 mb-2">
                {devHint}
              </p>
            )}
            <p className="text-caption text-muted-gray mb-2">
              Walang na-receive? I-check: (1) Supabase Dashboard → Auth → Providers → Phone — naka-enable at may Twilio SID, Auth Token, at Twilio number. (2) Twilio trial: idagdag ang numero mo sa Verified Caller IDs sa Twilio Console.
            </p>
            <input
              id="token"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="input-kumpuni"
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Sinusuri..." : "I-VERIFY"}
            </button>
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="btn-ghost w-full text-caption"
            >
              Ibang numero
            </button>
          </>
        )}

        {error && (
          <p className="text-caption text-danger-red text-center" role="alert">
            {error}
          </p>
        )}

        <Link href="/" className="btn-ghost block text-center text-caption">
          Bumalik sa home
        </Link>
      </div>
    </main>
  );
}
