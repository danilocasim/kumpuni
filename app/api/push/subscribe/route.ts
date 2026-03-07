import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Kailangan mag-log in." }, { status: 401 });
    }

    const body = await request.json();
    const subscription = body?.subscription;
    if (!subscription || typeof subscription !== "object" || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription. Subukan muli." },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("worker_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Worker profile lang ang pwedeng mag-enable ng push." },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("worker_profiles")
      .update({ push_subscription: subscription })
      .eq("user_id", user.id);

    if (error) {
      console.error("Push subscribe update error:", error);
      return NextResponse.json(
        { error: "May nangyaring error. Subukan muli." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return NextResponse.json(
      { error: "May nangyaring error. Subukan muli." },
      { status: 500 }
    );
  }
}
