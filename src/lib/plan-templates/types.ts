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

/** 模板分组（用于模板库顶部标签筛选） */
export type TemplateGroup =
  | "all"
  | "ecommerce"
  | "character"
  | "storyboard"
  | "my"
  | "favorites";

export const TEMPLATE_GROUP_LABELS: Record<TemplateGroup, string> = {
  all: "全部",
  ecommerce: "电商",
  character: "角色",
  storyboard: "故事板",
  my: "我的",
  favorites: "收藏",
};

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
  /** 模板分组标签，用于顶部筛选 */
  group?: TemplateGroup;
}
