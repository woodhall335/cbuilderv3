import { promises as fs } from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import type {
  BlueprintDocument,
  DocumentKind,
  DocumentSummary,
} from '@/types/blueprint';

const BLUEPRINT_ROOT = path.join(process.cwd(), 'src', 'blueprints');
const LETTER_ROOT = path.join(process.cwd(), 'src', 'letters');

const ROOT_BY_KIND: Record<DocumentKind, string> = {
  contract: BLUEPRINT_ROOT,
  letter: LETTER_ROOT,
};

export type LoadedDocument = {
  kind: DocumentKind;
  data: BlueprintDocument;
  jurisdiction: string;
  filePath: string;
};

const readDocumentFile = cache(async (filePath: string) => {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as BlueprintDocument;
});

const loadDocumentsForKind = cache(async (kind: DocumentKind) => {
  const root = ROOT_BY_KIND[kind];
  const jurisdictions = await fs.readdir(root);
  const documents: LoadedDocument[] = [];

  for (const jurisdiction of jurisdictions) {
    const dir = path.join(root, jurisdiction);
    const entries = await fs.readdir(dir);
    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue;
      const filePath = path.join(dir, entry);
      const data = await readDocumentFile(filePath);
      documents.push({
        kind,
        data,
        jurisdiction,
        filePath,
      });
    }
  }

  return documents;
});

const ensureKind = (kind: string | null): DocumentKind | null => {
  if (kind === 'contract' || kind === 'letter') return kind;
  return null;
};

export const listDocumentSummaries = cache(
  async (options: {
    kind?: DocumentKind;
    jurisdiction?: string;
    search?: string;
    limit?: number;
  } = {}): Promise<DocumentSummary[]> => {
    const kinds = options.kind ? [options.kind] : (['contract', 'letter'] as DocumentKind[]);
    const documents = (
      await Promise.all(kinds.map((kind) => loadDocumentsForKind(kind)))
    ).flat();

    const searchTokens = (options.search ?? '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);

    const filtered = documents.filter(({ data, jurisdiction }) => {
      if (options.jurisdiction && jurisdiction !== options.jurisdiction) {
        return false;
      }
      if (searchTokens.length) {
        const haystack = `${data.title} ${data.summary} ${data.category ?? ''}`.toLowerCase();
        return searchTokens.every((token) => haystack.includes(token));
      }
      return true;
    });

    const summaries = filtered.map<DocumentSummary>(({ kind, data }) => ({
      kind,
      slug: data.slug,
      title: data.title,
      jurisdiction: data.jurisdiction,
      category: data.category,
      summary: data.summary,
      version: data.version,
      lawPackCitations: (data.lawPack ?? []).map((item) => item.cite),
    }));

    summaries.sort((a, b) => a.title.localeCompare(b.title));
    return typeof options.limit === 'number' ? summaries.slice(0, options.limit) : summaries;
  },
);

export const getDocument = cache(
  async (
    kind: DocumentKind,
    jurisdiction: string,
    slug: string,
  ): Promise<BlueprintDocument | null> => {
    const documents = await loadDocumentsForKind(kind);
    const match = documents.find(
      (doc) => doc.jurisdiction === jurisdiction && doc.data.slug === slug,
    );
    return match?.data ?? null;
  },
);

export async function getDocumentOrThrow(
  kind: DocumentKind,
  jurisdiction: string,
  slug: string,
): Promise<BlueprintDocument> {
  const document = await getDocument(kind, jurisdiction, slug);
  if (!document) {
    throw new Error(`Document not found for ${kind}:${jurisdiction}/${slug}`);
  }
  return document;
}

export async function listJurisdictions(kind?: DocumentKind) {
  if (kind) {
    const documents = await loadDocumentsForKind(kind);
    return Array.from(new Set(documents.map((doc) => doc.jurisdiction))).sort();
  }
  const [contractJ, letterJ] = await Promise.all([
    listJurisdictions('contract'),
    listJurisdictions('letter'),
  ]);
  return Array.from(new Set([...contractJ, ...letterJ])).sort();
}

export async function getDocumentPaths(kind: DocumentKind) {
  const documents = await loadDocumentsForKind(kind);
  return documents.map((doc) => ({
    jurisdiction: doc.jurisdiction,
    slug: doc.data.slug,
  }));
}

export function normaliseKind(value: string | null): DocumentKind | null {
  return ensureKind(value);
}

export type AskSuggestion = DocumentSummary & { score: number };

export async function searchDocuments(
  query: string,
  options: { jurisdiction?: string; kind?: DocumentKind; limit?: number } = {},
): Promise<AskSuggestion[]> {
  const kinds = options.kind ? [options.kind] : (['contract', 'letter'] as DocumentKind[]);
  const documents = (
    await Promise.all(kinds.map((kind) => loadDocumentsForKind(kind)))
  ).flat();

  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  if (!tokens.length) {
    return [];
  }

  const scored: AskSuggestion[] = [];
  for (const doc of documents) {
    if (options.jurisdiction && doc.jurisdiction !== options.jurisdiction) continue;
    const haystack = `${doc.data.title} ${doc.data.summary} ${doc.data.category ?? ''}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) {
        score += 1;
      }
    }
    if (!score) continue;
    scored.push({
      kind: doc.kind,
      slug: doc.data.slug,
      title: doc.data.title,
      jurisdiction: doc.data.jurisdiction,
      category: doc.data.category,
      summary: doc.data.summary,
      version: doc.data.version,
      lawPackCitations: (doc.data.lawPack ?? []).map((item) => item.cite),
      score,
    });
  }

  scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  const limit = options.limit ?? 5;
  return scored.slice(0, limit);
}
