'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  loadDocumentsFromStorage,
  removeDocumentFromStorage,
  type StoredDocument,
} from '@/lib/storage';
import { getJurisdictionLabel } from '@/lib/jurisdictions';

export function LocalDrafts() {
  const [documents, setDocuments] = useState<StoredDocument[]>(() => loadDocumentsFromStorage());

  const remove = (id: string) => {
    removeDocumentFromStorage(id);
    setDocuments(loadDocumentsFromStorage());
  };

  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 px-6 py-16 text-center">
        <p className="text-sm text-neutral-600">
          You have not saved any documents locally yet. Generate a draft in the wizard and click “Save to dashboard”.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {documents.map((document) => (
        <article key={document.id} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                {document.metadata.kind === 'contract' ? 'Contract' : 'Letter'} ·{' '}
                {getJurisdictionLabel(document.metadata.jurisdiction)}
              </p>
              <h2 className="text-xl font-semibold text-neutral-900">{document.metadata.title}</h2>
              <p className="text-sm text-neutral-500">Saved {new Date(document.generatedAt).toLocaleString()}</p>
            </div>
            <button
              type="button"
              onClick={() => remove(document.id)}
              className="text-sm font-medium text-red-600 hover:text-red-500"
            >
              Remove
            </button>
          </div>

          <details className="rounded border border-neutral-200">
            <summary className="cursor-pointer select-none bg-neutral-50 px-4 py-2 text-sm font-semibold text-neutral-700">
              Preview document
            </summary>
            <div className="ch-document px-4 py-4 text-sm" dangerouslySetInnerHTML={{ __html: document.html }} />
          </details>
        </article>
      ))}
    </div>
  );
}

export function LocalDraftsCta() {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <Link
        href="/contracts"
        className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 font-medium text-neutral-800 hover:border-neutral-400"
      >
        Start a new contract
      </Link>
      <Link
        href="/letters"
        className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 font-medium text-neutral-800 hover:border-neutral-400"
      >
        Start a new letter
      </Link>
    </div>
  );
}
