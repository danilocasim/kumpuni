import Link from "next/link";
import { PageContainer } from "@/components/PageContainer";

export default function HowItWorksPage() {
  const steps = [
    {
      num: 1,
      title: "Post a job",
      desc: "Describe the problem, set your location, and choose ASAP or this week. You can also set a budget range.",
    },
    {
      num: 2,
      title: "Match with a worker",
      desc: "For urgent (ASAP) jobs, there’s a 15-minute countdown and a real-time list of interested workers. For scheduled jobs, browse and compare workers near you.",
    },
    {
      num: 3,
      title: "Get it done",
      desc: "Once you pick a worker, you’ll see their contact and address. Coordinate and pay in cash. Then rate each other.",
    },
  ];

  return (
    <main className="min-h-screen page-bg pt-6 pb-12">
      <PageContainer>
        <h1 className="font-display text-2xl lg:text-[28px] font-bold text-slate-text text-center mb-2 tracking-tight" style={{ letterSpacing: "-0.3px" }}>
          How it works
        </h1>
        <p className="text-center text-muted-gray font-body text-[15px] mb-10">
          Three simple steps to find a skilled worker.
        </p>

        <ol className="space-y-8">
          {steps.map((step) => (
            <li key={step.num} className="flex gap-4">
              <span
                className="flex-shrink-0 w-10 h-10 rounded-full bg-kumpuni-blue text-white flex items-center justify-center font-display font-bold"
                aria-hidden
              >
                {step.num}
              </span>
              <div>
                <h2 className="font-display font-bold text-[20px] lg:text-[22px] text-slate-text">{step.title}</h2>
                <p className="text-muted-gray font-body text-[15px] mt-1">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="btn-primary inline-flex items-center justify-center"
          >
            POST A JOB
          </Link>
        </div>
      </PageContainer>
    </main>
  );
}
