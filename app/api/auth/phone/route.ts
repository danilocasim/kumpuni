import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizePhone(phone: string): string {
  let normalized = phone.replace(/\s/g, "");
  if (/^0\d{10}$/.test(normalized)) {
    normalized = "+63" + normalized.slice(1);
  } else if (/^\d{10}$/.test(normalized) && normalized.startsWith("9")) {
    normalized = "+63" + normalized;
  } else if (!normalized.startsWith("+")) {
    normalized = "+" + normalized;
  }
  return normalized;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!rawPhone) {
    return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  }

  const phone = normalizePhone(rawPhone);

  // Validate format: +63 followed by 10 digits
  if (!/^\+63\d{10}$/.test(phone)) {
    return NextResponse.json(
      { error: "Invalid phone format. Use +639XXXXXXXXX." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Check if phone is already taken by another user
  const { data: existing } = await admin
    .from("users")
    .select("id")
    .eq("phone", phone)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "This phone number is already registered to another account." },
      { status: 409 }
    );
  }

  const { error: updateError } = await admin
    .from("users")
    .update({ phone, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    console.error("Phone update error:", updateError.message);
    return NextResponse.json(
      { error: "Could not save phone number. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
