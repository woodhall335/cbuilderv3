"use client";

import { useState, useCallback } from "react";

type Props = {
  jurisdiction: string;
  slug: string;
  payload: unknown;
};

export default function PreviewClient({ jurisdiction, slug, payload }: Props) {
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; html?: string; error?: string }>(null);

  const onSubmit = useCallback(async () => {
    try {
      setSaving(true);
      setResult(null);

      const res = await fetch("/api/documents/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "demo-user", // TODO: wire to Clerk/Supabase
          jurisdiction,
          slug,
          title: slug,
          payload: payload ?? {},
        }),
      });

      const json = await res.json();
      setResult(json);
    } catch (e) {
      setResult({ ok: false, error: "Failed to save" });
    } finally {
      setSaving(false);
    }
  }, [jurisdiction, slug, payload]);

  return (
    <section className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold">Preview: {slug}</h1>
      <p className="text-sm text-neutral-600 mt-1">
        Jurisdiction: <span className="font-mono">{jurisdiction}</span>
      </p>

      <div className="mt-6 rounded border bg-white p-4">
        <h2 className="font-semibold mb-2">Payload</h2>
        <pre className="text-sm overflow-x-auto">
          {JSON.stringify(payload ?? {}, null, 2)}
        </pre>
      </div>

      <button
        onClick={onSubmit}
        className="mt-6 rounded bg-black px-4 py-2 text-white disabled:opacity-60"
        disabled={saving}
      >
        {saving ? "Saving…" : "Save & Start Lock (7 days)"}
      </button>

      {result && (
        <div className="mt-4 rounded border bg-white p-4">
          <h3 className="font-semibold mb-2">Result</h3>
          {!result.ok && <p className="text-red-600">{result.error ?? "Error"}</p>}
          {result.ok && (
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: result.html ?? "<p>Saved.</p>" }}
            />
          )}
        </div>
      )}
    </section>
  );
}
