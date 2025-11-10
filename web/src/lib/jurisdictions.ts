export const JURISDICTION_LABELS: Record<string, string> = {
  'uk-ew': 'England & Wales',
  'uk-sc': 'Scotland',
  'uk-ni': 'Northern Ireland',
};

export function getJurisdictionLabel(code: string) {
  return JURISDICTION_LABELS[code] ?? code;
}

export const SUPPORTED_JURISDICTIONS = Object.keys(JURISDICTION_LABELS);
