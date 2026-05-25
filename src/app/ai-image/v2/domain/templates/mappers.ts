import type { SystemTemplate } from "./types";
import type { ImageTypeId } from "../image-types";
import type { LayoutType } from "../layouts";
import type { CopyDensityId } from "../copy-density";
import {
  getSystemTemplateProfile,
  getTemplateImageType,
  getTemplateDefaultCopyDensity,
  getTemplateAllowedLayouts,
} from "./presets";

/**
 * 模板 -> 图片用途。
 */
export function templateToImageType(templateId: string): ImageTypeId | undefined {
  return getTemplateImageType(templateId);
}

/**
 * 模板 -> 允许的布局结构。
 */
export function templateToAllowedLayouts(templateId: string): LayoutType[] | undefined {
  return getTemplateAllowedLayouts(templateId);
}

/**
 * 模板 -> 默认文案密度。
 */
export function templateToDefaultCopyDensity(templateId: string): CopyDensityId | undefined {
  return getTemplateDefaultCopyDensity(templateId);
}

/**
 * 模板 -> 完整配置档案。
 */
export function templateToProfile(templateId: string): SystemTemplate | undefined {
  return getSystemTemplateProfile(templateId);
}

/**
 * 模板 -> 约束摘要（用于 plan-brief 组装）。
 */
export function templateToConstraints(templateId: string): {
  imageType?: ImageTypeId;
  allowedLayouts?: LayoutType[];
  defaultCopyDensity?: CopyDensityId;
  riskRules?: string[];
} {
  const profile = getSystemTemplateProfile(templateId);
  if (!profile) return {};
  return {
    imageType: profile.imageType,
    allowedLayouts: profile.allowedLayoutTypes,
    defaultCopyDensity: profile.defaultCopyDensity,
    riskRules: profile.riskRules,
  };
}
