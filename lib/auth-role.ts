import type { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "homeowner" | "worker" | "both" | null;

/**
 * Get current user and their role from users.user_role.
 * Use in server components and API routes to enforce role-based access.
 */
export async function getSessionRole(
  supabase: SupabaseClient
): Promise<{ user: { id: string } | null; role: UserRole }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return { user: null, role: null };
  }
  const { data: row } = await supabase
    .from("users")
    .select("user_role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (row?.user_role as UserRole) ?? null;
  return { user: { id: user.id }, role };
}

/** True if the user can use homeowner features (post jobs, view homeowner dashboard). */
export function canUseHomeownerFeatures(role: UserRole): boolean {
  return role === "homeowner" || role === "both" || role === null;
}

/** True if the user can use worker features (worker dashboard, worker jobs, setup). */
export function canUseWorkerFeatures(role: UserRole): boolean {
  return role === "worker" || role === "both" || role === null;
}
