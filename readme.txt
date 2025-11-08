Contract Heaven (UK v1) — README

Helpful, UK-specific document platform:

Ask Heaven (free Q&A) → routes users to paid actions

Letters: Free Basic templates + Custom (law-cited) letters (£5–£7) with free Day-7 follow-up

Small Claims Court Pack (£19 escalation / £29 standalone)

Contracts (£10) with inline editor, Certificate + Applicable Laws Summary

Rewrite (£40) from analyser, OCR Translation (£20)

E-sign add-on (£3) across outputs

Jurisdictions: England & Wales, Scotland, Northern Ireland

Public copy: “Curated by Contract Heaven. Completed by You.”

0) Prereqs

Node 18+

VS Code + Git + GitHub

Accounts/keys: Clerk, Supabase, Stripe, Resend, Vercel, xAI (Grok), OpenAI (for cheap/free flows)

1) Scaffold the project
npx create-next-app@latest contractheaven --ts --tailwind --app --src-dir --eslint
cd contractheaven

# Core deps
npm i @clerk/nextjs @supabase/supabase-js stripe @stripe/stripe-js resend
npm i @tiptap/react @tiptap/starter-kit zod pdf-lib date-fns slugify
npm i plausible-tracker

# Types and tooling
npm i -D @types/node

2) Directory layout (single app)
contractheaven/
  src/
    app/
      page.tsx                     # Homepage with Ask Heaven widget
      ask/page.tsx                 # Ask form
      ask/result/page.tsx          # Answer + CTAs
      contract-wizard/page.tsx     # Contract Wizard (dynamic form)
      letters/page.tsx             # Letters hub
      letters/[region]/[slug]/page.tsx   # Letter detail (ISR)
      contracts/[region]/[slug]/page.tsx # Contract landing (ISR)
      packs/small-claims/page.tsx  # Claims Pack checkout/result
      api/stripe/webhook/route.ts  # Stripe webhook
    components/                    # Forms, editors, CTAs
    data/
      contracts.ts                 # 185 slugs + meta
      letters.ts                   # start with 50; scale to 500
      law-packs.ts                 # E&W / Scotland / NI acts/sections
      qa-assertions.ts             # per doc/letter family
    lib/
      ai.ts                        # callAI() hybrid wrapper
      stripe.ts                    # Stripe helpers
      clerk.ts                     # Clerk helpers
      supabase.ts                  # Supabase client
      resend.ts                    # Email helpers
      isr.ts                       # revalidation utilities
      pdf.ts                       # certificate + PDF helpers
      types.ts                     # Zod DTOs (inputs/outputs)

3) Environment variables (.env.local)
# Auth
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...

# Supabase
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...

# AI
GROK_API_KEY=grk_...
OPENAI_API_KEY=sk-...

# Site
ORIGIN=http://localhost:3000
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=localhost


Set the same in Vercel before deploy.

4) Supabase schema (run in SQL editor)
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null,
  created_at timestamptz default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  kind text not null,              -- 'contract' | 'letter' | 'pack' | 'rewrite' | 'translation'
  slug text,                       -- contract/letter slug
  jurisdiction text,               -- 'uk-ew' | 'uk-sc' | 'uk-ni'
  status text default 'ready',     -- 'ready' | 'followup_due' | 'archived'
  meta jsonb,                      -- urls, filenames, prices, etc.
  created_at timestamptz default now()
);

create index on events (type, created_at);
create index on documents (user_email, kind, created_at);

5) Product data (minimal seeds)

src/data/contracts.ts (example)

export const CONTRACTS = [
  { slug: "non-disclosure-agreement", name: "NDA", categories:["Business"], regions:["uk-ew","uk-sc","uk-ni"] },
  { slug: "assured-shorthold-tenancy", name: "AST (E&W)", categories:["Property"], regions:["uk-ew"] },
  // ... add up to 185
] as const;


src/data/letters.ts (start with ~50; aim for 500)

export const LETTERS = [
  { slug:"tenant-repair-request", name:"Tenant Repair Request", regions:["uk-ew","uk-sc","uk-ni"], issue:"repairs" },
  { slug:"deposit-return-demand", name:"Deposit Return Demand", regions:["uk-ew","uk-sc","uk-ni"], issue:"deposit" },
  { slug:"late-payment-reminder", name:"Late Payment Reminder (Business)", regions:["uk-ew","uk-sc","uk-ni"], issue:"invoice" },
  // ...
] as const;


