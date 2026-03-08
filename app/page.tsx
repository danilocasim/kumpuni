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
      <section className="bg-gradient-to-br from-kumpuni-blue/10 via-surface-light to-white pt-6 pb-12 lg:py-16 border-b border-subtle relative overflow-hidden">
        {/* Abstract Background Design */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] rounded-full bg-kumpuni-blue/5 blur-3xl -z-10 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] rounded-full bg-action-orange/5 blur-3xl -z-10 animate-pulse" style={{ animationDuration: '6s' }}></div>
        
        <PageContainer>
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center relative z-10">
            <div className="animate-in" style={{ animationDuration: '800ms' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-subtle shadow-sm mb-6 animate-in" style={{ animationDelay: '100ms' }}>
                <span className="flex h-2 w-2 rounded-full bg-success-green animate-pulse"></span>
                <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Naglilingkod sa Metro Manila</span>
              </div>
              <h1 className="font-display text-4xl lg:text-5xl xl:text-6xl font-extrabold text-kumpuni-blue leading-tight tracking-tight mb-6 animate-in" style={{ animationDelay: '200ms', letterSpacing: "-1px" }}>
                Kailangan ng <span className="text-transparent bg-clip-text bg-gradient-to-r from-action-orange to-orange-400">kumpuni?</span>
              </h1>
              <p className="mt-4 text-lg lg:text-xl text-text-secondary font-body leading-relaxed max-w-lg mb-8 animate-in" style={{ animationDelay: '300ms' }}>
                Maghanap at kumonekta sa mga mapagkakatiwalaang kumpunero malapit sa iyo — palikuran, kuryente, karpintero, at iba pa.
              </p>
              <div className="animate-in" style={{ animationDelay: '400ms' }}>
                <Link
                  href="/login?role=homeowner&next=/jobs/new"
                  className="btn-primary flex w-full lg:w-fit items-center justify-center gap-3 text-lg py-4 shadow-xl active:scale-[0.98] transition-all overflow-hidden group relative"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                  <div className="flex items-center gap-3 relative z-10">
                    <span className="font-extrabold tracking-wide">MAGPA-KUMPUNI NA</span>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </div>
                  </div>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-text-tertiary font-body animate-in" style={{ animationDelay: '500ms' }}>
                <Link
                  href="/login?role=worker&next=/worker/setup"
                  className="btn-ghost font-medium px-2 py-1"
                >
                  Maging Kumpunero
                </Link>
                <div className="w-1.5 h-1.5 rounded-full bg-subtle hidden sm:block"></div>
                <Link href="/how-it-works" className="btn-ghost inline-flex items-center gap-1.5 px-2 py-1">
                  <HelpCircle className="h-4 w-4 text-kumpuni-blue/60" strokeWidth={2.5} />
                  <span className="font-bold text-text-secondary">Paano ito gumagana?</span>
                </Link>
              </div>
            </div>
            {/* Desktop: decorative / preview */}
            <div className="hidden lg:flex lg:justify-end lg:items-center relative animate-in zoom-in-95 duration-700" style={{ animationDelay: '300ms' }}>
              <div className="w-[380px] h-[380px] rounded-full bg-white shadow-2xl flex items-center justify-center border-8 border-white relative z-10 group cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-kumpuni-blue/5 to-transparent z-0"></div>
                <div className="w-[340px] h-[340px] rounded-full bg-kumpuni-blue/5 flex items-center justify-center border border-white/50 backdrop-blur-sm z-10 transition-transform duration-700 group-hover:scale-105">
                  <div className="w-36 h-36 rounded-kumpuni-xl bg-gradient-to-br from-action-orange to-orange-500 flex items-center justify-center shadow-2xl transform rotate-6 group-hover:rotate-0 transition-transform duration-500 relative ring-4 ring-white/50">
                    <div className="absolute inset-0 bg-white/20 rounded-kumpuni-xl mix-blend-overlay"></div>
                    <Wrench className="w-16 h-16 text-white relative z-10" strokeWidth={2} />
                  </div>
                </div>
              </div>
              
              {/* Floating badges */}
              <div className="absolute -left-8 top-12 bg-white px-4 py-3 rounded-2xl shadow-xl border border-subtle flex items-center gap-3 z-20 animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '600ms' }}>
                 <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-success-green" />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Trusted</p>
                    <p className="text-sm font-extrabold text-text-primary">Verified Workers</p>
                 </div>
              </div>
              
              <div className="absolute -right-4 bottom-24 bg-white px-4 py-3 rounded-2xl shadow-xl border border-subtle flex items-center gap-3 z-20 animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '800ms' }}>
                 <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                    <span className="text-action-orange font-black text-lg">★</span>
                 </div>
                 <div>
                    <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Quality</p>
                    <p className="text-sm font-extrabold text-text-primary">Highly Rated</p>
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
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl lg:text-4xl font-extrabold text-text-primary tracking-tight mb-2">
                Mga Kumpunero Malapit Sa'yo
              </h2>
              <div className="w-16 h-1 bg-action-orange rounded-full mb-4"></div>
              <p className="text-base text-text-tertiary">Available at pwedeng kontakin sa loob ng iyong barangay.</p>
            </div>
            <Link href="/login?role=homeowner&next=/jobs/new" className="text-sm font-bold text-kumpuni-blue hover:text-action-orange hover:translate-x-1 transition-all flex items-center gap-1.5 mt-2 sm:mt-0 bg-white px-4 py-2 rounded-lg shadow-sm border border-subtle">
              <span>Makita Lahat</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
          </div>
          {workers.length > 0 ? (
            <ul className="grid gap-5 sm:gap-6 lg:grid-cols-2 lg:gap-8">
              {workers.map((w, i) => (
                <li
                  key={w.worker_id}
                  className="animate-in group h-full"
                  style={{
                    animationDelay: `${Math.min(i * 100, 500)}ms`,
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
