import Link from "next/link";
import { getLandingData } from "@/lib/get-landing-data";
import { WorkerCard } from "@/components/WorkerCard";
import { PageContainer } from "@/components/PageContainer";
import { Wrench, ShieldCheck, CreditCard, HelpCircle } from "lucide-react";

export default async function Home() {
  const { workers, jobsCompletedThisMonth } = await getLandingData();

  return (
    <main className="min-h-screen page-bg">
      {/* Hero: light blue tint block, 2-col on desktop */}
      <section className="bg-kumpuni-blue/5 pt-6 pb-8 lg:py-10">
        <PageContainer>
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            <div>
              <h1 className="font-display text-2xl lg:text-[28px] font-bold text-slate-text leading-tight tracking-tight" style={{ letterSpacing: "-0.3px" }}>
                Need a repair or upgrade?
              </h1>
              <p className="mt-3 text-[15px] text-slate-text font-body leading-relaxed">
                Find verified workers near you — plumbers, electricians,
                carpenters, and more.
              </p>
              <Link
                href="/login?role=homeowner&next=/jobs/new"
                className="btn-primary mt-6 flex w-full lg:w-auto items-center justify-center gap-2 animate-cta-pulse"
              >
                POST A JOB
              </Link>
              <div className="mt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-[13px] text-muted-gray font-body">
                <Link
                  href="/login?role=worker&next=/worker/setup"
                  className="btn-ghost font-medium"
                >
                  Sign up as Worker
                </Link>
                <span className="text-muted-gray">·</span>
                <Link href="/how-it-works" className="btn-ghost inline-flex items-center gap-1">
                  <HelpCircle className="h-4 w-4" strokeWidth={2} />
                  How it works
                </Link>
              </div>
            </div>
            {/* Desktop: decorative / preview */}
            <div className="hidden lg:flex lg:justify-center lg:items-center">
              <div className="w-48 h-48 rounded-kumpuni-lg bg-action-orange/10 flex items-center justify-center">
                <Wrench className="w-24 h-24 text-action-orange/30" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Social proof strip */}
      <section className="bg-concrete-white py-4 border-y border-warm-border-input">
        <PageContainer>
          <p className="text-center text-[15px] text-slate-text font-body">
            <span className="font-mono font-semibold text-action-orange text-lg">
              {jobsCompletedThisMonth}
            </span>{" "}
            jobs completed this month
          </p>
        </PageContainer>
      </section>

      {/* Trust bar */}
      <section className="py-6">
        <PageContainer>
          <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-12 text-[13px] text-muted-gray font-body">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-verified-green shrink-0" strokeWidth={2} />
              Verified Workers
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-verified-green shrink-0" strokeWidth={2} />
              Free to Use
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-verified-green shrink-0" strokeWidth={2} />
              No Hidden Fees
            </span>
          </div>
        </PageContainer>
      </section>

      {/* Workers near you */}
      <section className="pt-6 pb-12">
        <PageContainer>
          <h2 className="font-display text-xl lg:text-[22px] font-bold text-slate-text mb-4">
            Workers Near You
          </h2>
          {workers.length > 0 ? (
            <ul className="grid gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-4">
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
            <div className="card-kumpuni p-4 lg:p-5 text-center">
              <p className="text-[15px] text-slate-text font-body">
                Post a job to see workers near you.
              </p>
            </div>
          )}
        </PageContainer>
      </section>
    </main>
  );
}