src/data/law-packs.ts (thin references injected into prompts)

export const LAW_PACKS = {
  "uk-ew": [
    "Housing Act 1988", "Landlord and Tenant Act 1985 s.11 (repairs)", "Civil Procedure Rules Part 27 (small claims)"
  ],
  "uk-sc": ["Simple Procedure Rules", "Housing (Scotland) Acts"],
  "uk-ni": ["Small Claims Rules (NI)", "Private Tenancies Act (NI)"]
} as const;

6) Types (Zod DTOs)

src/lib/types.ts

import { z } from "zod";
export const Jurisdiction = z.enum(["uk-ew","uk-sc","uk-ni"]);
export type TJurisdiction = z.infer<typeof Jurisdiction>;

export const UserProfile = z.object({ name:z.string(), email:z.string().email(), region:Jurisdiction });

export const AskQuestion = z.object({ question:z.string().min(5).max(800), jurisdiction:Jurisdiction, user:UserProfile });

export const CustomLetterInput = z.object({ slug:z.string(), jurisdiction:Jurisdiction, facts:z.record(z.any()), user:UserProfile });
export const CustomLetterOutput = z.object({ html:z.string(), pdfUrl:z.string(), certificateHtml:z.string(), lawsSummaryMd:z.string(), followUpAt:z.string() });

export const ContractInput = z.object({ slug:z.string(), jurisdiction:Jurisdiction, answers:z.record(z.any()), user:UserProfile });
export const ContractOutput = z.object({ html:z.string(), pdfUrl:z.string(), docxUrl:z.string().optional(), certificateHtml:z.string(), lawsSummaryMd:z.string() });

export const ClaimsPackInput = z.object({ issue:z.enum(["invoice","deposit","repairs","other"]), jurisdiction:Jurisdiction, facts:z.record(z.any()), user:UserProfile });
export const ClaimsPackOutput = z.object({
  particularsText:z.string(),
  scheduleOfLossMd:z.string(),
  evidenceListMd:z.string(),
  portalPasteBlock:z.string(),
  prefilledPdfUrl:z.string(),
  filingGuideHtml:z.string()
});

7) AI wrapper (hybrid)

src/lib/ai.ts

type AIOpts = { prompt:string; isPaid?:boolean; maxTokens?:number; temperature?:number };
export async function callAI({prompt,isPaid=false,maxTokens=1200,temperature=0.4}:AIOpts){
  const useGrok=isPaid;
  const url=useGrok?"https://api.x.ai/v1/chat/completions":"https://api.openai.com/v1/chat/completions";
  const model=useGrok?"grok-4-fast-reasoning":"gpt-4o-mini";
  const key=useGrok?process.env.GROK_API_KEY:process.env.OPENAI_API_KEY;

  const res=await fetch(url,{method:"POST",
    headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
    body:JSON.stringify({model,messages:[{role:"user",content:prompt}],temperature,max_tokens:maxTokens})
  });
  const json=await res.json();
  return json?.choices?.[0]?.message?.content ?? "";
}

8) Server-action stubs (put in relevant route files or src/lib/actions.ts)
// 1) Ask (free, 200 words, cite 1–3 statutes)
export async function answerAsk(input: { question:string; jurisdiction:"uk-ew"|"uk-sc"|"uk-ni"; user:{name:string;email:string} }){
  // build concise prompt with jurisdiction context + LAW_PACKS
  // callAI({ isPaid:false })
  // return { answerHtml, statutes:[...], disclaimer, ctas:[...] }
}

// 2) Generate Custom Letter (paid)
export async function generateCustomLetter(input: import("./types").CustomLetterInput){
  // validate → prompt with facts + law-pack + assertions → callAI({isPaid:true})
  // build certificateHtml + lawsSummaryMd → save PDF to storage → insert documents row
  // schedule Day-7 follow-up via Resend
}

// 3) Generate Contract (paid)
export async function generateContract(input: import("./types").ContractInput){
  // similar to letter; output ContractOutput
}

