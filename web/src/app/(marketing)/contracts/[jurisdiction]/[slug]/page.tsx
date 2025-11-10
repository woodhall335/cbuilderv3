import { notFound } from 'next/navigation';
// If you already have this helper, keep it:
import { getContract } from '@/lib/data';

type RouteParams = {
  jurisdiction: 'uk-ew' | 'uk-sc' | 'uk-ni';
  slug: string;
};

export default async function ContractSeoPage({
  params,
}: {
  params: Promise<RouteParams>; // 👈 key change: params is a Promise in Next 16
}) {
  const { jurisdiction, slug } = await params; // 👈 unwrap it

  // Prefer your existing data helper
  let contract:
    | { title: string; slug: string; jurisdiction: RouteParams['jurisdiction'] }
    | null = null;

  try {
    // If you have getContract, use it:
    contract = await getContract(slug);
  } catch {
    // Optional fallback: read blueprint API to at least render a title
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/blueprints/${jurisdiction}/${slug}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const bp = (await res.json()) as {
          title: string;
          slug: string;
          jurisdiction: RouteParams['jurisdiction'];
        };
        contract = bp;
      }
    } catch {
      // ignore — we'll 404 below
    }
  }

  if (!contract || contract.jurisdiction !== jurisdiction) return notFound();

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">{contract.title}</h1>
      <p className="mt-2 text-neutral-600">
        Jurisdiction: <span className="font-mono">{jurisdiction}</span>
      </p>

      {/* TODO: SEO copy, FAQs, internal links, schema, CTA to /wizard/[jurisdiction]/[slug] */}
      <div className="mt-8">
        <a
          href={`/wizard/${jurisdiction}/${slug}`}
          className="inline-block rounded bg-black px-4 py-2 text-white"
        >
          Start this contract
        </a>
      </div>
    </section>
  );
}
