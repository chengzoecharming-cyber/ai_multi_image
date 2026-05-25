import type { SystemTemplate } from "./types";
import type { ImageTypeId } from "../image-types";
import type { LayoutType } from "../layouts";
import type { CopyDensityId } from "../copy-density";

import { tplComparison } from "./defs/comparison";
import { tplLifestyle } from "./defs/lifestyle";
import { tplEnvironment } from "./defs/environment";
import { tplFeature } from "./defs/feature";
import { tplHero } from "./defs/hero";
import { tplPromo } from "./defs/promo";
import { tplMacro } from "./defs/macro";
import { tplBundle } from "./defs/bundle";
import { tplSpec } from "./defs/spec";
import { tplPremium } from "./defs/premium";
import { tplDimension } from "./defs/dimension";
import { tplImageSet5 } from "./defs/imageset5";

/**
 * SYSTEM_TEMPLATE_PROFILES — 系统模板配置全集。
 *
 * 所有模板均从 domain/templates/defs/*.ts 导入，为完整的结构化 SystemTemplate。
 * v2 不再使用旧层的 templatePrompt 文本，统一通过 PlanBrief → briefPrompt 驱动 LLM。
 */
export const SYSTEM_TEMPLATE_PROFILES: Record<string, SystemTemplate> = {
  "tpl-white-bg-hero": tplHero,
  "tpl-temu-promo": tplPromo,
  "tpl-feature-explanation": tplFeature,
  "tpl-macro-detail": tplMacro,
  "tpl-advantage-comparison": tplComparison,
  "tpl-lifestyle-scene": tplLifestyle,
  "tpl-environment-scene": tplEnvironment,
  "tpl-bundle-showcase": tplBundle,
  "tpl-spec-technical": tplSpec,
  "tpl-premium-luxury": tplPremium,
  "tpl-dimension-annotation": tplDimension,
  "tpl-image-set-5": tplImageSet5,
};

/**
 * 系统模板 ID 列表（用于遍历）。
 */
export const SYSTEM_TEMPLATE_IDS = Object.keys(SYSTEM_TEMPLATE_PROFILES);

/**
 * 通过模板 ID 查询系统模板配置。
 */
export function getSystemTemplateProfile(id: string): SystemTemplate | undefined {
  return SYSTEM_TEMPLATE_PROFILES[id];
}

/**
 * 查询模板对应的图片用途。
 */
export function getTemplateImageType(id: string): ImageTypeId | undefined {
  return SYSTEM_TEMPLATE_PROFILES[id]?.imageType;
}

/**
 * 查询模板对应的默认文案密度。
 */
export function getTemplateDefaultCopyDensity(id: string): CopyDensityId | undefined {
  return SYSTEM_TEMPLATE_PROFILES[id]?.defaultCopyDensity;
}

/**
 * 查询模板允许的版式结构列表。
 */
export function getTemplateAllowedLayouts(id: string): LayoutType[] | undefined {
  return SYSTEM_TEMPLATE_PROFILES[id]?.allowedLayoutTypes;
}
