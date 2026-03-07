import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionRole, canUseHomeownerFeatures } from "@/lib/auth-role";

/**
 * Protects all /jobs/* routes: only homeowners (or both) can access.
 * Workers are redirected to worker dashboard.
 */
export default async function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { user, role } = await getSessionRole(supabase);
  console.log(`[JobsLayout] user=${user?.id ?? "null"} role="${role}"`);
  if (user && !canUseHomeownerFeatures(role)) {
    console.error(`[JobsLayout] Blocking user ${user.id} — role="${role}"`);
    redirect("/worker/dashboard?message=homeowner_only");
  }
  return <>{children}</>;
}
