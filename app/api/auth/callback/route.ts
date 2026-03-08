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

  // Collect auth cookies with their full options so we can apply them
  // to whichever final redirect response we create.
  let authCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        authCookies = cookiesToSet;
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

  let redirectUrl = new URL(next, origin);
  let needsPhone = false;

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
    needsPhone = true;
  } else if (!existingUser.phone) {
    needsPhone = true;
  }

  if (needsPhone) {
    redirectUrl = new URL("/login/phone", origin);
    redirectUrl.searchParams.set("next", next);
  }

  // Build final response with proper auth cookies (including options)
  const response = NextResponse.redirect(redirectUrl);
  authCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );
  return response;
}
