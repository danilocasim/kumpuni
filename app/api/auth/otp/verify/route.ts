import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Dev-only: fixed OTP so no real SMS is sent. Use this code to sign in. */
const DEV_OTP_CODE = "123456";
const IS_DEV_OTP_BYPASS = process.env.NODE_ENV === "development";

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

/** Dev-only: email used for magic-link session when using 123456. */
function devEmailForPhone(normalizedPhone: string): string {
  const digits = normalizedPhone.replace(/\D/g, "");
  return `dev+${digits}@kumpuni.dev`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = body?.phone?.trim();
    const token = body?.token?.trim();
    const role = body?.role as "homeowner" | "worker" | null | undefined;
    const nextPath = typeof body?.next === "string" ? body.next : null;

    if (!phone || !token || typeof phone !== "string" || typeof token !== "string") {
      return NextResponse.json(
        { error: "Kailangan ang numero at verification code. Subukan muli." },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    const supabase = await createClient();
    const admin = createAdminClient();

    // Dev bypass: accept fixed OTP 123456 and create session via magic link (no real SMS)
    if (IS_DEV_OTP_BYPASS && token === DEV_OTP_CODE) {
      const devEmail = devEmailForPhone(normalizedPhone);
      const { data: existingRow } = await admin
        .from("users")
        .select("id")
        .eq("phone", normalizedPhone)
        .maybeSingle();

      // Supabase createUser accepts email OR phone, not both. We use email for magic-link flow.
      let userId: string;
      if (existingRow?.id) {
        userId = existingRow.id;
        const { data: authUser } = await admin.auth.admin.getUserById(userId);
        if (authUser?.user && authUser.user.email !== devEmail) {
          await admin.auth.admin.updateUserById(userId, { email: devEmail });
        }
      } else {
        const { data: createData, error: createError } = await admin.auth.admin.createUser({
          email: devEmail,
          email_confirm: true,
        });
        if (createError) {
          if (createError.message?.toLowerCase().includes("already") || createError.message?.toLowerCase().includes("registered")) {
            const { data: listData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
            const byEmail = listData?.users?.find((u) => u.email === devEmail);
            if (byEmail?.id) {
              userId = byEmail.id;
              await admin.from("users").upsert(
                { id: userId, phone: normalizedPhone, display_name: null, user_role: role === "homeowner" || role === "worker" ? role : null, updated_at: new Date().toISOString() },
                { onConflict: "id" }
              );
            } else {
              console.error("[OTP dev] createUser failed (existing?) and user not found:", createError.message);
              return NextResponse.json(
                { error: `Hindi ma-create ang user: ${createError.message}. Subukan ibang numero o tunay na OTP.` },
                { status: 400 }
              );
            }
          } else {
            console.error("[OTP dev] createUser failed:", createError.message);
            return NextResponse.json(
              { error: `Hindi ma-create ang user: ${createError.message}. Subukan muli o gamitin ang tunay na OTP.` },
              { status: 400 }
            );
          }
        } else if (createData?.user?.id) {
          userId = createData.user.id;
          try {
            await admin.auth.admin.updateUserById(userId, { phone: normalizedPhone });
          } catch {
            // Auth may not allow adding phone to email user; phone is stored in public.users
          }
          await admin.from("users").insert({
            id: userId,
            phone: normalizedPhone,
            display_name: null,
            user_role: role === "homeowner" || role === "worker" ? role : null,
            updated_at: new Date().toISOString(),
          });
        } else {
          return NextResponse.json(
            { error: "May nangyaring error sa pag-create ng user. Subukan muli." },
            { status: 500 }
          );
        }
      }

      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: devEmail,
      });
      if (linkError || !linkData?.properties?.hashed_token) {
        console.error("[OTP dev] generateLink failed:", linkError?.message ?? "no hashed_token");
        return NextResponse.json(
          { error: "Hindi ma-generate ang session. Subukan muli." },
          { status: 500 }
        );
      }

      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: "email",
      });
      if (verifyError || !verifyData.user?.id) {
        console.error("[OTP dev] verifyOtp failed:", verifyError?.message);
        return NextResponse.json(
          { error: "Invalid o expired ang code. Subukan muli." },
          { status: 400 }
        );
      }

      const roleToSet = role === "homeowner" || role === "worker" ? role : null;
      await admin
        .from("users")
        .update({
          phone: normalizedPhone,
          ...(roleToSet && { user_role: roleToSet }),
          updated_at: new Date().toISOString(),
        })
        .eq("id", verifyData.user.id);

      return NextResponse.json({
        ok: true,
        user: { id: verifyData.user.id },
        redirect: nextPath || "/dashboard",
      });
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token,
      type: "sms",
    });

    if (error) {
      return NextResponse.json(
        { error: "Invalid o expired ang code. Subukan muli." },
        { status: 400 }
      );
    }

    const user = data.user;
    if (!user?.id) {
      return NextResponse.json(
        { error: "May nangyaring error. Subukan muli." },
        { status: 500 }
      );
    }

    const { data: existingUser } = await admin.from("users").select("id").eq("id", user.id).single();

    const roleToSet =
      role === "homeowner" || role === "worker" ? role : null;
    if (existingUser) {
      await admin
        .from("users")
        .update({
          phone: normalizedPhone,
          ...(roleToSet && { user_role: roleToSet }),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    } else {
      await admin.from("users").insert({
        id: user.id,
        phone: normalizedPhone,
        display_name: null,
        user_role: roleToSet,
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      ok: true,
      user: { id: user.id },
      redirect: nextPath || "/dashboard",
    });
  } catch (err) {
    console.error("OTP verify error:", err);
    return NextResponse.json(
      { error: "May nangyaring error. Subukan muli." },
      { status: 500 }
    );
  }
}
