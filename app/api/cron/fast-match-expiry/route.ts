import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: expired, error } = await admin
    .from("jobs")
    .select("id")
    .eq("matching_mode", "fast")
    .eq("status", "open")
    .lt("fast_match_expires_at", new Date().toISOString());

  if (error) {
    console.error("Fast match expiry query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!expired?.length) {
    return NextResponse.json({ updated: 0 });
  }

  const { error: updateErr } = await admin
    .from("jobs")
    .update({ matching_mode: "flexible", fast_match_expires_at: null })
    .in("id", expired.map((j) => j.id));

  if (updateErr) {
    console.error("Fast match expiry update error:", updateErr);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ updated: expired.length });
}
