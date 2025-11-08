// Server component (no "use client" here)
import PreviewClient from "./preview-client";

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ jurisdiction: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Unwrap the Promises (Next 16 behavior)
  const { jurisdiction, slug } = await params;
  const sp = await searchParams;

  // Parse ?payload=... if present
  let payload: unknown = null;
  try {
    const raw = typeof sp.payload === "string" ? sp.payload : undefined;
    payload = raw ? JSON.parse(decodeURIComponent(raw)) : null;
  } catch {
    payload = null;
  }

  return (
    <PreviewClient
      jurisdiction={jurisdiction}
      slug={slug}
      payload={payload}
    />
  );
}
