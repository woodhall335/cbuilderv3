import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import WizardForm from '@/components/WizardForm';
import { getDocument, normaliseKind } from '@/lib/catalog';
import { getJurisdictionLabel } from '@/lib/jurisdictions';
import type { DocumentKind } from '@/types/blueprint';

interface Params {
  kind: string;
  jurisdiction: string;
  slug: string;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const kind = normaliseKind(params.kind) ?? 'contract';
  const document = await getDocument(kind, params.jurisdiction, params.slug);
  if (!document) {
    return { title: 'Document wizard | Contract Heaven' };
  }
  const jurisdictionLabel = getJurisdictionLabel(document.jurisdiction);
  return {
    title: `${document.title} – Wizard | Contract Heaven`,
    description: `Provide details to generate ${document.title} for ${jurisdictionLabel}.`,
  };
}

export default async function WizardPage({ params }: { params: Params }) {
  const kind = normaliseKind(params.kind);
  if (!kind) {
    notFound();
  }
  const resolvedKind: DocumentKind = kind;
  const document = await getDocument(resolvedKind, params.jurisdiction, params.slug);
  if (!document) {
    notFound();
  }

  return <WizardForm document={document} />;
}
