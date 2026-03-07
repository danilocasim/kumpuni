import Link from "next/link";
import { getLandingData } from "@/lib/get-landing-data";
import { WorkerCard } from "@/components/WorkerCard";
import { Wrench, ShieldCheck, CreditCard, HelpCircle } from "lucide-react";

export default async function Home() {
  const { workers, jobsCompletedThisMonth } = await getLandingData();

  return (
    <main className="min-h-screen max-w-[480px] mx-auto px-4 pt-6 pb-28">
      {/* Hero: no generic gradient, bold typographic headline */}
      <section className="pt-2 pb-6">
        <h1 className="font-heading text-headline-lg font-extrabold text-slate-text leading-tight">
          Kailangan mo ng maayos?
        </h1>
        <p className="mt-3 text-body text-slate-text">
          Humanap ng verified na worker malapit sayo — plumber, electrician,
          karpintero, at iba pa.
        </p>
        <Link
          href="/login?role=homeowner&next=/jobs/new"
          className="btn-primary mt-6 flex w-full items-center justify-center gap-2 animate-cta-pulse"
        >
          MAG-POST NG JOB
        </Link>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-caption text-muted-gray">
          <Link
            href="/login?role=worker&next=/worker/setup"
            className="btn-ghost font-medium"
          >
            Mag-sign up as Worker
          </Link>
          <span className="text-muted-gray">·</span>
          <Link href="/how-it-works" className="btn-ghost inline-flex items-center gap-1">
            <HelpCircle className="h-4 w-4" strokeWidth={2} />
            Paano ito gumagana?
          </Link>
        </div>
      </section>

      {/* Workers near you */}
      <section className="pt-section">
        <h2 className="font-heading text-headline-mobile font-bold text-slate-text">
          Mga Worker Malapit Sayo
        </h2>
        {workers.length > 0 ? (
          <ul className="mt-3 space-y-card-gap">
            {workers.map((w, i) => (
              <li
                key={w.worker_id}
                className="animate-in"
                style={{
                  animationDelay: `${Math.min(i * 50, 200)}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <WorkerCard
                  worker={w}
                  href={`/workers/${w.worker_id}`}
                  showDistance={false}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="card-kumpuni mt-3 p-4 text-center">
            <p className="text-body text-slate-text">
              Mag-post ng job para makita ang workers malapit sayo.
            </p>
            <Link
              href="/login?role=homeowner&next=/jobs/new"
              className="btn-secondary mt-3 inline-flex w-full items-center justify-center"
            >
              MAG-POST NG JOB
            </Link>
          </div>
        )}
      </section>

      {/* Social proof */}
      <section className="pt-section text-center">
        <p className="text-body text-slate-text">
          <span className="font-mono font-semibold text-kumpuni-blue">
            {jobsCompletedThisMonth}
          </span>{" "}
          na trabaho natapos ngayong buwan
        </p>
      </section>

      {/* Trust bar */}
      <section className="pt-section border-t border-warm-border-input mt-6 pt-6">
        <div className="flex flex-wrap items-center justify-center gap-6 text-caption text-muted-gray">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-verified-green" strokeWidth={2} />
            Verified Workers
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Wrench className="h-4 w-4 text-kumpuni-blue" strokeWidth={2} />
            Free Gamitin
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CreditCard className="h-4 w-4 text-kumpuni-blue" strokeWidth={2} />
            Walang Hidden Fees
          </span>
        </div>
      </section>
    </main>
  );
}
