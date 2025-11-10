// src/app/api/documents/[id]/lock/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase';

type ParamsPromise = Promise<{ id: string }>;

export async function POST(_req: Request, ctx: { params: ParamsPromise }) {
  try {
    // 1) Auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2) Params (must await in Next 16)
    const { id } = await ctx.params;

    // 3) Supabase client (MUST await)
    const supabase = await supabaseServer();

    // 4) Read doc restricted to owner
    const { data: existing, error: readErr } = await supabase
      .from('documents')
      .select('id, locked_at')
      .eq('id', id)
      .eq('owner_id', userId)
      .single();

    if (readErr || !existing) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    // 5) Already locked? return current lock
    if (existing.locked_at) {
      return NextResponse.json({ ok: true, locked_at: existing.locked_at });
    }

    // 6) Lock now
    const lockedAt = new Date().toISOString();
    const { error: updErr } = await supabase
      .from('documents')
      .update({ locked_at: lockedAt, status: 'locked', updated_at: lockedAt })
      .eq('id', id)
      .eq('owner_id', userId);

    if (updErr) {
      return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, locked_at: lockedAt });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
