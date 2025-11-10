// src/app/(app)/preview/[jurisdiction]/[slug]/page.tsx
import PreviewClient from './preview-client';

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ jurisdiction: string; slug: string }>;
}) {
  // In this Next.js build, params is a Promise — unwrap it:
  const { jurisdiction, slug } = await params;

  return (
    <section className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold">Preview: {slug}</h1>
      <p className="text-sm text-neutral-600 mt-1">
        Jurisdiction: <span className="font-mono">{jurisdiction}</span>
      </p>

      {/* Client component handles fetching blueprint + saving */}
      <PreviewClient jurisdiction={jurisdiction} slug={slug} />
    </section>
  );
}
