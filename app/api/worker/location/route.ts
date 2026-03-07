import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST: Worker updates their current location (for map display).
 * Body: { lat: number, lng: number }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Kailangan mag-log in." }, { status: 401 });
    }

    const body = await request.json();
    const lat = typeof body?.lat === "number" ? body.lat : null;
    const lng = typeof body?.lng === "number" ? body.lng : null;

    if (lat == null || lng == null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: "Kailangan ang valid na lat at lng." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin.rpc("set_worker_current_location", {
      p_user_id: user.id,
      p_lng: lng,
      p_lat: lat,
    });

    if (error) {
      console.error("Worker location update error:", error);
      return NextResponse.json(
        { error: "Hindi masave ang lokasyon. May worker profile ka na?" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Worker location API error:", err);
    return NextResponse.json(
      { error: "May nangyaring error. Subukan muli." },
      { status: 500 }
    );
  }
}
