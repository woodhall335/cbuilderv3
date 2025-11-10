// web/src/app/api/documents/[id]/export/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase';
import { renderClausesToHtml } from '@/lib/render';
import puppeteer from 'puppeteer';

type ParamsPromise = Promise<{ id: string }>;

export async function GET(_req: Request, ctx: { params: ParamsPromise }) {
  try {
    // 1) Auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2) Params (Next 16: params is a Promise)
    const { id } = await ctx.params;

    // 3) DB
    const supabase = await supabaseServer();
    const { data: doc, error } = await supabase
      .from('documents')
      .select('id,title,slug,jurisdiction,content,html,blueprint,owner_id')
      .eq('id', id)
      .eq('owner_id', userId)
      .single();

    if (error || !doc) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    // 4) Determine HTML to print
    let html = doc.html ?? '';

    if (!html) {
      const h = await headers();
      const host = h.get('host') || 'localhost:3000';
      // Prefer absolute origin; if missing, build one
      const origin = h.get('origin') ?? `http://${host}`;

      // Try blueprint endpoint to render clauses
      const bpSlug = String(doc.slug || doc.blueprint || '');
      const bpUrl = `${origin}/api/blueprints/${doc.jurisdiction}/${bpSlug}`;

      const bpRes = await fetch(bpUrl, { cache: 'no-store' });
      if (bpRes.ok) {
        const bp = await bpRes.json();
        if (bp?.clauses?.length) {
          html = renderClausesToHtml(bp.clauses, doc.content ?? {});
        }
      }

      if (!html) {
        html = `<h1>${doc.title}</h1><pre>${JSON.stringify(doc.content ?? {}, null, 2)}</pre>`;
      }
    }

    // 5) Render HTML -> PDF via Puppeteer
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
          h1,h2,h3 { margin: 0 0 12px; }
          p,li { line-height: 1.45; }
        </style>
      </head><body>${html}</body></html>`,
      { waitUntil: 'networkidle0' }
    );
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
    });
    await page.close();
    await browser.close();

    // IMPORTANT: use a Node Buffer as the body for both upload and HTTP response
    const nodeBuffer = Buffer.from(pdfBuffer);

    // 6) Upload to Supabase Storage and redirect to public URL
    const folder = `exports/${doc.id}`;
    const filename = `${Date.now()}.pdf`;
    const path = `${folder}/${filename}`;

    const { error: uploadErr } = await supabase.storage
      .from('exports')
      .upload(path, nodeBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadErr) {
      // If upload fails, still send the PDF inline
      return new Response(nodeBuffer, {
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `inline; filename="${filename}"`,
        },
        status: 200,
      });
    }

    const publicUrl = supabase.storage.from('exports').getPublicUrl(path).data.publicUrl;

    return NextResponse.redirect(publicUrl, 302);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
