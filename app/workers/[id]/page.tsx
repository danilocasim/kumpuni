import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicWorkerProfile } from "@/lib/get-public-worker-profile";
import WorkerProfileMap from "@/components/WorkerProfileMap";
import { ShieldCheck, ArrowLeft } from "lucide-react";

const SKILL_LABELS: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  carpentry: "Carpentry",
  painting: "Painting",
  masonry: "Masonry",
  general: "General",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  this_week: "This Week",
  weekends: "Weekends",
  open_anytime: "Open Anytime",
  available_now: "Available Now",
  not_available: "Not Available",
};

function availabilityBadgeClass(availability: string): string {
  switch (availability) {
    case "available_now":
      return "badge-status badge-available";
    case "this_week":
    case "weekends":
    case "open_anytime":
      return "badge-status badge-this-week";
    default:
      return "badge-status badge-not-available";
  }
}

export default async function PublicWorkerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPublicWorkerProfile(id);
  if (!data) notFound();

  const { user, profile, recent_reviews } = data;
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const isLoggedIn = !!currentUser;

  const skills: string[] = (profile.skills ?? []).map((s: string) => SKILL_LABELS[s] || s);
  const displayName = user.display_name || "Worker";
  const memberSince = new Date(user.created_at).toLocaleDateString("en-PH", {
    month: "short",
    year: "numeric",
  });

  return (
    <main className="min-h-screen max-w-[480px] mx-auto pb-24 page-bg">
      {/* Header: kumpuni-blue with subtle stripe, photo, name, verified, member since */}
      <header
        className="relative bg-kumpuni-blue px-4 pt-6 pb-8"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.03) 75%)`,
          backgroundSize: "20px 20px",
        }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Balik sa home
        </Link>
        <div className="flex gap-4 items-start">
          <div className="h-20 w-20 flex-shrink-0 rounded-full border-2 border-white overflow-hidden bg-concrete-white">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-heading text-2xl font-bold text-white/80">
                {displayName[0]}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-xl font-bold text-white">
                {displayName}
              </h1>
              {profile.is_verified && (
                <span className="inline-flex items-center gap-1 text-verified-green bg-green-light/90 text-[11px] font-bold uppercase px-2 py-0.5 rounded">
                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                  Verified
                </span>
              )}
            </div>
            <p className="text-white/80 text-caption mt-1">
              Member since {memberSince}
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 -mt-4">
        {/* Stats row */}
        <div className="card-kumpuni grid grid-cols-3 divide-x divide-card-border p-4">
          <div className="text-center">
            <p className="font-mono text-lg font-semibold text-slate-text">
              {profile.total_jobs}
            </p>
            <p className="text-caption text-muted-gray">Trabaho</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-lg font-semibold text-wood-brown">
              ★ {Number(profile.avg_rating).toFixed(1)}
            </p>
            <p className="text-caption text-muted-gray">Rating</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-sm font-semibold text-slate-text">
              ₱{profile.rate_min ?? "?"}–₱{profile.rate_max ?? "?"}
            </p>
            <p className="text-caption text-muted-gray">/araw</p>
          </div>
        </div>

        {/* Availability */}
        <p className="label-kumpuni mt-4">Availability</p>
        <span className={availabilityBadgeClass(profile.availability)}>
          <span className="badge-dot" />
          {AVAILABILITY_LABELS[profile.availability] ?? profile.availability}
        </span>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mt-6">
            <h2 className="font-heading text-[15px] font-bold text-slate-text mb-2">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span
                  key={s}
                  className="rounded-kumpuni-sm bg-blue-light px-3 py-1.5 text-body font-medium text-kumpuni-blue border border-wood-brown/20"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.bio && (
          <div className="mt-6">
            <h2 className="font-heading text-[15px] font-bold text-slate-text mb-2">
              Tungkol
            </h2>
            <p className="text-body text-slate-text">{profile.bio}</p>
          </div>
        )}

        {/* Portfolio */}
        {(profile.portfolio_urls ?? []).length > 0 && (
          <div className="mt-6">
            <h2 className="font-heading text-[15px] font-bold text-slate-text mb-2">
              Portfolio
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {profile.portfolio_urls.map((url: string, i: number) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square overflow-hidden rounded-kumpuni-md border border-card-border hover:shadow-kumpuni-md transition-shadow"
                >
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        {profile.service_lat != null && profile.service_lng != null && (
          <div className="mt-6">
            <h2 className="font-heading text-[15px] font-bold text-slate-text mb-2">
              Service area (approximate)
            </h2>
            <div className="overflow-hidden rounded-kumpuni-md border border-card-border">
              <WorkerProfileMap
                lat={profile.service_lat}
                lng={profile.service_lng}
                radiusKm={profile.service_radius_km ?? 10}
              />
            </div>
          </div>
        )}

        {/* Reviews */}
        {recent_reviews.length > 0 && (
          <div className="mt-6">
            <h2 className="font-heading text-[15px] font-bold text-slate-text mb-2">
              Reviews
            </h2>
            <ul className="space-y-4">
              {recent_reviews.map(
                (r: {
                  id: string;
                  rating: number;
                  comment: string | null;
                  created_at: string;
                }) => (
                  <li
                    key={r.id}
                    className="card-kumpuni p-4 relative pl-6 border-l-2 border-wood-brown/30"
                  >
                    <span className="absolute left-2 top-3 font-heading text-2xl text-wood-brown/50 leading-none">
                      "
                    </span>
                    <div className="flex items-center gap-2 text-caption text-muted-gray mb-1">
                      <span className="text-wood-brown">
                        ★ {r.rating}
                      </span>
                      <span>
                        {new Date(r.created_at).toLocaleDateString("en-PH")}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-body text-slate-text">{r.comment}</p>
                    )}
                  </li>
                )
              )}
            </ul>
          </div>
        )}

        {/* Contact CTA text */}
        <div className="mt-6 text-body text-slate-text">
          {isLoggedIn ? (
            <p>
              Para makipag-ugnayan, mag-post ng job at hanapin ang worker na ito
              sa &quot;Browse workers&quot; — doon mo makikita ang contact
              number.
            </p>
          ) : (
            <p>
              <Link href={`/login?next=/workers/${id}`} className="btn-ghost">
                Mag-log in
              </Link>{" "}
              para makita kung paano makipag-ugnayan (mag-post ng job, tapos
              piliin ang worker sa Browse).
            </p>
          )}
        </div>
      </div>

      {/* Sticky bottom CTA: above main nav when authenticated */}
      <StickyContactBar
        isLoggedIn={isLoggedIn}
        workerId={id}
        displayName={displayName}
      />
    </main>
  );
}

function StickyContactBar({
  isLoggedIn,
  workerId,
  displayName,
}: {
  isLoggedIn: boolean;
  workerId: string;
  displayName: string;
}) {
  return (
    <div
      className={`fixed left-0 right-0 max-w-[480px] mx-auto bg-white border-t border-card-border p-4 shadow-nav-top z-30 safe-area-bottom ${isLoggedIn ? "bottom-[60px]" : "bottom-0"}`}
    >
      <Link
        href={isLoggedIn ? "/jobs/new" : `/login?next=/workers/${workerId}`}
        className="btn-primary flex w-full items-center justify-center"
      >
        KONTAKIN SI {displayName.toUpperCase()}
      </Link>
    </div>
  );
}
