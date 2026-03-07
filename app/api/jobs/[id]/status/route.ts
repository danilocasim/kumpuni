import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const WORKER_ALLOWED_STATUSES = ["in_progress", "completed"] as const;

/**
 * PATCH: Worker updates job status (On My Way → in_progress, Completed → completed).
 * Only the assigned worker can update. Sets completed_at when status = completed.
 */
export async function PATCH(
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

    const body = await request.json();
    const status = body?.status;
    if (
      typeof status !== "string" ||
      !WORKER_ALLOWED_STATUSES.includes(status as (typeof WORKER_ALLOWED_STATUSES)[number])
    ) {
      return NextResponse.json(
        { error: "Invalid status. Pwedeng in_progress o completed lang." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: job, error: jobErr } = await admin
      .from("jobs")
      .select("id, worker_id, status")
      .eq("id", id)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: "Job hindi mahanap." }, { status: 404 });
    }
    if (job.worker_id !== user.id) {
      return NextResponse.json({ error: "Hindi mo pwedeng i-update ang job na ito." }, { status: 403 });
    }
    if (job.status !== "matched" && job.status !== "in_progress") {
      return NextResponse.json(
        { error: "Hindi na pwedeng baguhin ang status ng job na ito." },
        { status: 400 }
      );
    }
    if (status === "in_progress" && job.status !== "matched") {
      return NextResponse.json(
        { error: "Naka-in progress na ang job." },
        { status: 400 }
      );
    }
    if (status === "completed" && job.status !== "matched" && job.status !== "in_progress") {
      return NextResponse.json(
        { error: "Invalid transition." },
        { status: 400 }
      );
    }

    const updatePayload =
      status === "completed"
        ? { status: "completed", completed_at: new Date().toISOString() }
        : { status: "in_progress" };

    const { error: updateErr } = await admin
      .from("jobs")
      .update(updatePayload)
      .eq("id", id);

    if (updateErr) {
      console.error("Job status update error:", updateErr);
      return NextResponse.json(
        { error: "Hindi masave ang status. Subukan muli." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, status });
  } catch (err) {
    console.error("Job status API error:", err);
    return NextResponse.json(
      { error: "May nangyaring error. Subukan muli." },
      { status: 500 }
    );
  }
}
