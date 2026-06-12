import type { SystemTemplate, SavedTemplate } from "./types";
import type { PlanTemplate } from "@/lib/plan-templates/types";
import { SYSTEM_TEMPLATE_PROFILES } from "./presets";

const TAG_MAP: Record<string, string[]> = {
  "tpl-white-bg-hero": ["主图", "白底", "Amazon", "干净"],
  "tpl-temu-promo": ["Temu", "促销", "高对比"],
  "tpl-feature-explanation": ["详情页", "功能卖点", "说明图"],
  "tpl-macro-detail": ["局部放大", "微距", "细节图", "质感"],
  "tpl-advantage-comparison": ["优势对比", "对比图", "产品优势"],
  "tpl-lifestyle-scene": ["应用场景", "lifestyle", "环境氛围", "车间"],
  "tpl-environment-scene": ["环境", "场景", "背景"],
  "tpl-bundle-showcase": ["套装", "组合", "促销", "多产品"],
  "tpl-spec-technical": ["规格参数", "技术图", "冷色调", "文档风"],
  "tpl-premium-luxury": ["高端", "奢华", "深色背景", "质感"],
  "tpl-dimension-annotation": ["尺寸标注", "测量", "结构", "几何"],
  "tpl-image-set-5": ["组图", "详情页", "五张图", "整套方案"],
  "tpl-blank-free": ["空白", "自由创作", "实验", "无规则"],
};

const CATEGORY_MAP: Record<string, string> = {
  "tpl-white-bg-hero": "ecommerce",
  "tpl-temu-promo": "ecommerce",
  "tpl-feature-explanation": "ecommerce",
  "tpl-macro-detail": "ecommerce",
  "tpl-advantage-comparison": "ecommerce",
  "tpl-lifestyle-scene": "ecommerce",
  "tpl-environment-scene": "ecommerce",
  "tpl-bundle-showcase": "ecommerce",
  "tpl-spec-technical": "ecommerce",
  "tpl-premium-luxury": "ecommerce",
  "tpl-dimension-annotation": "ecommerce",
  "tpl-image-set-5": "ecommerce",
  "tpl-blank-free": "ecommerce",
};

export function getTemplateCategory(id: string): string {
  return CATEGORY_MAP[id] || "other";
}

function buildTemplatePrompt(st: SystemTemplate): string {
  const lines = [
    `## Template: ${st.name} (${st.id})`,
    ``,
    `Archetype: ${st.archetype}`,
    `Image type: ${st.imageType}`,
    `Visual complexity: ${st.visualComplexity || "medium"}`,
    `Information density: ${st.informationDensity || "medium"}`,
    `Copy profile: ${st.copyProfile || "headline_only"}`,
    ``,
    `Visual identity: ${st.visualIdentity || "See structured rules."}`,
    `Color direction: ${st.colorDirection || "See structured rules."}`,
    `Layout non-negotiables: ${st.layoutNonNegotiables || "See structured rules."}`,
    ``,
    `Mandatory visual rules:`,
    ...(st.mandatoryVisualRules || []).map((r) => `- ${r}`),
    ``,
    `Avoid:`,
    ...(st.avoidRules || []).map((r) => `- ${r}`),
    ``,
    `Scene rules:`,
    ...(st.sceneRules || []).map((r) => `- ${r}`),
    ``,
    `Lighting / color rules:`,
    ...(st.lightingColorRules || []).map((r) => `- ${r}`),
    ``,
    `Product placement rules:`,
    ...(st.productPlacementRules || []).map((r) => `- ${r}`),
    ``,
    `Copy rules:`,
    ...(st.copyRules || []).map((r) => `- ${r}`),
    ``,
    `Risk rules:`,
    ...(st.riskRules || []).map((r) => `- ${r}`),
  ];
  return lines.join("\n");
}

export function systemTemplateToPlanTemplate(st: SystemTemplate): PlanTemplate {
  return {
    id: st.id,
    name: st.name,
    description: st.description,
    scope: "system",
    category: st.id === "tpl-image-set-5" ? "image_set" : "single_image",
    tags: TAG_MAP[st.id] || ["系统模板"],
    applicablePlatforms: ["Amazon", "Temu", "Ozon", "独立站", "通用"],
    applicableProducts: ["工业品", "五金", "工具", "紧固件", "切削工具"],
    variables: [{ key: "headline", label: "主标题 Headline", type: "text", required: true }],
    templatePrompt: buildTemplatePrompt(st),
    defaultRiskRules: st.riskRules || [],
    enabled: true,
    group: (getTemplateCategory(st.id) as PlanTemplate["group"]) || "ecommerce",
  };
}

export function getSystemTemplates(): PlanTemplate[] {
  return Object.values(SYSTEM_TEMPLATE_PROFILES)
    .map(systemTemplateToPlanTemplate)
    .filter((t) => t.enabled);
}

export function getSystemTemplateById(id: string): PlanTemplate | undefined {
  const st = SYSTEM_TEMPLATE_PROFILES[id];
  return st ? systemTemplateToPlanTemplate(st) : undefined;
}

export function savedTemplateToPlanTemplate(saved: SavedTemplate): PlanTemplate {
  const base = saved.baseTemplateId
    ? SYSTEM_TEMPLATE_PROFILES[saved.baseTemplateId]
    : undefined;
  const name = saved.name || base?.name || "自定义模板";
  return {
    id: saved.id,
    name,
    description: base?.description || "",
    scope: "user",
    category: "single_image",
    tags: ["用户保存"],
    applicablePlatforms: ["通用"],
    applicableProducts: ["工业品"],
    variables: [],
    templatePrompt: base ? buildTemplatePrompt(base) : "",
    defaultRiskRules: saved.riskRules || base?.riskRules || [],
    enabled: true,
    createdAt: new Date(saved.createdAt).toISOString(),
  };
}

export function planTemplateToSavedTemplate(pt: PlanTemplate): SavedTemplate {
  return {
    id: pt.id,
    name: pt.name,
    imageType: "auto",
    riskRules: pt.defaultRiskRules,
    createdAt: pt.createdAt ? new Date(pt.createdAt).getTime() : Date.now(),
  };
}
