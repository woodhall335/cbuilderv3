import { NextResponse } from 'next/server';
import { listDocumentSummaries, normaliseKind } from '@/lib/catalog';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = normaliseKind(searchParams.get('kind')) ?? undefined;
  const jurisdiction = searchParams.get('jurisdiction') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  const documents = await listDocumentSummaries({
    kind,
    jurisdiction,
    search,
    limit,
  });

  return NextResponse.json({ documents });
}
