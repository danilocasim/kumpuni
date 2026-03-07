import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BrowseWorkersView from "@/components/BrowseWorkersView";

export default async function JobBrowsePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ min_rating?: string }>;
}) {
  const { id } = await params;
  const { min_rating } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/jobs/" + id + "/browse");

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, homeowner_id")
    .eq("id", id)
    .single();

  if (error || !job) {
    return (
      <main className="min-h-screen p-4">
        <p className="text-red-600">Job hindi mahanap.</p>
        <Link href="/dashboard" className="mt-2 inline-block text-blue-600 underline">
          Balik sa dashboard
        </Link>
      </main>
    );
  }
  if (job.homeowner_id !== user.id) {
    redirect("/dashboard");
  }

  const initialMinRating = min_rating != null ? parseFloat(min_rating) : 3.0;
  const safeRating =
    Number.isFinite(initialMinRating) && initialMinRating >= 0 && initialMinRating <= 5
      ? initialMinRating
      : 3.0;

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-2">Browse workers</h1>
      <p className="text-sm text-gray-600 mb-4">
        Tingnan ang list at map ng workers na malapit. Piliin ang minimum rating, tapos i-tap ang worker para makita ang profile at &quot;Contact&quot; para ipakita ang numero.
      </p>
      <BrowseWorkersView jobId={id} initialMinRating={safeRating} />
    </main>
  );
}
