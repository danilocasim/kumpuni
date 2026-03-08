import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getSessionRole, canUseHomeownerFeatures } from "@/lib/auth-role";
import { PageContainer } from "@/components/PageContainer";
import { User, Phone, MapPin, Edit3, Settings } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  open: "Naghahanap",
  matched: "May Kumpunero",
  in_progress: "Ginagawa",
  completed: "Tapos Na",
  cancelled: "Na-cancel",
};

const STATUS_STYLES: Record<string, string> = {
  open: "badge-status badge-this-week shadow-sm",
  matched: "badge-status badge-matched shadow-sm",
  in_progress: "badge-status badge-in-progress shadow-sm",
  completed: "badge-status badge-completed shadow-sm",
  cancelled: "badge-status badge-cancelled shadow-sm",
};

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  carpentry: "Carpentry",
  painting: "Painting",
  masonry: "Masonry",
  general: "General Repair",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const supabase = await createClient();
  const { user, role } = await getSessionRole(supabase);
  if (!user) redirect("/");
  if (!canUseHomeownerFeatures(role)) redirect("/worker/dashboard?message=homeowner_only");

  const { message } = await searchParams;

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, category, description, status, created_at, urgency, matching_mode")
    .eq("homeowner_id", user.id)
    .order("created_at", { ascending: false });

  const { data: userRow } = await supabase
    .from("users")
    .select("display_name, avatar_url, phone")
    .eq("id", user.id)
    .single();

  const completedIds = (jobs ?? []).filter((j) => j.status === "completed").map((j) => j.id);
  let reviewedJobIds: string[] = [];
  if (completedIds.length > 0) {
    const { data: reviews } = await supabase
      .from("reviews")
      .select("job_id")
      .eq("reviewer_id", user.id)
      .in("job_id", completedIds);
    reviewedJobIds = (reviews ?? []).map((r) => r.job_id);
  }

  const cardAccentByStatus: Record<string, string> = {
    open: "card-accent-open",
    matched: "card-accent-open",
    in_progress: "card-accent-open",
    completed: "card-accent-completed",
    cancelled: "card-accent-cancelled",
  };

  if (error) {
    return (
      <main className="min-h-screen page-bg py-8">
        <PageContainer>
          <div className="p-4 rounded-kumpuni bg-danger-light border border-danger-red/20">
            <p className="text-danger-red font-medium">Error loading jobs. Try again.</p>
          </div>
        </PageContainer>
      </main>
    );
  }

  return (
    <main className="min-h-screen page-bg py-8">
      <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            Mga Pinapagawa Ko
          </h1>
          <p className="text-base text-text-secondary mt-2">Ito ang listahan ng mga trabaho na nai-post mo na sa Kumpuni.</p>
        </div>
        <Link href="/jobs/new" className="btn-primary shrink-0 shadow-md flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Mag-post ng Trabaho
        </Link>
      </div>

      {message === "worker_only" && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-info-light text-text-primary flex gap-3 items-start shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-kumpuni-blue shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          <span className="font-medium text-sm">Ang section na iyon ay para sa mga kumpunero lamang. Dito maaari kang mag-post ng trabaho upang humanap ng kumpunero.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Content: Jobs List */}
        <div className="lg:col-span-2 space-y-6">
          {!jobs?.length ? (
            <div className="card-kumpuni border-dashed border-2 py-16 flex flex-col items-center justify-center text-center bg-transparent mt-2">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-subtle text-text-tertiary mb-4 transition-transform hover:scale-110">
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              </div>
              <h3 className="text-xl font-extrabold text-text-primary mb-2 tracking-tight">Wala pang nakalistang trabaho</h3>
              <p className="text-text-secondary mb-6 max-w-sm">Wala ka pang nailalagay na trabaho. Mag-post na para masuportahan natin ang mga lokal na kumpunero.</p>
              <Link href="/jobs/new" className="btn-primary shadow-sm hover:scale-[1.02] transition-transform">
                Mag-post ng Trabaho Ngayon
              </Link>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2">
              {jobs.map((job) => (
                <li key={job.id} className="h-full">
                  <div className={`card-kumpuni h-full flex flex-col hover:-translate-y-1 transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-xl ${cardAccentByStatus[job.status] ?? ""}`}>
                    {/* Decorative background icon */}
                    <div className="absolute -right-4 -bottom-4 text-surface-light opacity-60 z-0 pointer-events-none transform -rotate-12">
                       <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                    </div>

                    <Link href={`/jobs/${job.id}`} className="block group flex-1 relative z-10">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span
                          className={`${
                            STATUS_STYLES[job.status] ?? "badge-status badge-flexible shadow-sm"
                          }`}
                        >
                          {STATUS_LABELS[job.status] ?? job.status}
                        </span>
                        <span className="text-[11px] font-bold text-text-secondary bg-surface-light px-2.5 py-1 rounded-md border border-subtle uppercase tracking-wider shadow-sm group-hover:bg-white transition-colors">
                          {CATEGORY_LABELS[job.category] ?? job.category}
                        </span>
                      </div>
                      <p className="text-lg font-extrabold text-text-primary line-clamp-2 mt-2 group-hover:text-kumpuni-blue transition-colors leading-snug">
                        {job.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs font-semibold text-text-tertiary mt-3 bg-white w-fit px-2.5 py-1.5 rounded-md border border-subtle shadow-sm group-hover:border-kumpuni-blue/20 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {new Date(job.created_at).toLocaleDateString("en-PH", {
                          dateStyle: "medium",
                        })}
                      </div>
                    </Link>
                    {job.status === "open" && (
                      <div className="mt-5 flex gap-3 pt-5 border-t border-subtle relative z-10 flex-col sm:flex-row">
                        <Link href={`/jobs/${job.id}`} className="btn-ghost flex-1 text-center py-2.5 bg-surface-light rounded-kumpuni-md hover:bg-gray-200 font-bold transition-colors">
                          Detalye
                        </Link>
                        {job.matching_mode === "flexible" && (
                          <Link
                            href={`/jobs/${job.id}/browse`}
                            className="btn-secondary flex-none font-bold"
                          >
                            Pumili
                          </Link>
                        )}
                        {job.matching_mode === "fast" && (
                          <Link
                            href={`/jobs/${job.id}/fast`}
                            className="btn-primary shadow-md flex-none py-2.5 font-bold"
                          >
                            Tingnan ang Matches
                          </Link>
                        )}
                      </div>
                    )}
                    {job.status === "completed" && !reviewedJobIds.includes(job.id) && (
                      <div className="mt-5 pt-5 border-t border-subtle relative z-10">
                        <Link
                          href={`/jobs/${job.id}/review`}
                          className="btn-primary w-full shadow-md flex justify-center gap-2 !bg-success-green hover:!bg-green-700 !border-success-green font-bold"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                          Mag-iwan ng Review
                        </Link>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sidebar: Homeowner Profile */}
        <div className="lg:col-span-1">
          <div className="card-kumpuni p-6 sticky top-24 shadow-md bg-gradient-to-b from-white to-surface-light border-t-4 border-t-kumpuni-blue">
            <h2 className="text-xl font-extrabold text-text-primary mb-6 tracking-tight flex items-center justify-between">
              Aking Profile
              <button title="Settings" className="text-text-tertiary hover:text-kumpuni-blue transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </h2>
            
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="w-24 h-24 rounded-full bg-white border-4 border-surface-light shadow-sm flex items-center justify-center overflow-hidden mb-4 relative group">
                {userRow?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userRow.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-gray-300" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Edit3 className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-text-primary">
                {userRow?.display_name || "Walang Pangalan"}
              </h3>
              <span className="badge-status badge-this-week mt-2 shadow-sm">Homeowner</span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 text-sm text-text-secondary bg-white p-3 rounded-xl border border-subtle">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-kumpuni-blue" />
                </div>
                <div className="font-medium">
                  {userRow?.phone ? (
                    userRow.phone
                  ) : (
                    <span className="text-text-tertiary italic">Walang number</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-subtle flex flex-col gap-3">
              {/* Note: There's no separate homeowner profile edit page in current setup, this would be a future route e.g /dashboard/profile/edit */}
              <button disabled className="btn-secondary w-full justify-center opacity-70 cursor-not-allowed">
                I-edit ang detalye (Soon)
              </button>
            </div>
          </div>
        </div>
      </div>
      </PageContainer>
    </main>
  );
}
