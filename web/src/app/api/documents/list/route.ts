// src/app/api/documents/list/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Sign in required' }, { status: 401 });
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('documents')
    .select('id, title, jurisdiction, status, locked_at, created_at, slug')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, items: data ?? [] });
}
