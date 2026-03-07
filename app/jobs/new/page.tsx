import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionRole } from "@/lib/auth-role";
import NewJobForm from "./NewJobForm";

export default async function NewJobPage() {
  const supabase = await createClient();
  const { user } = await getSessionRole(supabase);
  if (!user) redirect("/login?role=homeowner&next=/jobs/new");
  return <NewJobForm />;
}
