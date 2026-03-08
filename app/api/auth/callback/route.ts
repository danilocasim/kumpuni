import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/jobs/new";

  if (!code) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  let response = NextResponse.redirect(new URL(next, origin));

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.redirect(new URL(next, origin));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=auth", origin));
  }

  // Ensure a public.users row exists for this OAuth user
  const admin = createAdminClient();
  const { data: existingUser } = await admin
    .from("users")
    .select("id, phone")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!existingUser) {
    await admin.from("users").insert({
      id: data.user.id,
      email: data.user.email ?? null,
      phone: data.user.phone ?? null,
      display_name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
      avatar_url: data.user.user_metadata?.avatar_url ?? null,
      user_role: "homeowner",
      updated_at: new Date().toISOString(),
    });

    // New user with no phone — redirect to phone setup
    const phoneSetupUrl = new URL("/login/phone", origin);
    phoneSetupUrl.searchParams.set("next", next);
    // Re-apply cookie changes to the new redirect
    response = NextResponse.redirect(phoneSetupUrl);
    request.cookies.getAll().forEach(({ name, value }) => {
      response.cookies.set(name, value);
    });
    return response;
  }

  // Existing user without phone — also redirect to phone setup
  if (!existingUser.phone) {
    const phoneSetupUrl = new URL("/login/phone", origin);
    phoneSetupUrl.searchParams.set("next", next);
    response = NextResponse.redirect(phoneSetupUrl);
    request.cookies.getAll().forEach(({ name, value }) => {
      response.cookies.set(name, value);
    });
    return response;
  }

  return response;
}
