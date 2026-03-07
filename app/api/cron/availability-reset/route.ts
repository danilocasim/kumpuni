import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cron: run daily at 10:00 PM PHT (UTC+8).
 * Sets all worker_profiles.availability = 'not_available'.
 * Configure in Vercel: 0 14 * * * (14:00 UTC = 22:00 PHT).
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: count, error } = await admin.rpc("reset_all_worker_availability");

  if (error) {
    console.error("Availability reset error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, reset: count ?? 0 });
}
