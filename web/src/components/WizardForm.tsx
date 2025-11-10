'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { BlueprintDocument, BlueprintField } from '@/types/blueprint';
import type { DocumentKind } from '@/types/blueprint';
import {
  saveDocumentToStorage,
  type StoredDocument,
} from '@/lib/storage';
import { getJurisdictionLabel } from '@/lib/jurisdictions';

type Props = {
  document: BlueprintDocument;
};

type FormValues = Record<string, string>;

type GenerateResponse = {
  html: string;
  metadata: {
    title: string;
    kind: DocumentKind;
    jurisdiction: string;
    slug: string;
    category?: string;
  };
  certificate: BlueprintDocument['certificate'] | null;
  lawPack: NonNullable<BlueprintDocument['lawPack']>;
  answers: Record<string, string>;
  error?: string;
};

function fieldPlaceholder(field: BlueprintField) {
  if (field.placeholder) return field.placeholder;
  if (field.type === 'date') return 'DD/MM/YYYY';
  if (field.type === 'email') return 'name@example.com';
  if (field.type === 'address') return 'Line 1\nLine 2\nTown\nPostcode';
  return '';
}

export default function WizardForm({ document }: Props) {
  const defaultValues = Object.fromEntries(
    document.sections.flatMap((section) => section.fields.map((field) => [field.id, ''])),
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues });

  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setError(null);
    setSavedMessage(null);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: document.kind,
          jurisdiction: document.jurisdiction,
          slug: document.slug,
          answers: values,
        }),
      });

      if (!response.ok) {
        const { error: message } = await response.json();
        throw new Error(message ?? 'Unable to generate document');
      }

      const data = (await response.json()) as GenerateResponse;
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  });

  const saveToDashboard = () => {
    if (!result) return;
    const documentToStore: StoredDocument = {
      id: `${result.metadata.slug}-${Date.now()}`,
      metadata: result.metadata,
      html: result.html,
      answers: result.answers,
      generatedAt: new Date().toISOString(),
    };
    saveDocumentToStorage(documentToStore);
    setSavedMessage('Saved to your dashboard');
  };

  const jurisdictionLabel = getJurisdictionLabel(document.jurisdiction);

  function renderField(field: BlueprintField) {
    if (field.type === 'select' && field.options) {
      return (
        <select
          {...register(field.id, { required: field.required })}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Select…</option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    const common = {
      ...register(field.id, { required: field.required }),
      className:
        'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-0',
      placeholder: fieldPlaceholder(field),
    } as const;

    if (field.type === 'textarea' || field.type === 'address') {
      return <textarea {...common} rows={field.type === 'address' ? 4 : 3} />;
    }

    const inputType = field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type;
    return <input type={inputType} {...common} />;
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[2fr,1fr]">
      <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            {document.kind === 'contract' ? 'Contract wizard' : 'Letter wizard'} · {jurisdictionLabel}
          </p>
          <h1 className="text-2xl font-semibold text-neutral-900">{document.title}</h1>
          <p className="text-sm text-neutral-600">Provide the details below to generate your tailored draft.</p>
        </header>

        {document.sections.map((section) => (
          <section key={section.id} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">{section.title}</h2>
              {section.description && (
                <p className="text-sm text-neutral-600">{section.description}</p>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {section.fields.map((field) => (
                <label key={field.id} className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-neutral-700">
                    {field.label}
                    {field.required && <span className="ml-1 text-red-500">*</span>}
                  </span>
                  {renderField(field)}
                  {field.helpText && (
                    <span className="text-xs text-neutral-500">{field.helpText}</span>
                  )}
                  {errors[field.id] && (
                    <span className="text-xs text-red-600">This field is required.</span>
                  )}
                </label>
              ))}
            </div>
          </section>
        ))}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {submitting ? 'Generating…' : 'Generate preview'}
        </button>
      </form>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Preview</h2>
          <p className="mt-1 text-sm text-neutral-600">
            After you generate a draft it will appear here. You can make changes and generate again as many times as you like.
          </p>
          {result ? (
            <div className="mt-4 space-y-4">
              <div className="rounded border border-neutral-200 bg-white">
                <div className="border-b border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700">
                  {result.metadata.title}
                </div>
                <div className="ch-document px-4 py-4 text-sm" dangerouslySetInnerHTML={{ __html: result.html }} />
              </div>
              {result.certificate && (
                <div className="rounded border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                  <p className="font-medium">Certificate</p>
                  <p className="mt-1">{result.certificate.statement}</p>
                </div>
              )}
              {result.lawPack && result.lawPack.length > 0 && (
                <div className="rounded border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                  <p className="font-medium">Legal references</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {result.lawPack.map((item, index) => (
                      <li key={index}>{item.cite}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={saveToDashboard}
                  className="rounded-md border border-indigo-600 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  Save to dashboard
                </button>
                {savedMessage && <span className="text-xs text-neutral-500">{savedMessage}</span>}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded border border-dashed border-neutral-300 px-4 py-10 text-center text-sm text-neutral-500">
              No preview yet.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
          <h3 className="text-sm font-semibold text-neutral-900">How it works</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Answer the prompts and generate a preview.</li>
            <li>Save the draft to your dashboard.</li>
            <li>When you are ready you can export or e-sign the document.</li>
          </ol>
        </div>
      </aside>
    </div>
  );
}
