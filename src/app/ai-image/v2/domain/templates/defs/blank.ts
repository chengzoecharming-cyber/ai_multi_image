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
    safetyRules: [
      "产品必须保持物理真实，不得产生变形或虚构结构",
      "不得生成任何违规、敏感或不适当内容",
    ],
    conflictResolution: "用户拥有完全控制权，prompt 直发，不做任何模板规则注入。",
  },

  // ── 新控制字段 ──
  copyMode: "no_text",
  headlineRequirement: "none",
  creativeFreedom: "expressive",
  productScaleStrategy: "balanced",

  // ── 旧字段（最小化保留） ──
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
