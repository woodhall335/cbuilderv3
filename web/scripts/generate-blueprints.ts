import fs from "fs"; import path from "path";
import type { Blueprint, Jurisdiction } from "@/types/blueprint";

const JURS: Jurisdiction[] = ["uk-ew","uk-sc","uk-ni"];
const CONTRACTS = [
  { slug: "employment-contract-full-time", title: "Employment Contract (Full-Time)", category: "Employment & HR" },
  { slug: "nda-mutual", title: "Non-Disclosure Agreement (Mutual)", category: "Business & Commerce" },
  { slug: "service-agreement", title: "Service Agreement", category: "Business & Commerce" },
  { slug: "ast-tenancy", title: "Assured Shorthold Tenancy (AST)", category: "Property & Tenancy" },
  { slug: "loan-agreement-personal", title: "Loan Agreement (Personal)", category: "Finance & Lending" },
];

function base(title: string, slug: string, jurisdiction: Jurisdiction, kind: "contract"|"letter"): Blueprint {
  const govLaw =
    jurisdiction === "uk-ew" ? "England & Wales" :
    jurisdiction === "uk-sc" ? "Scotland" : "Northern Ireland";

  const lawPack =
    jurisdiction === "uk-ew" ? [{cite:"UK GDPR / DPA 2018"}] :
    jurisdiction === "uk-sc" ? [{cite:"UK GDPR / DPA 2018 (Scotland)"}] :
    [{cite:"UK GDPR / DPA 2018 (NI)"}];

  return {
    version: 1,
    kind,
    slug,
    title,
    jurisdiction,
    category: "TBD",
    summary: `Curated ${title} for ${govLaw}.`,
    seo: {
      guide: [
        `When to use the ${title}`,
        `Key protections and how they work`,
        `What differs in ${govLaw}`,
        `Why Contract Heaven (curation, 7-day editing, PDF pack)`
      ],
      faqs: [
        { q: `Is this valid in ${govLaw}?`, a: `It’s curated to align with current standards in ${govLaw}. Provide accurate details and review before use.` },
        { q: "Can I edit after purchase?", a: "Yes — inline editing is available for 7 days before lock." }
      ],
      related: []
    },
    requiredClauses: ["parties","scope_or_role","payment_or_salary","term_or_notice","confidentiality","ip_or_ownership","data_protection","governing_law"],
    lawPack,
    sections: [
      { id:"parties", title:"Parties", fields:[
        { id:"party_a_name", label:"Party A name", type:"text", required:true },
        { id:"party_a_address", label:"Party A address", type:"address", required:true },
        { id:"party_b_name", label:"Party B name", type:"text", required:true },
        { id:"party_b_address", label:"Party B address", type:"address", required:true },
        { id:"effective_date", label:"Effective date", type:"date", required:true },
        { id:"contact_email", label:"Contact email", type:"email", required:true }
      ]}
    ],
    clauses: [
      { id:"parties", type:"variable", title:"Parties", template:"This document is between {{party_a_name}} of {{party_a_address}} and {{party_b_name}} of {{party_b_address}}, effective {{effective_date}}." },
      { id:"governing_law", type:"fixed", title:"Governing Law", template:`This document is governed by the laws of ${govLaw}.` }
    ],
    signatures: kind === "contract" ? {
      parties:[{role:"Party A", nameField:"party_a_name"},{role:"Party B", nameField:"party_b_name"}],
      eSignAllowed:true
    } : undefined,
    certificate: kind === "contract" ? {
      statement:"Curated by Contract Heaven and completed by you. Prepared using the information provided on the date of generation.",
      preparedForFields:["party_a_name","party_b_name","effective_date","contact_email"],
      preparedBy:"Contract Heaven"
    } : undefined
  };
}

function write(fp: string, obj: unknown) {
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, JSON.stringify(obj, null, 2), "utf8");
}

const root = process.cwd();
for (const c of CONTRACTS) {
  for (const j of JURS) {
    const bp = base(c.title, c.slug, j, "contract"); bp.category = c.category;
    const out = path.join(root,"src","blueprints",j,`${c.slug}.json`);
    if (!fs.existsSync(out)) write(out,bp);
  }
}

// Drop a couple of letter examples so routes work immediately
const LETTERS = [
  { slug:"resignation-letter", title:"Resignation Letter", category:"Employment" },
  { slug:"deposit-return-request", title:"Deposit Return Request Letter", category:"Tenancy" }
];
for (const l of LETTERS) {
  for (const j of JURS) {
    const bp = base(l.title, l.slug, j, "letter"); bp.category = l.category;
    const out = path.join(root,"src","letters",j,`${l.slug}.json`);
    if (!fs.existsSync(out)) write(out,bp);
  }
}
console.log("Blueprint scaffolds generated.");
