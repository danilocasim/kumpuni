import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import twilio from "twilio";

/**
 * Cron: run at 8:00 AM and 2:00 PM PHT (UTC+8).
 * Sends SMS digest to workers with new/relevant Flexible jobs (skills + area).
 * Vercel cron: 0 0,6 * * * (00:00 UTC = 8:00 PHT, 06:00 UTC = 14:00 PHT).
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json(
      { error: "Twilio not configured; skip digest." },
      { status: 200 }
    );
  }

  const admin = createAdminClient();
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const { data: recipients, error } = await admin.rpc("get_sms_digest_recipients", {
    p_since: since,
  });

  if (error) {
    console.error("SMS digest get_sms_digest_recipients error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (recipients ?? []) as Array<{ worker_user_id: string; phone: string; job_count: number }>;
  if (!list.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const client = twilio(accountSid, authToken);
  let sent = 0;
  const errors: string[] = [];

  for (const r of list) {
    try {
      const msg =
        r.job_count === 1
          ? "Kumpuni: May 1 bagong job na match sa iyo. Mag-log in para tingnan."
          : `Kumpuni: May ${r.job_count} bagong jobs na match sa iyo. Mag-log in para tingnan.`;
      await client.messages.create({
        body: msg,
        from: fromNumber,
        to: r.phone,
      });
      sent++;
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      errors.push(`${r.worker_user_id}: ${err}`);
    }
  }

  if (errors.length) console.warn("SMS digest partial errors:", errors);
  return NextResponse.json({ ok: true, sent, total: list.length, errors: errors.slice(0, 5) });
}
