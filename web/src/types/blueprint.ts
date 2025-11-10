export type BlueprintFieldType =
  | 'text'
  | 'email'
  | 'date'
  | 'textarea'
  | 'address'
  | 'number'
  | 'select';

export type BlueprintField = {
  id: string;
  label: string;
  type: BlueprintFieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];
};

export type BlueprintSection = {
  id: string;
  title: string;
  description?: string;
  fields: BlueprintField[];
};

export type BlueprintClause = {
  id: string;
  type: 'fixed' | 'variable';
  title?: string;
  template: string;
};

export type LawPackEntry = {
  cite: string;
  note?: string;
};

export type BlueprintCertificate = {
  statement: string;
  preparedForFields: string[];
};

export type SignatureParty = {
  role: string;
  nameField: string;
};

export type BlueprintSignatures = {
  parties: SignatureParty[];
  eSignAllowed?: boolean;
};

export type BlueprintSEO = {
  guide?: string[];
  faqs?: { q: string; a: string }[];
  related?: string[];
};

export type BlueprintDocument = {
  version: number;
  kind: 'contract' | 'letter';
  slug: string;
  title: string;
  jurisdiction: string;
  category?: string;
  summary: string;
  seo?: BlueprintSEO;
  requiredClauses?: string[];
  lawPack?: LawPackEntry[];
  sections: BlueprintSection[];
  clauses: BlueprintClause[];
  signatures?: BlueprintSignatures;
  certificate?: BlueprintCertificate;
};

export type DocumentKind = BlueprintDocument['kind'];

export type DocumentSummary = {
  kind: DocumentKind;
  slug: string;
  title: string;
  jurisdiction: string;
  category?: string;
  summary: string;
  version: number;
  lawPackCitations: string[];
};
