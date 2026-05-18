export type TemplateVariableType = "text" | "textarea" | "string_list" | "select";

export interface TemplateVariable {
  key: string;
  label: string;
  type: TemplateVariableType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string | string[];
}

export type PlanTemplateScope = "system" | "user";
export type PlanTemplateCategory = "single_image" | "image_set";

export interface PlanTemplate {
  id: string;
  name: string;
  description: string;
  scope: PlanTemplateScope;
  category: PlanTemplateCategory;
  tags: string[];
  applicablePlatforms: string[];
  applicableProducts: string[];
  variables: TemplateVariable[];
  templatePrompt: string;
  defaultRiskRules: string[];
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}
