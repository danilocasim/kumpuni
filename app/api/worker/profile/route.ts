import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * T035: Create or update worker profile. Called from worker setup.
 * Requires auth. Updates users (display_name, avatar_url, user_role) and upserts worker_profiles.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Kailangan mag-log in." }, { status: 401 });
    }

    const body = await request.json();
    const {
      display_name,
      avatar_url,
      skills,
      experience_level,
      rate_min,
      rate_max,
      bio,
      service_lat,
      service_lng,
      service_radius_km,
      valid_id_url,
      portfolio_urls,
    } = body;

    if (!display_name || typeof display_name !== "string" || display_name.trim().length === 0) {
      return NextResponse.json(
        { error: "Kailangan ang display name." },
        { status: 400 }
      );
    }
    const name = display_name.trim().slice(0, 50);

    const validSkills = ["plumbing", "electrical", "carpentry", "painting", "masonry", "general"];
    const skillsArr = Array.isArray(skills)
      ? skills.filter((s: string) => validSkills.includes(s))
      : [];
    if (skillsArr.length === 0) {
      return NextResponse.json(
        { error: "Pumili ng kahit isang skill." },
        { status: 400 }
      );
    }

    const validLevels = ["1_2yr", "3_5yr", "5_10yr", "10yr_plus"];
    const level =
      experience_level && validLevels.includes(experience_level) ? experience_level : null;

    const lat = typeof service_lat === "number" ? service_lat : null;
    const lng = typeof service_lng === "number" ? service_lng : null;
    const radius =
      typeof service_radius_km === "number" && service_radius_km >= 5 && service_radius_km <= 25
        ? Math.round(service_radius_km)
        : 10;

    const admin = createAdminClient();

    const { data: existingUser } = await admin.from("users").select("id").eq("id", user.id).single();
    if (!existingUser) {
      const phone = (user as { phone?: string }).phone ?? "";
      await admin.from("users").insert({
        id: user.id,
        phone: phone || "pending",
        display_name: name,
        avatar_url: avatar_url || null,
        user_role: "worker",
        updated_at: new Date().toISOString(),
      });
    } else {
      await admin
        .from("users")
        .update({
          display_name: name,
          avatar_url: avatar_url || null,
          user_role: "worker",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    const locationWkt =
      lat != null && lng != null ? `POINT(${lng} ${lat})` : null;

    const { data: existingProfile } = await admin
      .from("worker_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const validAvailability = ["available_now", "this_week", "weekends", "open_anytime", "not_available"];
    const availability =
      typeof body.availability === "string" && validAvailability.includes(body.availability)
        ? body.availability
        : "open_anytime";

    const profileRow = {
      user_id: user.id,
      skills: skillsArr,
      experience_level: level,
      rate_min: typeof rate_min === "number" && rate_min >= 0 ? rate_min : null,
      rate_max: typeof rate_max === "number" && rate_max >= 0 ? rate_max : null,
      bio:
        typeof bio === "string" && bio.trim().length > 0
          ? bio.trim().slice(0, 200)
          : null,
      service_radius_km: radius,
      service_center: locationWkt,
      availability,
      valid_id_url: typeof valid_id_url === "string" && valid_id_url.trim() ? valid_id_url.trim() : null,
      portfolio_urls: Array.isArray(portfolio_urls)
        ? portfolio_urls.slice(0, 6).filter((u: unknown) => typeof u === "string")
        : [],
    };

    if (existingProfile) {
      const { error } = await admin
        .from("worker_profiles")
        .update(profileRow)
        .eq("user_id", user.id);
      if (error) {
        console.error("Worker profile update error:", error);
        return NextResponse.json(
          { error: "Hindi masave ang profile. Subukan muli." },
          { status: 500 }
        );
      }
    } else {
      const { error } = await admin.from("worker_profiles").insert(profileRow);
      if (error) {
        console.error("Worker profile insert error:", error);
        return NextResponse.json(
          { error: "Hindi masave ang profile. Subukan muli." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true, redirect: "/worker/dashboard" });
  } catch (err) {
    console.error("Worker profile API error:", err);
    return NextResponse.json(
      { error: "May nangyaring error. Subukan muli." },
      { status: 500 }
    );
  }
}
