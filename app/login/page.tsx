"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams?.get("role") ?? "homeowner";
  const nextPath = searchParams?.get("next") ?? (role === "worker" ? "/worker/setup" : "/jobs/new");

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
        setError(data.error || "Could not send code. Try again.");
        return;
      }
      setDevHint(data.devHint ?? "");
      setStep("code");
    } catch {
      setError("Something went wrong. Try again.");
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
        setError(data.error || "Invalid code. Try again.");
        return;
      }
      router.push(data.redirect || nextPath);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center page-bg py-8">
      <PageContainer>
      <div className="w-full max-w-[400px] mx-auto space-y-4">
        <h1 className="font-heading text-headline-mobile font-bold text-slate-text text-center">
          Log in
        </h1>

        {step === "phone" ? (
          <>
            <label htmlFor="phone" className="label-kumpuni">
              Phone number
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
              Use a real number (E.164: +63 + 9 digits). For Twilio trial, verify the number in Twilio console first.
            </p>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Sending..." : "SEND CODE"}
            </button>
          </>
        ) : (
          <>
            <label htmlFor="token" className="label-kumpuni">
              Enter the code you received
            </label>
            {devHint && (
              <p className="text-caption text-slate-text bg-orange-light border border-action-orange/30 rounded-kumpuni-sm px-2 py-1.5 mb-2">
                {devHint}
              </p>
            )}
            <p className="text-caption text-muted-gray mb-2">
              No code? Check: (1) Supabase Dashboard → Auth → Providers → Phone — enabled with Twilio SID, Auth Token, and Twilio number. (2) Twilio trial: add your number to Verified Caller IDs in Twilio Console.
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
              {loading ? "Verifying..." : "VERIFY"}
            </button>
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="btn-ghost w-full text-caption"
            >
              Different number
            </button>
          </>
        )}

        {error && (
          <p className="text-caption text-danger-red text-center" role="alert">
            {error}
          </p>
        )}

        <Link href="/" className="btn-ghost block text-center text-caption">
          Back to home
        </Link>
      </div>
      </PageContainer>
    </main>
  );
}
