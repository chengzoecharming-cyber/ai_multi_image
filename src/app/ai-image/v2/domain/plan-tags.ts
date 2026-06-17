import { getStyleWorldById } from "./style-worlds";
import type { BackgroundType, LightingMood } from "./style-worlds";
import type { CopyDensityId } from "./copy-density";
import type { CreativePlan } from "../types";

// ── 背景类型 → 中文标签 ──
const BACKGROUND_LABELS: Record<BackgroundType, string> = {
  pure_white: "白底",
  light_neutral: "浅底",
  soft_gradient: "渐变",
  deep_void: "深底",
  warm_studio: "暖底",
  cool_studio: "冷底",
  industrial_environment: "场景",
  material_surface: "材质",
  geometric_blocks: "几何块",
  editorial_negative_space: "留白",
  cinematic_dark: "暗底",
  colorful_flat: "多彩",
  blueprint_grid: "蓝图",
  bokeh_scene: "虚化场景",
};

// ── 光源 → 中文标签 ──
const LIGHTING_LABELS: Record<LightingMood, string> = {
  soft_diffused: "柔光",
  even_technical: "均光",
  dramatic_key_rim: "轮廓光",
  warm_ambient: "暖光",
  hard_chiaroscuro: "明暗对比",
  flat_cad: "平光",
  editorial_natural: "自然光",
  promo_spotlight: "聚光",
  cinematic_mixed: "电影感",
};

// ── 文案密度 → 中文标签 ──
const COPY_DENSITY_LABELS: Record<CopyDensityId, string> = {
  headline_only: "仅标题",
  minimal: "轻量文案",
  medium: "中等文案",
  rich: "丰富文案",
};

/**
 * 从 CreativePlan 提取总结性标签。
 *
 * 标签顺序：
 * 1. 方案类型（planArchetype）—— 调用方已处理，这里不返回
 * 2. 背景类型（从 StyleWorld.typicalBackgrounds）
 * 3. 光源/色调（从 StyleWorld.typicalLighting）
 * 4. 文案密度（从 copyDensity）
 * 5. 视觉风格标签（visualStyleLabel）
 *
 * 返回数组中不含空值，可直接渲染。
 */
export function getPlanTags(plan: CreativePlan): string[] {
  const tags: (string | null)[] = [];

  // 1. 背景类型（首选 StyleWorld 结构化数据）
  if (plan.visualStyleId) {
    const sw = getStyleWorldById(plan.visualStyleId);
    if (sw && sw.typicalBackgrounds?.length > 0) {
      const bg = sw.typicalBackgrounds[0];
      tags.push(BACKGROUND_LABELS[bg] || bg);
    }
    // 2. 光源/色调
    if (sw && sw.typicalLighting?.length > 0) {
      const light = sw.typicalLighting[0];
      tags.push(LIGHTING_LABELS[light] || light);
    }
  }

  // 3. 文案密度
  if (plan.copyDensity) {
    tags.push(COPY_DENSITY_LABELS[plan.copyDensity] || plan.copyDensity);
  }

  // 4. 视觉风格标签（visualStyleLabel）
  if (plan.visualStyleLabel) {
    tags.push(plan.visualStyleLabel);
  }

  return tags.filter(Boolean) as string[];
}

/**
 * 根据背景类型推断色调（亮/暗/暖/冷）。
 * 用于需要显示"色调"标签的场景。
 */
export function getToneTagFromBackground(
  background?: BackgroundType
): "亮调" | "暗调" | "暖调" | "冷调" | null {
  if (!background) return null;
  switch (background) {
    case "pure_white":
    case "light_neutral":
    case "soft_gradient":
    case "colorful_flat":
      return "亮调";
    case "deep_void":
    case "cinematic_dark":
    case "editorial_negative_space":
      return "暗调";
    case "warm_studio":
    case "material_surface":
      return "暖调";
    case "cool_studio":
    case "blueprint_grid":
      return "冷调";
    default:
      return null;
  }
}
