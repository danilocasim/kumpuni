import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyFastMatchWorkers } from "@/lib/fast-match-notify";

const WORKER_ALLOWED_STATUSES = ["in_progress", "completed"] as const;
const CANCEL_ALLOWED_STATUSES = ["open", "matched"] as const;

/**
 * PATCH: Update job status.
 * - Worker: in_progress | completed (when assigned); cancelled (when matched, worker backing out).
 * - Homeowner: cancelled (when open or matched).
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
    if (typeof status !== "string") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: job, error: jobErr } = await admin
      .from("jobs")
      .select("id, homeowner_id, worker_id, status")
      .eq("id", id)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: "Job hindi mahanap." }, { status: 404 });
    }

    // Reopen: homeowner can reopen a cancelled job
    if (status === "reopen") {
      if (job.homeowner_id !== user.id) {
        return NextResponse.json({ error: "Walang permiso." }, { status: 403 });
      }
      if (job.status !== "cancelled") {
        return NextResponse.json(
          { error: "Cancelled jobs lang ang pwedeng i-reopen." },
          { status: 400 }
        );
      }

      const { data: jobFull } = await admin
        .from("jobs")
        .select("category, barangay, urgency, budget_range")
        .eq("id", id)
        .single();

      const expiryMs: Record<string, number> = {
        asap: 15 * 60 * 1000,
        this_week: 7 * 24 * 60 * 60 * 1000,
        flexible: 30 * 24 * 60 * 60 * 1000,
      };
      const urgency = jobFull?.urgency ?? "flexible";
      const fastMatchExpiresAt = new Date(
        Date.now() + (expiryMs[urgency] ?? expiryMs.flexible)
      ).toISOString();

      const { error: updateErr } = await admin
        .from("jobs")
        .update({
          status: "open",
          worker_id: null,
          fast_match_expires_at: fastMatchExpiresAt,
          matching_mode: "fast",
        })
        .eq("id", id);

      if (updateErr) {
        console.error("Job reopen error:", updateErr);
        return NextResponse.json(
          { error: "Hindi ma-reopen. Subukan muli." },
          { status: 500 }
        );
      }

      // Notify nearby workers
      notifyFastMatchWorkers({
        jobId: id,
        category: jobFull?.category ?? "general",
        barangay: jobFull?.barangay ?? "N/A",
        budgetRange: jobFull?.budget_range ?? null,
      }).catch((e) => console.warn("Reopen notify failed:", e));

      return NextResponse.json({ ok: true, status: "open" });
    }

    // Cancel: homeowner (open/matched) or worker (matched only)
    if (status === "cancelled") {
      if (!CANCEL_ALLOWED_STATUSES.includes(job.status as (typeof CANCEL_ALLOWED_STATUSES)[number])) {
        return NextResponse.json(
          { error: "Hindi na pwedeng i-cancel ang job na ito." },
          { status: 400 }
        );
      }
      const isHomeowner = job.homeowner_id === user.id;
      const isWorker = job.worker_id === user.id;
      if (isHomeowner && (job.status === "open" || job.status === "matched")) {
        // ok
      } else if (isWorker && job.status === "matched") {
        // ok
      } else {
        return NextResponse.json(
          { error: "Walang permiso para i-cancel." },
          { status: 403 }
        );
      }
      const { error: updateErr } = await admin
        .from("jobs")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (updateErr) {
        console.error("Job cancel error:", updateErr);
        return NextResponse.json(
          { error: "Hindi masave. Subukan muli." },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true, status: "cancelled" });
    }

    // Worker status updates (in_progress, completed)
    if (
      !WORKER_ALLOWED_STATUSES.includes(status as (typeof WORKER_ALLOWED_STATUSES)[number])
    ) {
      return NextResponse.json(
        { error: "Invalid status. Pwedeng in_progress, completed, o cancelled." },
        { status: 400 }
      );
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
