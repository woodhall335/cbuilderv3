import { NextResponse } from 'next/server';
import { getDocumentOrThrow, normaliseKind } from '@/lib/catalog';
import { renderClausesToHtml } from '@/lib/render';
import type { DocumentKind } from '@/types/blueprint';

type GeneratePayload = {
  kind: DocumentKind;
  jurisdiction: string;
  slug: string;
  answers: Record<string, string>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<GeneratePayload>;
    const kind = normaliseKind(body.kind ?? null);
    if (!kind) {
      return NextResponse.json({ error: 'Unknown document kind' }, { status: 400 });
    }
    if (!body.jurisdiction || !body.slug) {
      return NextResponse.json(
        { error: 'Both jurisdiction and slug are required' },
        { status: 400 },
      );
    }

    const blueprint = await getDocumentOrThrow(kind, body.jurisdiction, body.slug);
    const html = renderClausesToHtml(blueprint.clauses, body.answers ?? {});

    return NextResponse.json({
      html,
      metadata: {
        title: blueprint.title,
        kind,
        jurisdiction: blueprint.jurisdiction,
        slug: blueprint.slug,
        category: blueprint.category,
      },
      certificate: blueprint.certificate ?? null,
      lawPack: blueprint.lawPack ?? [],
      answers: body.answers ?? {},
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Unable to generate the requested document' },
      { status: 500 },
    );
  }
}
