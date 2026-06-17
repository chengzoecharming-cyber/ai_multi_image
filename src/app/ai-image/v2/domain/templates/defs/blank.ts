import type { SystemTemplate } from "../types";

/**
 * 完全空白模板 — 自由创作模式
 *
 * 无任何系统规则注入，prompt 直发 LLM。
 * 用户的输入直接作为生成指令，不做任何模板化处理。
 */

export const tplBlank: SystemTemplate = {
  id: "tpl-blank-free",
  name: "空白模板",
  description: "完全自由的创作模式。无任何预设规则，你的 prompt 将直接发送给 AI 进行生成。适合实验性创作或已有完整提示词的场景。",
  imageType: "auto",
  archetype: "free",
  allowedLayoutTypes: [],
  defaultCopyDensity: "minimal",

  // ── v2.1 新三层架构 ──
  configV2: {
    intent: "hero_main",
    preferredStyleWorlds: [],
    preferredLayouts: [],
    defaultCopyMode: "no_text",
    headlineRequirement: "none",
    defaultCreativeFreedom: "expressive",
    productScaleStrategy: "balanced",
    safetyRules: [],
    conflictResolution: "空白模板：不注入任何系统规则，完全由用户配置决定。",
  },

  // ── 新控制字段 ──
  copyMode: "no_text",
  headlineRequirement: "none",
  creativeFreedom: "expressive",
  productScaleStrategy: "balanced",

  // ── 旧字段（空白模板不预设任何方向） ──
  visualComplexity: "medium",
  informationDensity: "medium",
  copyProfile: "headline_only",
  visualIdentity: "完全由用户 prompt 决定",
  colorDirection: "完全由用户 prompt 决定",
  layoutNonNegotiables: "完全由用户 prompt 决定",
  riskRules: [],
  allowedStyleIds: [],
  variants: [],
  mandatoryVisualRules: [],
  avoidRules: [],
  sceneRules: [],
  lightingColorRules: [],
  productPlacementRules: [],
  copyRules: [],
};
