import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyFastMatchWorkers } from "@/lib/fast-match-notify";
import { getSessionRole, canUseHomeownerFeatures } from "@/lib/auth-role";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { user, role } = await getSessionRole(supabase);
    if (!user) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }
    if (!canUseHomeownerFeatures(role)) {
      return NextResponse.json(
        { error: "Only homeowners can post jobs." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      category,
      description,
      photo_urls,
      lat,
      lng,
      barangay,
      urgency,
      budget_range,
    } = body;

    if (!category || !description || typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { error: "Category, description, and location are required." },
        { status: 400 }
      );
    }

    const validCategories = ["plumbing", "electrical", "carpentry", "painting", "masonry", "general"];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const validUrgency = ["asap", "this_week", "flexible"];
    if (!validUrgency.includes(urgency)) {
      return NextResponse.json({ error: "Invalid urgency." }, { status: 400 });
    }

    const matchingMode = "fast";

    // Expiration based on urgency
    const expiryMs: Record<string, number> = {
      asap: 15 * 60 * 1000,           // 15 minutes
      this_week: 7 * 24 * 60 * 60 * 1000,  // 7 days
      flexible: 30 * 24 * 60 * 60 * 1000,  // 30 days
    };
    const fastMatchExpiresAt = new Date(
      Date.now() + (expiryMs[urgency] ?? expiryMs.flexible)
    ).toISOString();

    const locationWkt = `POINT(${lng} ${lat})`;
    const barangayStr = typeof barangay === "string" && barangay.trim() ? barangay.trim() : "N/A";

    const admin = createAdminClient();

    // Ensure public.users row exists (jobs.homeowner_id FK references users.id)
    const { data: existingUser } = await admin.from("users").select("id").eq("id", user.id).maybeSingle();
    if (!existingUser) {
      const phone = (user as { phone?: string }).phone ?? "";
      const { error: insertErr } = await admin.from("users").insert({
        id: user.id,
        phone: phone || `pending-${user.id.substring(0, 8)}`,
        updated_at: new Date().toISOString(),
      });
      if (insertErr) {
        console.error("Error creating missing user row:", insertErr);
      }
    }

    const { data: job, error } = await admin
      .from("jobs")
      .insert({
        homeowner_id: user.id,
        category,
        description: description.slice(0, 500),
        photo_urls: Array.isArray(photo_urls) ? photo_urls : [],
        location: locationWkt,
        barangay: barangayStr,
        urgency,
        budget_range: budget_range || null,
        status: "open",
        matching_mode: matchingMode,
        fast_match_expires_at: fastMatchExpiresAt,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Job insert error:", error);
      const message =
        process.env.NODE_ENV === "development"
          ? error.message
          : "Hindi masave ang job. Subukan muli.";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // Notify nearby workers for all urgency levels
    notifyFastMatchWorkers({
      jobId: job.id,
      category,
      barangay: barangayStr,
      budgetRange: budget_range || null,
    }).then(({ notified, errors }) => {
      if (errors.length) console.warn("Fast Match notify:", errors);
      else if (notified) console.info("Fast Match: notified", notified, "workers");
    });

    return NextResponse.json({ id: job.id });
  } catch (err) {
    console.error("Jobs API error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
