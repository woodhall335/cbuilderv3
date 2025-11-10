import { NextResponse } from 'next/server';
import { askCatalog } from '@/lib/ask';
import { normaliseKind } from '@/lib/catalog';

export async function POST(request: Request) {
  const body = await request.json();
  const question = typeof body.question === 'string' ? body.question : '';
  const jurisdiction = typeof body.jurisdiction === 'string' ? body.jurisdiction : null;
  const preferredKind = normaliseKind(typeof body.kind === 'string' ? body.kind : null);

  const response = await askCatalog({
    question,
    jurisdiction,
    preferredKind,
  });

  return NextResponse.json(response);
}
