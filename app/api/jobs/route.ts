import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyFastMatchWorkers } from "@/lib/fast-match-notify";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Kailangan mag-log in." }, { status: 401 });
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
        { error: "Kailangan ang category, description, at lokasyon." },
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

    const matchingMode = urgency === "asap" ? "fast" : "flexible";
    const fastMatchExpiresAt =
      urgency === "asap"
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
        : null;

    const locationWkt = `POINT(${lng} ${lat})`;
    const barangayStr = typeof barangay === "string" && barangay.trim() ? barangay.trim() : "N/A";

    const admin = createAdminClient();

    // Ensure public.users row exists (jobs.homeowner_id FK references users.id)
    const { data: existingUser } = await admin.from("users").select("id").eq("id", user.id).single();
    if (!existingUser) {
      const phone = (user as { phone?: string }).phone ?? "";
      await admin.from("users").insert({
        id: user.id,
        phone: phone || "pending",
        updated_at: new Date().toISOString(),
      });
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

    if (urgency === "asap") {
      notifyFastMatchWorkers({
        jobId: job.id,
        category,
        barangay: barangayStr,
        budgetRange: budget_range || null,
      }).then(({ notified, errors }) => {
        if (errors.length) console.warn("Fast Match notify:", errors);
        else if (notified) console.info("Fast Match: notified", notified, "workers");
      });
    }

    return NextResponse.json({ id: job.id });
  } catch (err) {
    console.error("Jobs API error:", err);
    return NextResponse.json(
      { error: "May nangyaring error. Subukan muli." },
      { status: 500 }
    );
  }
}
