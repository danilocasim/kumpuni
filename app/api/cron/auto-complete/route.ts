import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * T046: 48-hour auto-complete.
 * Finds jobs where status=completed but completed_at is null (edge case) and sets completed_at.
 * Ensures completed jobs are treated as complete and review prompt remains available.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: jobs, error } = await admin
    .from("jobs")
    .select("id")
    .eq("status", "completed")
    .is("completed_at", null);

  if (error) {
    console.error("Auto-complete query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!jobs?.length) {
    return NextResponse.json({ updated: 0 });
  }

  const { error: updateErr } = await admin
    .from("jobs")
    .update({ completed_at: new Date().toISOString() })
    .in("id", jobs.map((j) => j.id));

  if (updateErr) {
    console.error("Auto-complete update error:", updateErr);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ updated: jobs.length });
}
