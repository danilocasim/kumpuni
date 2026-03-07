import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * T033: Reveal worker phone to homeowner for this job (after "Contact" action).
 * Homeowner must own the job.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const workerId = body?.worker_id;
    if (!workerId || typeof workerId !== "string") {
      return NextResponse.json(
        { error: "Kailangan ang worker_id." },
        { status: 400 }
      );
    }

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

    const { data: worker } = await admin
      .from("users")
      .select("phone")
      .eq("id", workerId)
      .single();

    if (!worker) {
      return NextResponse.json({ error: "Worker hindi mahanap." }, { status: 404 });
    }

    return NextResponse.json({
      phone: worker.phone ?? "",
    });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: "May nangyaring error. Subukan muli." },
      { status: 500 }
    );
  }
}
