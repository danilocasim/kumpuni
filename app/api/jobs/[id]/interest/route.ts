import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
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
      .select("id, status, matching_mode, fast_match_expires_at")
      .eq("id", id)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: "Job hindi mahanap." }, { status: 404 });
    }
    if (job.status !== "open") {
      return NextResponse.json(
        { error: "Hindi na open ang job na ito." },
        { status: 400 }
      );
    }
    if (job.matching_mode !== "fast") {
      return NextResponse.json(
        { error: "Fast Match jobs lang ang pwedeng i-express ng interest dito." },
        { status: 400 }
      );
    }
    if (
      job.fast_match_expires_at &&
      new Date(job.fast_match_expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: "Tapos na ang Fast Match window para sa job na ito." },
        { status: 400 }
      );
    }

    const { data: activeJob } = await admin
      .from("jobs")
      .select("id")
      .eq("worker_id", user.id)
      .in("status", ["matched", "in_progress"])
      .limit(1)
      .single();

    if (activeJob) {
      return NextResponse.json(
        {
          error:
            "May active job ka pa (matched o in progress). Isang job lang pwedeng sabay.",
        },
        { status: 400 }
      );
    }

    const { error: insertErr } = await admin.from("job_interests").insert({
      job_id: id,
      worker_id: user.id,
    });

    if (insertErr) {
      if (insertErr.code === "23505") {
        return NextResponse.json(
          { error: "Na-express mo na ang interest mo sa job na ito." },
          { status: 400 }
        );
      }
      console.error("job_interests insert error:", insertErr);
      return NextResponse.json(
        { error: "Hindi ma-save ang interest. Subukan muli." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Interest API error:", err);
    return NextResponse.json(
      { error: "May nangyaring error. Subukan muli." },
      { status: 500 }
    );
  }
}