// 4) Generate Small Claims Pack (paid)
export async function generateClaimsPack(input: import("./types").ClaimsPackInput){
  // draft particulars/statement + schedule of loss + evidence list + portal paste + prefilled PDF + filing guide
}

// 5) Rewrite & Translation (paid)
export async function rewriteDocument(args:{sourceHtml:string; jurisdiction:string; userEmail:string}){}
export async function translateDocument(args:{fileUrl:string; targetLanguage:string; userEmail:string}){}

9) Stripe — quick setup

Create Products: custom-letter, contract, small-claims-pack, rewrite, translation, esign.

Use Stripe Checkout client-side; pass metadata { kind, slug, jurisdiction }.

src/app/api/stripe/webhook/route.ts (outline)

import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
const stripe=new Stripe(process.env.STRIPE_SECRET_KEY!,{apiVersion:"2023-10-16"});

export async function POST(req:NextRequest){
  const sig=req.headers.get("stripe-signature")!;
  const buf=await req.text();
  let event;
  try{ event=stripe.webhooks.constructEvent(buf,sig,process.env.STRIPE_WEBHOOK_SECRET!); }
  catch(e){ return new NextResponse("Bad signature",{status:400}); }

  if(event.type==="checkout.session.completed"){
    const s = event.data.object as any;
    const kind = s.metadata?.kind;
    // switch on kind → call relevant generator
    // await generateCustomLetter(...) / generateContract(...) / generateClaimsPack(...) ...
  }
  return NextResponse.json({received:true});
}

10) Resend — Day-7 follow-up (letters)

Day-0: receipt + link to download

Day-7: “Your free follow-up letter is ready” (magic link to /dashboard/letters/{id}/follow-up)

src/lib/resend.ts (basic sender)

import { Resend } from "resend";
export const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmail(to:string, subject:string, html:string){
  await resend.emails.send({ from:"Contract Heaven <noreply@contractheaven.uk>", to, subject, html });
}

11) ISR & SEO

All letter and contract pages use generateStaticParams only for a small seed; rely on dynamic = 'force-dynamic' or fallback: 'blocking' and revalidate with tags on content change.

Sitemaps: /sitemap-contracts.xml, /sitemap-letters.xml, /sitemap-ask.xml (regenerate on demand).

Q&A schema on /ask/result.

Title/description: include jurisdiction in slugs, e.g. /letters/uk-ew/tenant-repair-request.

12) Analytics (Plausible)

Track these (client) and mirror important ones into events:

ask_submitted, ask_result_cta_click

letter_basic_download, letter_custom_purchased

letter_followup_open

contract_purchased, pack_purchased, rewrite_purchased, translation_purchased

esign_added

13) Launch checklist

Stripe webhooks live; test each product end-to-end

Clerk sign-in flows (passwordless magic link)

Supabase public/storage buckets for PDFs

Resend domain verified; D1/D7 emails tested

Vercel envs set; preview/build OK; ISR working

Sitemaps submitted in GSC; key pages indexed

14) Guardrails

Every paid output: Certificate + Applicable Laws Summary; include “General guidance — not legal advice.”

Assertions before unlock (e.g., E&W repairs letter must reference Landlord and Tenant Act 1985 s.11; MCOL particulars character caps handled with “further particulars” PDF).

Rate-limit free outputs; watermark all free PDFs.

15) What to build first (fastest path)

Homepage Ask widget → /ask/result with CTAs

Letters hub → Free Basic (watermarked) + Custom (paid) + Day-7 follow-up

Contract Wizard → pay → full contract + editor + certificate

Small Claims Pack for 3 issues (repairs, deposit, invoice)

Analyser → Rewrite and Translation

Dashboards + admin

FAQ

Q: Can we add 500 letters without coding 500 files?
A: Yes. Each letter is a data row in letters.ts. The single ISR route renders them by slug.

Q: Do we prebuild all 2k+ pages?
A: No. Use ISR / fallback and on-demand revalidation.

Q: What model where?

Free Q&A / previews: gpt-4o-mini (cheap).

Paid generations (Custom Letter, Contract, Claims Pack, Rewrite): grok-4-fast-reasoning (quality).