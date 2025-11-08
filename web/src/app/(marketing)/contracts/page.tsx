import Link from "next/link";
import { getAllContracts } from "@/lib/data";

export default async function ContractsIndex() {
  const contracts = await getAllContracts();
  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">Contracts</h1>
      <p className="mt-3 text-neutral-700">Browse by jurisdiction.</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {contracts.map(c => (
          <li key={c.slug} className="rounded border p-4">
            <h3 className="font-semibold">{c.title} ({c.jurisdiction})</h3>
            <p className="text-sm text-neutral-600">{c.summary}</p>
            <div className="mt-2">
              <Link
                className="text-blue-600 underline"
                href={`/contracts/${c.jurisdiction}/${c.slug}`}
              >
                Open SEO page →
              </Link>
              <span className="mx-2 text-neutral-400">|</span>
              <Link
                className="text-blue-600 underline"
                href={`/wizard/${c.jurisdiction}/${c.slug}`}
              >
                Start wizard →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
