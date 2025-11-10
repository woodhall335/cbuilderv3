// src/app/api/documents/get/[id]/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { getClerkUserIdOptional } from '@/lib/auth-optional';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> } // params is a Promise in Next 16
) {
  const { id } = await params;

  const userId = await getClerkUserIdOptional();
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Sign in required' }, { status: 401 });
  }

  const supabase = await supabaseServer(); // MUST await
  const { data, error } = await supabase
    .from('documents')
    .select(
      'id, title, slug, jurisdiction, status, locked_at, content, blueprint, owner_id, html'
    )
    .eq('id', id)
    .eq('owner_id', userId)
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  const { owner_id: _owner_id, ...doc } = data as any;
  return NextResponse.json({ ok: true, doc });
}
