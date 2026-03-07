import Link from "next/link";

export default function HowItWorksPage() {
  const steps = [
    {
      num: 1,
      title: "Mag-post ng Job",
      desc: "Ilagay ang problema mo, lokasyon, at kailangan mo ba ASAP o pwedeng this week. May option din para sa budget.",
    },
    {
      num: 2,
      title: "Makipag-match sa worker",
      desc: "Para sa urgent (ASAP), may 15-min countdown at real-time list ng interested workers. Para sa scheduled, browse at i-compare ang workers na malapit sa'yo.",
    },
    {
      num: 3,
      title: "Trabaho na",
      desc: "Pag napili na ang worker, makikita niyo ang contact at address. Diretso na ang usapan at bayaran—cash. Pagkatapos, mag-rate kayo isa't isa.",
    },
  ];

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-lg mx-auto py-8">
        <h1 className="text-2xl font-bold text-center mb-2">
          Paano ito gumagana?
        </h1>
        <p className="text-center text-gray-600 mb-10">
          Tatlong hakbang lang para makahanap ng skilled worker.
        </p>

        <ol className="space-y-8">
          {steps.map((step) => (
            <li key={step.num} className="flex gap-4">
              <span
                className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold"
                aria-hidden
              >
                {step.num}
              </span>
              <div>
                <h2 className="font-semibold text-lg">{step.title}</h2>
                <p className="text-gray-600 mt-1">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="min-h-touch min-w-touch inline-flex items-center justify-center px-6 rounded-lg bg-blue-600 text-white font-medium"
          >
            Mag-post ng Job
          </Link>
        </div>
      </div>
    </main>
  );
}
