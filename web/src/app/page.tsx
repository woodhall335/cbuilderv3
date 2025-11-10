import Link from 'next/link';
import { SignedIn } from '@clerk/nextjs';
import AskWidget from '@/components/AskWidget';
import DocumentCard from '@/components/DocumentCard';
import { listDocumentSummaries } from '@/lib/catalog';

export default async function Home() {
  const [featuredContracts, featuredLetters] = await Promise.all([
    listDocumentSummaries({ kind: 'contract', limit: 3 }),
    listDocumentSummaries({ kind: 'letter', limit: 3 }),
  ]);

  return (
    <main className="space-y-16 pb-16">
      <section className="bg-gradient-to-br from-indigo-50 via-white to-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Contract Heaven · UK legal templates
            </span>
            <h1 className="text-4xl font-semibold text-neutral-900 md:text-5xl">
              Build compliant contracts, letters and claims packs tailored to your nation.
            </h1>
            <p className="text-lg text-neutral-600">
              Start free with curated templates for England & Wales, Scotland and Northern Ireland. Generate drafts in minutes, collaborate with your team, then upgrade for PDF packs, e-signatures and solicitor review.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/contracts"
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 font-medium text-white shadow hover:bg-indigo-500"
              >
                Browse contracts
              </Link>
              <Link
                href="/letters"
                className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 font-medium text-neutral-800 hover:border-neutral-400"
              >
                Explore letters
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[3fr,2fr]">
            <AskWidget />
            <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="space-y-3 text-sm text-neutral-700">
                <h2 className="text-lg font-semibold text-neutral-900">Why Contract Heaven?</h2>
                <p>
                  Curated templates reviewed by UK solicitors, dynamic forms that capture the facts of your scenario, and automated outputs ready for PDF, Word, or integrated signing.
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>Coverage for England & Wales, Scotland, and Northern Ireland.</li>
                  <li>Seven day editing window on every generation.</li>
                  <li>Optional upgrades for solicitor review, witness packs and e-signatures.</li>
                </ul>
              </div>
              <p className="mt-6 text-xs text-neutral-500">
                Contract Heaven provides self-serve documents curated by legal professionals. It is not a law firm and does not offer legal advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">Featured contracts</h2>
            <p className="text-sm text-neutral-600">Popular starting points in each jurisdiction.</p>
          </div>
          <Link href="/contracts" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View all contracts →
          </Link>
        </header>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {featuredContracts.map((document) => (
            <DocumentCard
              key={`${document.jurisdiction}-${document.slug}`}
              document={document}
              href={`/contracts/${document.jurisdiction}/${document.slug}`}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">Featured letters</h2>
            <p className="text-sm text-neutral-600">Direct, plain-language letters aligned with local rules.</p>
          </div>
          <Link href="/letters" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View all letters →
          </Link>
        </header>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {featuredLetters.map((document) => (
            <DocumentCard
              key={`${document.jurisdiction}-${document.slug}`}
              document={document}
              href={`/letters/${document.jurisdiction}/${document.slug}`}
            />
          ))}
        </div>
      </section>

      <SignedIn>
        <section className="mx-auto max-w-6xl px-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900">Jump back into your workspace</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Review saved drafts, download PDF packs and share documents with your clients.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700"
              >
                Open dashboard
              </Link>
              <Link
                href="/wizard/contract/uk-ew/nda-mutual"
                className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 font-medium text-neutral-800 hover:border-neutral-400"
              >
                Create a new contract
              </Link>
            </div>
          </div>
        </section>
      </SignedIn>
    </main>
  );
}
