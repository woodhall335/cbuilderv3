'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { DocumentKind } from '@/types/blueprint';
import { getJurisdictionLabel, SUPPORTED_JURISDICTIONS } from '@/lib/jurisdictions';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: {
    kind: DocumentKind;
    slug: string;
    jurisdiction: string;
    title: string;
    summary: string;
  }[];
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: 'Ask anything – “Need a staff contract for a bar in Glasgow” or “Help me chase a rental deposit in Belfast”.',
};

const KIND_OPTIONS: { label: string; value: DocumentKind | 'any' }[] = [
  { label: 'Any', value: 'any' },
  { label: 'Contracts', value: 'contract' },
  { label: 'Letters', value: 'letter' },
];

export default function AskWidget() {
  const [question, setQuestion] = useState('');
  const [jurisdiction, setJurisdiction] = useState<string>('');
  const [kind, setKind] = useState<DocumentKind | 'any'>('any');
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) {
      return;
    }
    const payload = question.trim();
    setMessages((prev) => [...prev, { role: 'user', content: payload }]);
    setQuestion('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: payload,
          jurisdiction: jurisdiction || null,
          kind: kind === 'any' ? null : kind,
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to reach Ask Heaven right now.');
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer as string,
          suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        },
      ]);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm">
      <header className="flex flex-col gap-2 border-b border-neutral-200 pb-4">
        <h2 className="text-xl font-semibold text-neutral-900">Ask Heaven</h2>
        <p className="text-sm text-neutral-600">
          Describe your scenario and we will line up the best templates for your jurisdiction.
        </p>
      </header>
      <div className="mt-4 flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 md:flex-row">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="font-medium text-neutral-700">Jurisdiction</span>
              <select
                value={jurisdiction}
                onChange={(event) => setJurisdiction(event.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Any location</option>
                {SUPPORTED_JURISDICTIONS.map((code) => (
                  <option key={code} value={code}>
                    {getJurisdictionLabel(code)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="font-medium text-neutral-700">Document type</span>
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as DocumentKind | 'any')}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {KIND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="ask-question" className="text-sm font-medium text-neutral-700">
              Your question
            </label>
            <textarea
              id="ask-question"
              required
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="e.g. Need a short-term service agreement for a freelance designer in Manchester"
              className="min-h-[96px] rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {loading ? 'Thinking…' : 'Ask Heaven'}
            </button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </form>

        <div className="flex flex-col gap-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`rounded-lg border px-4 py-3 text-sm ${
                message.role === 'assistant'
                  ? 'border-indigo-100 bg-white text-neutral-800'
                  : 'border-neutral-200 bg-neutral-100 text-neutral-800'
              }`}
            >
              <p>{message.content}</p>
              {message.suggestions && message.suggestions.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {message.suggestions.map((suggestion) => (
                    <li key={`${suggestion.kind}-${suggestion.jurisdiction}-${suggestion.slug}`}>
                      <Link
                        href={`/${suggestion.kind === 'contract' ? 'contracts' : 'letters'}/${suggestion.jurisdiction}/${suggestion.slug}`}
                        className="group flex flex-col gap-1 rounded-md border border-neutral-200 px-3 py-2 hover:border-indigo-300 hover:bg-indigo-50"
                      >
                        <span className="text-sm font-semibold text-indigo-700 group-hover:text-indigo-600">
                          {suggestion.title}
                        </span>
                        <span className="text-xs text-neutral-600">{suggestion.summary}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
