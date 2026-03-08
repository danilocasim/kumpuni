import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import webpush from "web-push";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const { worker_user_id, job_id } = body ?? {};
    if (!worker_user_id || !job_id) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify this review actually exists
    const { data: review } = await admin
      .from("reviews")
      .select("id")
      .eq("job_id", job_id)
      .eq("reviewer_id", user.id)
      .eq("reviewee_id", worker_user_id)
      .maybeSingle();

    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    // Get worker push subscription
    const { data: profile } = await admin
      .from("worker_profiles")
      .select("push_subscription")
      .eq("user_id", worker_user_id)
      .single();

    if (!profile?.push_subscription) {
      return NextResponse.json({ ok: true, pushed: false });
    }

    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    if (!vapidPublic || !vapidPrivate) {
      return NextResponse.json({ ok: true, pushed: false });
    }

    webpush.setVapidDetails(
      "mailto:support@kumpuni.example.com",
      vapidPublic,
      vapidPrivate
    );

    await webpush.sendNotification(
      profile.push_subscription as unknown as webpush.PushSubscription,
      JSON.stringify({
        title: "May bagong review ka!",
        body: "Isang homeowner ang nag-iwan ng review sa trabaho mo.",
        url: `/worker/jobs/${job_id}`,
      }),
      { TTL: 60 }
    );

    return NextResponse.json({ ok: true, pushed: true });
  } catch (err) {
    console.error("Review notify push error:", err);
    return NextResponse.json({ ok: true, pushed: false });
  }
}
