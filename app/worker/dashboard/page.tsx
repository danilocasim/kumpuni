import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShareLocationButton from "@/components/ShareLocationButton";
import WorkerAvailabilitySection from "@/components/WorkerAvailabilitySection";

export default async function WorkerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/worker/dashboard");

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Worker dashboard</h1>
      <p className="text-gray-600 mb-4">
        Welcome! Dito mo makikita ang availability, active job, at job history.
      </p>
      <div className="space-y-4">
        <WorkerAvailabilitySection />
        <ShareLocationButton />
        <Link
          href="/worker/jobs"
          className="block min-h-touch rounded-lg border border-gray-200 p-3 font-medium text-blue-600"
        >
          Tingnan ang available jobs →
        </Link>
        <Link
          href="/worker/setup"
          className="block min-h-touch rounded-lg border border-gray-200 p-3 text-gray-700"
        >
          I-edit ang profile
        </Link>
      </div>
    </main>
  );
}
