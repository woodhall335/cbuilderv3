export type TextField = {
  name: string;
  label: string;
  type: "text" | "email" | "date" | "textarea";
  required?: boolean;
};

export type NumberField = {
  name: string;
  label: string;
  type: "number";
  required?: boolean;
};

export type SelectField = {
  name: string;
  label: string;
  type: "select";
  required?: boolean;
  options: { label: string; value: string }[];
};

export type BlueprintField = TextField | NumberField | SelectField;

export interface ContractBlueprint {
  meta: {
    slug: string;
    title: string;
    jurisdiction: string;
    version: string;
    category?: string;
  };
  fields: BlueprintField[];
  logic: any[];
  outputs: any[];
}
