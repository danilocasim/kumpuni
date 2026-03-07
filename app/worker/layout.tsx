import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionRole, canUseWorkerFeatures } from "@/lib/auth-role";

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { user, role } = await getSessionRole(supabase);
  if (!user) redirect("/login?role=worker&next=/worker/dashboard");
  if (!canUseWorkerFeatures(role)) redirect("/dashboard?message=worker_only");
  return <>{children}</>;
}
