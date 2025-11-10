export const metadata = {
  title: 'Analysis tools | Contract Heaven',
  description:
    'Document analyzers, translation workflows and watermarking utilities to help you prepare professional packs.',
};

const tools = [
  {
    title: 'Document analyzer',
    summary:
      'Upload a third-party contract and receive a clause-by-clause risk summary mapped to UK law references.',
    availability: 'Coming soon',
  },
  {
    title: 'Plain-language translation',
    summary: 'Convert legal jargon into an easy-to-share executive summary for clients or stakeholders.',
    availability: 'In beta',
  },
  {
    title: 'Watermarking & redaction',
    summary: 'Remove personal data, apply watermarks and prepare bundles for disclosure.',
    availability: 'Planned',
  },
];

export default function ToolsPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-16">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-neutral-900">Workspace tools</h1>
        <p className="text-neutral-600">
          Beyond document generation we are building utilities that analyse, translate and bundle your legal paperwork. Leave your email to join the beta cohorts.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {tools.map((tool) => (
          <article
            key={tool.title}
            className="flex h-full flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-neutral-900">{tool.title}</h2>
              <p className="text-sm text-neutral-600">{tool.summary}</p>
            </div>
            <span className="mt-6 inline-flex w-fit items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              {tool.availability}
            </span>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-neutral-900">Join the beta</h2>
        <p className="mt-2 text-sm text-neutral-600">
          We release new tools to a small cohort every month. Share your email and we will keep you posted.
        </p>
        <form className="mt-4 flex flex-col gap-2 text-sm md:flex-row">
          <label className="flex-1">
            <span className="sr-only">Email address</span>
            <input
              type="email"
              required
              placeholder="name@example.com"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500"
          >
            Notify me
          </button>
        </form>
      </section>
    </main>
  );
}
