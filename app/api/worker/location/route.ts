import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET: Return worker's current location (lat/lng) or null.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Kailangan mag-log in." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .rpc("get_worker_current_location", { p_user_id: user.id });

    if (error) {
      console.error("Worker location fetch error:", error);
      return NextResponse.json({ lat: null, lng: null });
    }

    const row = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({
      lat: row?.lat ?? null,
      lng: row?.lng ?? null,
    });
  } catch (err) {
    console.error("Worker location GET error:", err);
    return NextResponse.json({ lat: null, lng: null });
  }
}

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

    return NextResponse.json({ ok: true, lat, lng });
  } catch (err) {
    console.error("Worker location API error:", err);
    return NextResponse.json(
      { error: "May nangyaring error. Subukan muli." },
      { status: 500 }
    );
  }
}
