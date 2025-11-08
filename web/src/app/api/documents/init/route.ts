import { NextResponse } from 'next/server';
// import { supabase } from '@/lib/supabase'; // when ready

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, jurisdiction, slug, title, payload } = body;

  // const { data, error } = await supabase.from('documents').insert({
  //   user_id: userId,
  //   jurisdiction, slug, title,
  //   payload,
  //   html: '<h1>...</h1>',
  //   lock_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
  // });

  // For now, just echo:
  return NextResponse.json({
    ok: true,
    html: `<h1>${title}</h1><p>Draft created. Lock on ${new Date(
      Date.now() + 7 * 24 * 3600 * 1000
    ).toUTCString()}</p>`,
  });
}
