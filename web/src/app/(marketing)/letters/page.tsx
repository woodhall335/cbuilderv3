import DocumentCard from '@/components/DocumentCard';
import { listDocumentSummaries } from '@/lib/catalog';
import { getJurisdictionLabel } from '@/lib/jurisdictions';

export const metadata = {
  title: 'Letter templates for the UK | Contract Heaven',
  description:
    'Demand letters, notices and follow-up correspondence tailored for England & Wales, Scotland and Northern Ireland.',
};

export default async function LettersPage() {
  const documents = await listDocumentSummaries({ kind: 'letter' });
  const grouped = documents.reduce<Record<string, typeof documents>>((acc, doc) => {
    if (!acc[doc.jurisdiction]) {
      acc[doc.jurisdiction] = [];
    }
    acc[doc.jurisdiction].push(doc);
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-16">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-neutral-900">Letter templates</h1>
        <p className="text-neutral-600">
          Polished correspondence to chase payments, give notice or make formal requests. Personalise the facts and download a branded PDF instantly.
        </p>
      </header>

      <div className="space-y-12">
        {Object.entries(grouped).map(([jurisdiction, items]) => (
          <section key={jurisdiction} className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">
                {getJurisdictionLabel(jurisdiction)}
              </h2>
              <p className="text-sm text-neutral-600">{items.length} curated letters.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {items.map((document) => (
                <DocumentCard
                  key={`${document.jurisdiction}-${document.slug}`}
                  document={document}
                  href={`/letters/${document.jurisdiction}/${document.slug}`}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
