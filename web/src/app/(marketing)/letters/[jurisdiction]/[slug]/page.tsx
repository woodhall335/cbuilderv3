import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DocumentDetail from '@/components/DocumentDetail';
import { getDocument } from '@/lib/catalog';
import { getJurisdictionLabel } from '@/lib/jurisdictions';

interface Params {
  jurisdiction: string;
  slug: string;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const document = await getDocument('letter', params.jurisdiction, params.slug);
  if (!document) {
    return { title: 'Letter not found | Contract Heaven' };
  }
  const jurisdictionLabel = getJurisdictionLabel(document.jurisdiction);
  return {
    title: `${document.title} (${jurisdictionLabel}) | Contract Heaven`,
    description: document.summary,
  };
}

export default async function LetterDetailPage({ params }: { params: Params }) {
  const document = await getDocument('letter', params.jurisdiction, params.slug);
  if (!document) {
    notFound();
  }
  return (
    <DocumentDetail
      document={document}
      ctaHref={`/wizard/letter/${params.jurisdiction}/${params.slug}`}
      ctaLabel="Start this letter"
    />
  );
}
