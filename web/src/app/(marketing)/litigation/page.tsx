export const metadata = {
  title: 'Claims packs & litigation support | Contract Heaven',
  description:
    'Guided packs for small claims, employment tribunals and debt recovery across the UK.',
};

const packs = [
  {
    title: 'Small claims guide',
    summary:
      'Step-by-step pack for claims under £10,000, including particulars of claim templates and evidence bundle checklists.',
    availability: 'Launching Q1 2025',
  },
  {
    title: 'Employment tribunal response',
    summary: 'Collect the facts, generate ET3 responses and manage disclosure timelines.',
    availability: 'Launching Q2 2025',
  },
  {
    title: 'Debt recovery pathway',
    summary: 'From letter before action to statutory demand, build a tailored pack for each debtor.',
    availability: 'In research',
  },
];

export default function LitigationPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-16">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-neutral-900">Claims packs</h1>
        <p className="text-neutral-600">
          Litigation support is in active development. Tell us about your matter and we will prioritise the packs that help most.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {packs.map((pack) => (
          <article
            key={pack.title}
            className="flex h-full flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-neutral-900">{pack.title}</h2>
              <p className="text-sm text-neutral-600">{pack.summary}</p>
            </div>
            <span className="mt-6 inline-flex w-fit items-center rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
              {pack.availability}
            </span>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-neutral-900">Tell us about your dispute</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Share a few details and our team will let you know when the right pack is ready. You can also request a bespoke workflow.
        </p>
        <form className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-medium text-neutral-700">Name</span>
            <input
              type="text"
              required
              className="rounded-md border border-neutral-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium text-neutral-700">Email</span>
            <input
              type="email"
              required
              className="rounded-md border border-neutral-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <label className="md:col-span-2 flex flex-col gap-1">
            <span className="font-medium text-neutral-700">Matter summary</span>
            <textarea
              required
              rows={4}
              className="rounded-md border border-neutral-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="md:col-span-2 rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700"
          >
            Submit
          </button>
        </form>
      </section>
    </main>
  );
}
