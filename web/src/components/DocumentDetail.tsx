import Link from 'next/link';
import { getJurisdictionLabel } from '@/lib/jurisdictions';
import type { BlueprintDocument } from '@/types/blueprint';

type Props = {
  document: BlueprintDocument;
  ctaHref: string;
  ctaLabel?: string;
};

export default function DocumentDetail({ document, ctaHref, ctaLabel = 'Start building' }: Props) {
  const jurisdictionLabel = getJurisdictionLabel(document.jurisdiction);
  return (
    <article className="mx-auto max-w-4xl space-y-10 px-4 py-10">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-neutral-500">
          <span>{document.kind === 'contract' ? 'Contract' : 'Letter'}</span>
          <span className="rounded bg-neutral-100 px-2 py-0.5 text-neutral-700">{jurisdictionLabel}</span>
          {document.category && <span className="font-semibold text-indigo-600">{document.category}</span>}
        </div>
        <h1 className="text-3xl font-semibold text-neutral-900">{document.title}</h1>
        <p className="text-neutral-600">{document.summary}</p>
        <div className="flex flex-wrap gap-3 text-sm text-neutral-600">
          <span>Version {document.version}</span>
          {document.lawPack && document.lawPack.length > 0 && (
            <span>
              References:{' '}
              {document.lawPack.map((item) => item.cite).join(', ')}
            </span>
          )}
        </div>
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-500"
        >
          {ctaLabel}
          <span aria-hidden>→</span>
        </Link>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">What’s inside</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {document.sections.map((section) => (
            <div key={section.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-neutral-800">{section.title}</h3>
              {section.description && (
                <p className="mt-1 text-xs text-neutral-500">{section.description}</p>
              )}
              <ul className="mt-2 space-y-1 text-xs text-neutral-600">
                {section.fields.map((field) => (
                  <li key={field.id}>
                    <span className="font-medium text-neutral-700">{field.label}</span>
                    {field.required && <span className="ml-1 text-red-500">*</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {document.seo?.guide && document.seo?.guide.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-900">Guided walkthrough</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-600">
            {document.seo.guide.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {document.seo?.faqs && document.seo.faqs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-neutral-900">Frequently asked questions</h2>
          <dl className="space-y-2">
            {document.seo.faqs.map((faq, index) => (
              <div key={index} className="rounded-lg border border-neutral-200 bg-white p-4">
                <dt className="text-sm font-semibold text-neutral-800">{faq.q}</dt>
                <dd className="mt-1 text-sm text-neutral-600">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </article>
  );
}
