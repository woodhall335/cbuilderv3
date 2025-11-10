export const DASHBOARD_STORAGE_KEY = 'contract-heaven-documents';

export type StoredDocument = {
  id: string;
  metadata: {
    title: string;
    kind: 'contract' | 'letter';
    jurisdiction: string;
    slug: string;
    category?: string;
  };
  html: string;
  answers: Record<string, string>;
  generatedAt: string;
};

export function loadDocumentsFromStorage(): StoredDocument[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DASHBOARD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredDocument[];
  } catch (error) {
    console.warn('Failed to read dashboard storage', error);
    return [];
  }
}

export function saveDocumentToStorage(document: StoredDocument) {
  if (typeof window === 'undefined') return;
  const existing = loadDocumentsFromStorage().filter((item) => item.id !== document.id);
  existing.unshift(document);
  window.localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(existing));
}

export function removeDocumentFromStorage(id: string) {
  if (typeof window === 'undefined') return;
  const existing = loadDocumentsFromStorage().filter((item) => item.id !== id);
  window.localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(existing));
}
