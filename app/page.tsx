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
              <h1 className="font-display text-4xl lg:text-5xl font-extrabold text-kumpuni-blue leading-tight tracking-tight mb-4" style={{ letterSpacing: "-0.5px" }}>
                Kailangan ng <span className="text-action-orange flex-wrap inline-flex items-center gap-2">kumpuni?</span>
              </h1>
              <p className="mt-4 text-base lg:text-lg text-text-secondary font-body leading-relaxed max-w-lg">
                Maghanap at kumonekta sa mga mapagkakatiwalaang kumpunero malapit sa iyo — palikuran, kuryente, karpintero, at iba pa.
              </p>
              <Link
                href="/login?role=homeowner&next=/jobs/new"
                className="btn-primary mt-8 flex w-full lg:w-auto items-center justify-center gap-2 text-lg py-4 shadow-lg active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-wide">MAGPA-KUMPUNI NA</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </div>
              </Link>
              <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-text-tertiary font-body">
                <Link
                  href="/login?role=worker&next=/worker/setup"
                  className="btn-ghost font-medium px-2 py-1"
                >
                  Maging Kumpunero
                </Link>
                <span className="text-text-tertiary/50">|</span>
                <Link href="/how-it-works" className="btn-ghost inline-flex items-center gap-1.5 px-2 py-1">
                  <HelpCircle className="h-4 w-4" strokeWidth={2.5} />
                  <span className="font-medium">Paano ito gumagana?</span>
                </Link>
              </div>
            </div>
            {/* Desktop: decorative / preview */}
            <div className="hidden lg:flex lg:justify-end lg:items-center relative">
              <div className="absolute w-64 h-64 bg-action-orange/10 rounded-full blur-3xl mix-blend-multiply top-0 left-10"></div>
              <div className="absolute w-64 h-64 bg-kumpuni-blue/10 rounded-full blur-3xl mix-blend-multiply top-20 right-10"></div>

              <div className="w-[320px] h-[320px] rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-kumpuni-blue/5 relative z-10">
                <div className="w-[280px] h-[280px] rounded-full bg-kumpuni-blue/5 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-kumpuni-xl bg-gradient-to-br from-action-orange to-orange-600 flex items-center justify-center shadow-lg transform rotate-6 hover:rotate-0 transition-transform duration-500">
                    <Wrench className="w-16 h-16 text-white" strokeWidth={2} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Social proof strip */}
      <section className="bg-white py-5 border-y border-subtle relative z-20 shadow-sm">
        <PageContainer>
          <div className="flex items-center justify-center gap-3">
             <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-kumpuni-blue" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
             </div>
             <p className="text-center text-sm sm:text-base text-text-primary font-medium tracking-wide">
              Mula noong nakaraang buwan, <span className="font-extrabold text-action-orange text-lg sm:text-xl">
                {jobsCompletedThisMonth}+
              </span> na trabaho ang matagumpay na natapos.
            </p>
          </div>
        </PageContainer>
      </section>

      {/* Trust bar */}
      <section className="py-8 bg-surface-light border-b border-subtle">
        <PageContainer>
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-8 sm:gap-12 text-sm font-bold text-text-secondary w-full max-w-3xl mx-auto">
            <span className="flex items-center justify-center gap-3 w-full sm:w-auto bg-white sm:bg-transparent p-4 sm:p-0 rounded-xl sm:rounded-none shadow-sm sm:shadow-none border sm:border-none border-subtle">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                 <ShieldCheck className="h-4 w-4 text-success-green" strokeWidth={3} />
              </div>
              <div>Mga Beripikadong Kumpunero</div>
            </span>
            <span className="flex items-center justify-center gap-3 w-full sm:w-auto bg-white sm:bg-transparent p-4 sm:p-0 rounded-xl sm:rounded-none shadow-sm sm:shadow-none border sm:border-none border-subtle">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <CreditCard className="h-4 w-4 text-success-green" strokeWidth={3} />
              </div>
              <div>Walang Hidden Fees</div>
            </span>
          </div>
        </PageContainer>
      </section>

      {/* Workers near you */}
      <section className="pt-10 pb-16">
        <PageContainer>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl lg:text-3xl font-extrabold text-text-primary tracking-tight">
                Mga Kumpunero Malapit Sa'yo
              </h2>
              <p className="text-sm text-text-tertiary mt-1">Available at pwedeng kontakin sa loob ng iyong barangay.</p>
            </div>
            <Link href="/login?role=homeowner&next=/jobs/new" className="text-sm font-bold text-kumpuni-blue hover:text-action-orange transition-colors flex items-center gap-1 mt-2 sm:mt-0">
              <span>Mag-post ng trabaho upang Makita Lahat</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
          </div>
          {workers.length > 0 ? (
            <ul className="grid gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
              {workers.map((w, i) => (
                <li
                  key={w.worker_id}
                  className="animate-in group"
                  style={{
                    animationDelay: `${Math.min(i * 50, 200)}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  <div className="h-full transition-transform duration-300 group-hover:-translate-y-1">
                    <WorkerCard
                      worker={w}
                      href={`/login?next=/workers/${w.worker_id}`}
                      showDistance={false}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="card-kumpuni p-8 lg:p-12 text-center bg-gradient-to-b from-surface-light border-dashed border-2">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4 text-kumpuni-blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </div>
              <p className="text-lg font-bold text-text-primary mb-2">Walang Kumpunero na naka-display</p>
              <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">Gumawa ng job post para mas lalong mapadali ang paghahanap namin ng swak na kumpunero para sa'yo.</p>
              <Link href="/login?role=homeowner&next=/jobs/new" className="btn-primary">
                Mag-post ng Trabaho
              </Link>
            </div>
          )}
        </PageContainer>
      </section>
    </main>
  );
}
