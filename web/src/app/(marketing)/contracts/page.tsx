import DocumentCard from '@/components/DocumentCard';
import { listDocumentSummaries } from '@/lib/catalog';
import { getJurisdictionLabel } from '@/lib/jurisdictions';

export const metadata = {
  title: 'Contract templates for the UK | Contract Heaven',
  description:
    'Browse curated contract templates for England & Wales, Scotland and Northern Ireland across employment, business, property and lending.',
};

export default async function ContractsPage() {
  const documents = await listDocumentSummaries({ kind: 'contract' });
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
        <h1 className="text-3xl font-semibold text-neutral-900">Contract templates</h1>
        <p className="text-neutral-600">
          Ready-to-run contracts curated for each UK jurisdiction. Start free, then upgrade to export professionally branded packs and unlock e-signatures.
        </p>
      </header>

      <div className="space-y-12">
        {Object.entries(grouped).map(([jurisdiction, items]) => (
          <section key={jurisdiction} className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">
                {getJurisdictionLabel(jurisdiction)}
              </h2>
              <p className="text-sm text-neutral-600">{items.length} curated contracts.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {items.map((document) => (
                <DocumentCard
                  key={`${document.jurisdiction}-${document.slug}`}
                  document={document}
                  href={`/contracts/${document.jurisdiction}/${document.slug}`}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
