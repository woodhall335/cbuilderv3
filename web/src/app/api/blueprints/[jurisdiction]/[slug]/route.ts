import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ jurisdiction: string; slug: string }> }
) {
  const { jurisdiction, slug } = await ctx.params; // ← IMPORTANT: await params

  const allowed = new Set(['uk-ew', 'uk-sc', 'uk-ni']);
  if (!allowed.has(jurisdiction)) {
    return NextResponse.json({ error: 'Invalid jurisdiction' }, { status: 400 });
  }

  const file = path.join(process.cwd(), 'src', 'blueprints', jurisdiction, `${slug}.json`);
  try {
    const raw = await fs.readFile(file, 'utf8');
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
  }
}
