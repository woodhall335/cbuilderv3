'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditorPage({
  params,
}: { params: { jurisdiction: string; slug: string } }) {
  const sp = useSearchParams();
  const sessionId = sp.get('session_id'); // you can verify via webhook later
  const [content, setContent] = useState<string>('Loading…');

  useEffect(() => {
    // TODO: call /api/documents/init to persist a draft row & return initial HTML
    // for now, show a placeholder:
    setContent(`<h1>${params.slug} — Editor</h1><p>7-day editing window starts on purchase.</p>`);
  }, [params.slug]);

  return (
    <section className="max-w-3xl mx-auto px-4 py-10">
      <div className="prose" dangerouslySetInnerHTML={{ __html: content }} />
      <div className="mt-6">
        <button className="rounded bg-black px-4 py-2 text-white">Save</button>
      </div>
    </section>
  );
}
