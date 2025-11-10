// src/app/api/documents/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

type PatchBody = {
  content?: Record<string, any> | null;
  html?: string | null;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Next 16: params is a Promise
    const supabase = await supabaseServer(); // <-- await the async helper

    const { data, error } = await supabase
      .from('documents')
      .select(
        'id,title,slug,jurisdiction,status,locked_at,created_at,updated_at,content,html,blueprint'
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as PatchBody;

    const supabase = await supabaseServer(); // <-- await the async helper

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (body.content !== undefined) updates.content = body.content;
    if (body.html !== undefined) updates.html = body.html;

    if (!('content' in updates) && !('html' in updates)) {
      return NextResponse.json(
        { ok: false, error: 'Nothing to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: `Update failed: ${error.message}` },
        { status: 500 }
      );
    }
    if (!data) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Server error' }, { status: 500 });
  }
}
