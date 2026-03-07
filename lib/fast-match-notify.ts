/**
 * T025: Notify eligible workers when an ASAP (Fast Match) job is created.
 * Calls get_fast_match_workers RPC, then sends SMS (Twilio) and Web Push per worker.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import twilio from "twilio";
import webpush from "web-push";

export type FastMatchNotifyPayload = {
  jobId: string;
  category: string;
  barangay: string;
  budgetRange: string | null;
};

export async function notifyFastMatchWorkers(
  payload: FastMatchNotifyPayload
): Promise<{ notified: number; errors: string[] }> {
  const admin = createAdminClient();
  const { data: workers, error } = await admin.rpc("get_fast_match_workers", {
    p_job_id: payload.jobId,
  });

  if (error) {
    console.error("get_fast_match_workers RPC error:", error);
    return { notified: 0, errors: [error.message] };
  }

  const list = (workers ?? []) as Array<{
    worker_user_id: string;
    phone: string | null;
    push_subscription: Record<string, unknown> | null;
  }>;
  const errors: string[] = [];
  let notified = 0;

  const msg = `Kumpuni: Bagong job (${payload.category}) sa ${payload.barangay}${payload.budgetRange ? `, ${payload.budgetRange}` : ""}. Mag-log in para mag-express ng interest.`;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  const hasTwilio = accountSid && authToken && fromNumber;

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (vapidPublic && vapidPrivate) {
    webpush.setVapidDetails(
      "mailto:support@kumpuni.example.com",
      vapidPublic,
      vapidPrivate
    );
  }

  for (const w of list) {
    let workerNotified = false;
    if (w.phone && hasTwilio) {
      try {
        const client = twilio(accountSid, authToken);
        await client.messages.create({
          body: msg,
          from: fromNumber,
          to: w.phone.startsWith("+") ? w.phone : `+${w.phone}`,
        });
        workerNotified = true;
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        errors.push(`SMS ${w.worker_user_id}: ${err}`);
      }
    }
    if (w.push_subscription && vapidPublic && vapidPrivate) {
      try {
        await webpush.sendNotification(
          w.push_subscription as unknown as webpush.PushSubscription,
          JSON.stringify({
            title: "Bagong Fast Match job",
            body: `${payload.category} sa ${payload.barangay}`,
            url: `/worker/jobs/${payload.jobId}`,
          }),
          { TTL: 60 }
        );
        workerNotified = true;
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        errors.push(`Push ${w.worker_user_id}: ${err}`);
      }
    }
    if (workerNotified) notified++;
  }

  return { notified, errors };
}
