import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const minRating = request.nextUrl.searchParams.get("min_rating");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: job, error: jobErr } = await admin
      .from("jobs")
      .select("id, homeowner_id, location")
      .eq("id", id)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    if (job.homeowner_id !== user.id) {
      return NextResponse.json({ error: "Permission denied." }, { status: 403 });
    }

    // Parse job location for map (GeoJSON: [lng, lat] or WKT POINT(lng lat))
    let job_lat: number | null = null;
    let job_lng: number | null = null;
    const loc = job.location as { type?: string; coordinates?: [number, number] } | string | null;
    if (loc && typeof loc === "object" && loc.type === "Point" && Array.isArray(loc.coordinates)) {
      job_lng = loc.coordinates[0];
      job_lat = loc.coordinates[1];
    } else if (typeof loc === "string" && /POINT\s*\(/i.test(loc)) {
      const match = loc.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/);
      if (match) {
        job_lng = parseFloat(match[1]);
        job_lat = parseFloat(match[2]);
      }
    }

    const rating = minRating != null ? parseFloat(minRating) : 3.0;
    const safeRating = Number.isFinite(rating) && rating >= 0 && rating <= 5 ? rating : 3.0;

    const { data: workers, error } = await admin.rpc("get_flexible_match_workers", {
      p_job_id: id,
      p_min_rating: safeRating,
    });

    if (error) {
      console.error("get_flexible_match_workers RPC error:", error);
      return NextResponse.json(
        { error: "Could not load workers list." },
        { status: 500 }
      );
    }

    const list = (workers ?? []) as Array<Record<string, unknown>>;
    // Ensure each worker gets their own service_center coordinates (never job location)
    const normalized = list.map((w) => {
      const rawLat = w.service_lat;
      const rawLng = w.service_lng;
      const service_lat =
        typeof rawLat === "number" && Number.isFinite(rawLat)
          ? rawLat
          : parseFloat(String(rawLat ?? NaN));
      const service_lng =
        typeof rawLng === "number" && Number.isFinite(rawLng)
          ? rawLng
          : parseFloat(String(rawLng ?? NaN));
      return { ...w, service_lat, service_lng };
    });
    return NextResponse.json({
      workers: normalized,
      job_lat: job_lat != null && Number.isFinite(job_lat) ? job_lat : null,
      job_lng: job_lng != null && Number.isFinite(job_lng) ? job_lng : null,
    });
  } catch (err) {
    console.error("Browse API error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
