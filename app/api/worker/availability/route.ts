import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_AVAILABILITY = ["available_now", "this_week", "weekends", "open_anytime", "not_available"] as const;

/**
 * GET: Return current worker availability.
 * PATCH: Update worker_profiles.availability (body: { availability: string }).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Kailangan mag-log in." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("worker_profiles")
      .select("availability")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Worker availability GET error:", error);
      return NextResponse.json(
        { error: "Hindi ma-load ang availability. Subukan muli." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      availability: profile?.availability ?? "not_available",
    });
  } catch (err) {
    console.error("Worker availability API error:", err);
    return NextResponse.json(
      { error: "May nangyaring error. Subukan muli." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Kailangan mag-log in." }, { status: 401 });
    }

    const body = await request.json();
    const availability = body?.availability;
    if (
      typeof availability !== "string" ||
      !VALID_AVAILABILITY.includes(availability as (typeof VALID_AVAILABILITY)[number])
    ) {
      return NextResponse.json(
        { error: "Invalid availability. Pumili: available_now, this_week, weekends, open_anytime, not_available." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("worker_profiles")
      .update({ availability })
      .eq("user_id", user.id);

    if (error) {
      console.error("Worker availability update error:", error);
      return NextResponse.json(
        { error: "Hindi masave. May worker profile ka na?" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, availability });
  } catch (err) {
    console.error("Worker availability API error:", err);
    return NextResponse.json(
      { error: "May nangyaring error. Subukan muli." },
      { status: 500 }
    );
  }
}
