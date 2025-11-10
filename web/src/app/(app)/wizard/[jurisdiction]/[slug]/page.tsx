'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

/** ----- Types that match our JSON blueprints ----- */

type TextField = {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'email' | 'address';
  required?: boolean;
  placeholder?: string;
  help?: string;
};

type SelectField = {
  id: string;
  label: string;
  type: 'select';
  required?: boolean;
  options: string[];
  help?: string;
};

type CheckboxField = {
  id: string;
  label: string;
  type: 'checkbox';
  required?: boolean;
  help?: string;
};

type AnyField = TextField | SelectField | CheckboxField;

type Section = {
  id: string;
  title?: string;
  fields: AnyField[];
};

type Blueprint =
  | {
      // flat style: fields at root
      title: string;
      jurisdiction: 'uk-ew' | 'uk-sc' | 'uk-ni';
      slug: string;
      fields: AnyField[];
    }
  | {
      // sectioned style: sections[].fields
      title: string;
      jurisdiction: 'uk-ew' | 'uk-sc' | 'uk-ni';
      slug: string;
      sections: Section[];
    };

type FormValues = Record<string, unknown>;

/** ----- Component ----- */

export default function WizardPage() {
  const params = useParams<{ jurisdiction: string; slug: string }>();
  const [bp, setBp] = useState<Blueprint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch blueprint from API
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/blueprints/${params.jurisdiction}/${params.slug}`,
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error(`Blueprint not found (${res.status})`);
        const json: Blueprint = await res.json();
        if (mounted) setBp(json);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Failed to load blueprint');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [params.jurisdiction, params.slug]);

  /** Flatten fields whether the blueprint uses root `fields` or `sections[].fields` */
  const flatFields = useMemo<AnyField[]>(() => {
    if (!bp) return [] as AnyField[];

    const maybeAny = bp as any;

    if (Array.isArray(maybeAny.fields)) {
      return maybeAny.fields as AnyField[];
    }

    if (Array.isArray(maybeAny.sections)) {
      return (maybeAny.sections as Section[]).flatMap((s) => s.fields ?? []) as AnyField[];
    }

    return [] as AnyField[];
  }, [bp]);

  /** Build Zod schema dynamically from flatFields */
  const formSchema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};

    for (const f of flatFields) {
      switch (f.type) {
        case 'text': {
          const base = z.string({ message: 'Required' });
          shape[f.id] = f.required ? base.min(1, 'Required') : base.optional();
          break;
        }
        case 'textarea':
        case 'address': {
          const base = z.string({ message: 'Required' });
          shape[f.id] = f.required ? base.min(1, 'Required') : base.optional();
          break;
        }
        case 'email': {
          const base = z.string({ message: 'Required' }).email('Enter a valid email');
          shape[f.id] = f.required ? base : base.optional();
          break;
        }
        case 'date': {
          const base = z.string({ message: 'Required' }); // keep as string for HTML date input
          shape[f.id] = f.required ? base.min(1, 'Required') : base.optional();
          break;
        }
        case 'select': {
          const base = z.string({ message: 'Please choose an option' });
          shape[f.id] = f.required ? base.min(1, 'Please choose an option') : base.optional();
          break;
        }
        case 'checkbox': {
          const base = z.boolean();
          shape[f.id] = f.required ? base.refine(Boolean, 'Required') : base.optional();
          break;
        }
        default: {
          // Safety net for any unknown future field types
          shape[(f as AnyField).id] = z.any().optional();
        }
      }
    }

    return z.object(shape);
  }, [flatFields]);

  // Memoized resolver (cast to any to avoid zod v4 resolver generic mismatches with dynamic schemas)
  const resolver = useMemo(() => zodResolver(formSchema as any) as any, [formSchema]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {},
  });

  const onSubmit = (data: FormValues) => {
    const payload = encodeURIComponent(JSON.stringify(data));
    window.location.href = `/preview/${params.jurisdiction}/${params.slug}?payload=${payload}`;
  };

  if (loading) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold">Loading…</h1>
      </section>
    );
  }

  if (error || !bp) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold">Blueprint unavailable</h1>
        <p className="mt-2 text-red-600">{error ?? 'Unknown error'}</p>
      </section>
    );
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold">{(bp as any).title}</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Jurisdiction:{' '}
        <span className="font-mono">{(bp as any).jurisdiction}</span>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        {flatFields.map((f) => {
          // Safer error lookup to avoid TS indexed access complaints
          const err = (errors as Record<string, any>)[f.id];
          const help = 'help' in f && f.help ? f.help : undefined;

          if (f.type === 'text' || f.type === 'email') {
            return (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-sm font-medium">
                  {f.label} {f.required ? <span className="text-red-600">*</span> : null}
                </label>
                <input
                  id={f.id}
                  type={f.type === 'email' ? 'email' : 'text'}
                  placeholder={f.placeholder}
                  className="mt-1 w-full rounded border px-3 py-2"
                  {...register(f.id)}
                />
                {help && <p className="mt-1 text-xs text-neutral-500">{help}</p>}
                {err && <p className="mt-1 text-sm text-red-600">{err.message as string}</p>}
              </div>
            );
          }

          if (f.type === 'textarea' || f.type === 'address') {
            return (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-sm font-medium">
                  {f.label} {f.required ? <span className="text-red-600">*</span> : null}
                </label>
                <textarea
                  id={f.id}
                  placeholder={f.placeholder}
                  rows={f.type === 'address' ? 4 : 5}
                  className="mt-1 w-full rounded border px-3 py-2"
                  {...register(f.id)}
                />
                {help && <p className="mt-1 text-xs text-neutral-500">{help}</p>}
                {err && <p className="mt-1 text-sm text-red-600">{err.message as string}</p>}
              </div>
            );
          }

          if (f.type === 'date') {
            return (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-sm font-medium">
                  {f.label} {f.required ? <span className="text-red-600">*</span> : null}
                </label>
                <input
                  id={f.id}
                  type="date"
                  className="mt-1 w-full rounded border px-3 py-2"
                  {...register(f.id)}
                />
                {help && <p className="mt-1 text-xs text-neutral-500">{help}</p>}
                {err && <p className="mt-1 text-sm text-red-600">{err.message as string}</p>}
              </div>
            );
          }

          if (f.type === 'select') {
            return (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-sm font-medium">
                  {f.label} {f.required ? <span className="text-red-600">*</span> : null}
                </label>
                <select
                  id={f.id}
                  className="mt-1 w-full rounded border px-3 py-2 bg-white"
                  {...register(f.id)}
                  defaultValue=""
                >
                  <option value="" disabled>
                    {f.required ? 'Select…' : 'Optional'}
                  </option>
                  {f.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {help && <p className="mt-1 text-xs text-neutral-500">{help}</p>}
                {err && <p className="mt-1 text-sm text-red-600">{err.message as string}</p>}
              </div>
            );
          }

          if (f.type === 'checkbox') {
            const checked = watch(f.id) as boolean | undefined;
            return (
              <div key={f.id} className="flex items-start gap-3">
                <input
                  id={f.id}
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={!!checked}
                  onChange={(e) => setValue(f.id, e.target.checked)}
                />
                <div>
                  <label htmlFor={f.id} className="text-sm font-medium">
                    {f.label} {f.required ? <span className="text-red-600">*</span> : null}
                  </label>
                  {help && <p className="mt-1 text-xs text-neutral-500">{help}</p>}
                  {err && <p className="mt-1 text-sm text-red-600">{err.message as string}</p>}
                </div>
              </div>
            );
          }

          return (
            <div key={f.id} className="text-sm text-neutral-500">
              Unsupported field type: <code>{(f as AnyField).type}</code>
            </div>
          );
        })}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Preparing preview…' : 'Preview (first 2 pages)'}
          </button>
        </div>
      </form>
    </section>
  );
}
