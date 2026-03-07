import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyWorkerSelected } from "@/lib/notify-worker-selected";

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

    const body = await request.json();
    const workerId = body?.worker_id;
    if (!workerId || typeof workerId !== "string") {
      return NextResponse.json(
        { error: "Kailangan ang worker_id." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: job, error: jobErr } = await admin
      .from("jobs")
      .select("id, homeowner_id, status, matching_mode, barangay, address, category")
      .eq("id", id)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: "Job hindi mahanap." }, { status: 404 });
    }
    if (job.homeowner_id !== user.id) {
      return NextResponse.json({ error: "Walang permiso." }, { status: 403 });
    }
    if (job.status !== "open") {
      return NextResponse.json(
        { error: "Na-match na ang job na ito." },
        { status: 400 }
      );
    }

    const { data: workerActiveJob } = await admin
      .from("jobs")
      .select("id")
      .eq("worker_id", workerId)
      .in("status", ["matched", "in_progress"])
      .limit(1)
      .maybeSingle();

    if (workerActiveJob) {
      return NextResponse.json(
        {
          error:
            "May active job na ang worker na ito (matched o in progress). Pumili ng ibang worker.",
        },
        { status: 400 }
      );
    }

    const { data: homeowner } = await admin
      .from("users")
      .select("phone")
      .eq("id", user.id)
      .single();

    const jobAddress = job.address?.trim() || job.barangay || "N/A";

    await admin
      .from("jobs")
      .update({
        worker_id: workerId,
        status: "matched",
        address: job.address ?? job.barangay,
      })
      .eq("id", id);

    notifyWorkerSelected(
      workerId,
      id,
      job.category,
      job.barangay ?? "N/A"
    ).catch((e) => console.warn("Notify worker selected failed:", e));

    return NextResponse.json({
      ok: true,
      homeowner_phone: homeowner?.phone ?? "",
      job_address: jobAddress,
    });
  } catch (err) {
    console.error("Select worker API error:", err);
    return NextResponse.json(
      { error: "May nangyaring error. Subukan muli." },
      { status: 500 }
    );
  }
}
