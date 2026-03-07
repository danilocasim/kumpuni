import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_ATTEMPTS = 3;
// In development, use 1-minute window so you can retry quickly (no brute-force of codes; still need valid OTP)
const WINDOW_MINUTES =
  process.env.NODE_ENV === "development" ? 1 : 15;

/** Dev-only: fixed OTP so no real SMS is sent. Use code 123456 to sign in. */
const DEV_OTP_CODE = "123456";
const IS_DEV_OTP_BYPASS = process.env.NODE_ENV === "development";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = body?.phone?.trim();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Kailangan ang numero ng telepono. Subukan muli." },
        { status: 400 }
      );
    }

    // Normalize to E.164: 09xxxxxxxxx -> +639xxxxxxxxx, 63... -> +63...
    let normalized = phone.replace(/\s/g, "");
    if (/^0\d{10}$/.test(normalized)) {
      normalized = "+63" + normalized.slice(1);
    } else if (/^\d{10}$/.test(normalized) && normalized.startsWith("9")) {
      normalized = "+63" + normalized;
    } else if (!normalized.startsWith("+")) {
      normalized = "+" + normalized;
    }

    const admin = createAdminClient();

    const { count, error: countError } = await admin
      .from("otp_send_attempts")
      .select("*", { count: "exact", head: true })
      .eq("phone", normalized)
      .gte("created_at", new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString());

    if (countError) {
      console.error("OTP rate limit check failed:", countError);
      return NextResponse.json(
        { error: "May problema sa server. Subukan muli." },
        { status: 500 }
      );
    }

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      return NextResponse.json(
        {
          error: "Sobra na ang pagsubok. Maghintay ng 15 minuto bago muling magpadala. Subukan muli.",
        },
        { status: 429 }
      );
    }

    // Dev bypass: no real SMS; user can use code 123456 in verify step
    if (IS_DEV_OTP_BYPASS) {
      await admin.from("otp_send_attempts").insert({ phone: normalized });
      return NextResponse.json({
        ok: true,
        devHint: `Gamitin ang code ${DEV_OTP_CODE} para mag-log in (dev only).`,
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: normalized,
    });

    if (otpError) {
      console.error("Supabase signInWithOtp failed:", otpError.message);
      return NextResponse.json(
        {
          error: "Hindi mapadala ang verification code. Subukan muli.",
        },
        { status: 502 }
      );
    }

    await admin.from("otp_send_attempts").insert({ phone: normalized });

    if (process.env.NODE_ENV === "development") {
      console.log("[OTP] Request sent to Supabase for:", normalized);
      console.log("[OTP] If you don't receive SMS: 1) Supabase Dashboard → Authentication → Providers → Phone → Enable and add Twilio SID, Auth Token, Twilio Phone Number. 2) Twilio trial: add this number to Verified Caller IDs. https://supabase.com/docs/guides/auth/phone-login");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("OTP send error:", err);
    return NextResponse.json(
      { error: "May nangyaring error. Subukan muli." },
      { status: 500 }
    );
  }
}
