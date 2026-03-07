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
      return NextResponse.json({ error: "Kailangan mag-log in." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: job, error: jobErr } = await admin
      .from("jobs")
      .select("id, homeowner_id")
      .eq("id", id)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: "Job hindi mahanap." }, { status: 404 });
    }
    if (job.homeowner_id !== user.id) {
      return NextResponse.json({ error: "Walang permiso." }, { status: 403 });
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
        { error: "Hindi ma-load ang listahan ng workers." },
        { status: 500 }
      );
    }

    const list = (workers ?? []) as Array<Record<string, unknown>>;
    const normalized = list.map((w) => ({
      ...w,
      service_lat: typeof w.service_lat === "number" ? w.service_lat : parseFloat(String(w.service_lat ?? NaN)),
      service_lng: typeof w.service_lng === "number" ? w.service_lng : parseFloat(String(w.service_lng ?? NaN)),
    }));
    return NextResponse.json({ workers: normalized });
  } catch (err) {
    console.error("Browse API error:", err);
    return NextResponse.json(
      { error: "May nangyaring error. Subukan muli." },
      { status: 500 }
    );
  }
}
