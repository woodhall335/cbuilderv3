import Link from 'next/link';
import { getJurisdictionLabel } from '@/lib/jurisdictions';
import type { DocumentSummary } from '@/types/blueprint';

type Props = {
  document: DocumentSummary;
  href: string;
  actionLabel?: string;
};

export default function DocumentCard({ document, href, actionLabel = 'View details' }: Props) {
  const jurisdiction = getJurisdictionLabel(document.jurisdiction);
  return (
    <article className="flex h-full flex-col justify-between rounded-lg border bg-white p-4 shadow-sm">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wide text-neutral-500">
          <span>{document.kind === 'contract' ? 'Contract' : 'Letter'}</span>
          <span className="rounded bg-neutral-100 px-2 py-0.5 text-neutral-700">{jurisdiction}</span>
        </div>
        <h3 className="mt-3 text-lg font-semibold text-neutral-900">{document.title}</h3>
        <p className="mt-2 text-sm text-neutral-600">{document.summary}</p>
        {document.category && (
          <p className="mt-3 text-xs font-medium uppercase text-indigo-600">{document.category}</p>
        )}
      </div>
      <div className="mt-6 flex items-center justify-between text-sm">
        <Link
          href={href}
          className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 font-medium text-neutral-900 transition hover:border-neutral-400 hover:text-neutral-700"
        >
          {actionLabel}
          <span aria-hidden="true">→</span>
        </Link>
        <span className="text-xs text-neutral-400">v{document.version}</span>
      </div>
    </article>
  );
}
