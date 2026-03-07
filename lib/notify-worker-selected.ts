import { createAdminClient } from "@/lib/supabase/admin";
import twilio from "twilio";
import webpush from "web-push";

export async function notifyWorkerSelected(
  workerUserId: string,
  jobId: string,
  category: string,
  barangay: string
): Promise<void> {
  const admin = createAdminClient();
  const { data: user } = await admin
    .from("users")
    .select("phone")
    .eq("id", workerUserId)
    .single();
  const { data: profile } = await admin
    .from("worker_profiles")
    .select("push_subscription")
    .eq("user_id", workerUserId)
    .single();

  const msg = `Kumpuni: Napili ka para sa job (${category}) sa ${barangay}. Mag-log in para makita ang contact at address.`;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (user?.phone && accountSid && authToken && fromNumber) {
    try {
      const client = twilio(accountSid, authToken);
      await client.messages.create({
        body: msg,
        from: fromNumber,
        to: user.phone.startsWith("+") ? user.phone : `+${user.phone}`,
      });
    } catch (e) {
      console.warn("Notify worker SMS failed:", e);
    }
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (
    profile?.push_subscription &&
    vapidPublic &&
    vapidPrivate
  ) {
    try {
      webpush.setVapidDetails(
        "mailto:support@kumpuni.example.com",
        vapidPublic,
        vapidPrivate
      );
      await webpush.sendNotification(
        profile.push_subscription as unknown as webpush.PushSubscription,
        JSON.stringify({
          title: "Napili ka para sa job",
          body: `${category} sa ${barangay}`,
          url: `/worker/jobs/${jobId}`,
        }),
        { TTL: 60 }
      );
    } catch (e) {
      console.warn("Notify worker push failed:", e);
    }
  }
}
