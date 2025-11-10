import type { DocumentKind } from '@/types/blueprint';
import { listDocumentSummaries, searchDocuments } from '@/lib/catalog';
import { getJurisdictionLabel } from '@/lib/jurisdictions';

export type AskRequest = {
  question: string;
  jurisdiction?: string | null;
  preferredKind?: DocumentKind | null;
};

export type AskResponse = {
  answer: string;
  suggestions: {
    kind: DocumentKind;
    slug: string;
    jurisdiction: string;
    title: string;
    summary: string;
  }[];
};

const KIND_HINTS: Record<string, DocumentKind> = {
  contract: 'contract',
  agreement: 'contract',
  letter: 'letter',
  resign: 'letter',
  tenancy: 'contract',
  employment: 'contract',
};

function inferKind(question: string): DocumentKind | null {
  const lower = question.toLowerCase();
  for (const [hint, kind] of Object.entries(KIND_HINTS)) {
    if (lower.includes(hint)) {
      return kind;
    }
  }
  return null;
}

export async function askCatalog({
  question,
  jurisdiction,
  preferredKind,
}: AskRequest): Promise<AskResponse> {
  const trimmed = question.trim();
  if (!trimmed) {
    return {
      answer: 'Ask a question about the document you need and we will point you in the right direction.',
      suggestions: [],
    };
  }

  const kind = preferredKind ?? inferKind(trimmed);
  const suggestions = await searchDocuments(trimmed, {
    jurisdiction: jurisdiction ?? undefined,
    kind: kind ?? undefined,
    limit: 5,
  });

  if (!suggestions.length) {
    const alternatives = await listDocumentSummaries({ limit: 3 });
    return {
      answer:
        'I could not find a perfect match, but here are popular documents that other customers start with.',
      suggestions: alternatives.map((doc) => ({
        kind: doc.kind,
        slug: doc.slug,
        jurisdiction: doc.jurisdiction,
        title: doc.title,
        summary: doc.summary,
      })),
    };
  }

  const best = suggestions[0];
  const friendlyJurisdiction = getJurisdictionLabel(best.jurisdiction);
  const answer = `Based on what you told us, the ${best.title} for ${friendlyJurisdiction} looks like the right starting point.`;

  return {
    answer,
    suggestions: suggestions.map((doc) => ({
      kind: doc.kind,
      slug: doc.slug,
      jurisdiction: doc.jurisdiction,
      title: doc.title,
      summary: doc.summary,
    })),
  };
}
