import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Kailangan mag-log in." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: job, error: jobErr } = await admin
      .from("jobs")
      .select("id, homeowner_id, fast_match_expires_at, status, matching_mode, location")
      .eq("id", id)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: "Job hindi mahanap." }, { status: 404 });
    }
    if (job.homeowner_id !== user.id) {
      return NextResponse.json({ error: "Walang permiso." }, { status: 403 });
    }

    const { data: workers, error } = await admin.rpc("get_interested_workers", {
      p_job_id: id,
    });

    if (error) {
      console.error("get_interested_workers RPC error:", error);
      return NextResponse.json(
        { error: "Hindi ma-load ang listahan." },
        { status: 500 }
      );
    }

    // parse location "POINT(lng lat)"
    let lat = null;
    let lng = null;
    if (job.location) {
      const match = job.location.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
      if (match) {
        lng = parseFloat(match[1]);
        lat = parseFloat(match[2]);
      }
    }

    return NextResponse.json({
      job: {
        id: job.id,
        fast_match_expires_at: job.fast_match_expires_at,
        status: job.status,
        matching_mode: job.matching_mode,
        lat,
        lng,
      },
      workers: workers ?? [],
    });
  } catch (err) {
    console.error("Interests API error:", err);
    return NextResponse.json(
      { error: "May nangyaring error. Subukan muli." },
      { status: 500 }
    );
  }
}
