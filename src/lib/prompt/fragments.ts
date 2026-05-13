/**
 * Prompt Fragments Data
 *
 * Default built-in prompt fragments for MVP demo.
 * Organized by group: product_category, image_type, visual_style, background, angle, material, negative.
 *
 * Future: migrate to database + admin panel when the fragment library grows.
 */

import { PromptFragment, PromptFragmentGroup } from "./types";

export const FRAGMENT_GROUPS: { key: PromptFragmentGroup; label: string }[] = [
  { key: "product_category", label: "产品类目" },
  { key: "image_type", label: "图片用途" },
  { key: "visual_style", label: "视觉风格" },
  { key: "background", label: "背景场景" },
  { key: "angle", label: "拍摄角度" },
  { key: "material", label: "材质表现" },
  { key: "negative", label: "负向要求" },
];

export const DEFAULT_FRAGMENTS: PromptFragment[] = [
  // ───────────────── product_category ─────────────────
  {
    id: "fastener",
    group: "product_category",
    name: "紧固连接件",
    description: "螺栓、螺母、垫圈等标准紧固件产品。",
    promptFragment:
      "precision hardware fastener, clean mechanical structure, accurate thread details, durable metal material, professional product photography",
    tags: ["紧固件", "螺栓", "螺母"],
    sortOrder: 1,
    enabled: true,
  },
  {
    id: "transmission",
    group: "product_category",
    name: "转动与传动件",
    description: "轴承、齿轮、联轴器等转动传动零部件。",
    promptFragment:
      "precision transmission component, accurate cylindrical structure, clean machined surface, visible grooves and connection details, professional industrial product photography",
    tags: ["轴承", "齿轮", "传动"],
    sortOrder: 2,
    enabled: true,
  },
  {
    id: "cutting_tools",
    group: "product_category",
    name: "刀具与加工工具",
    description: "铣刀、钻头、丝锥等工业切削刀具。",
    promptFragment:
      "industrial cutting tool, sharp cutting edge, precise geometry, metallic texture, polished surface, professional product photography",
    tags: ["刀具", "铣刀", "钻头"],
    sortOrder: 3,
    enabled: true,
  },
  {
    id: "hardware",
    group: "product_category",
    name: "五金配件",
    description: "通用五金件、小配件、非标零件。",
    promptFragment:
      "hardware accessory product, clean structure, durable metal material, practical design, commercial product photography",
    tags: ["五金", "配件", "通用件"],
    sortOrder: 4,
    enabled: true,
  },
  {
    id: "mechanical_part",
    group: "product_category",
    name: "机械结构件",
    description: "机加工结构件、支架、壳体、法兰等。",
    promptFragment:
      "machined mechanical part, precise structure, clean edges, accurate holes and cutouts, high-quality industrial product photography",
    tags: ["结构件", "机加工", "壳体"],
    sortOrder: 5,
    enabled: true,
  },
  {
    id: "custom_cnc",
    group: "product_category",
    name: "定制加工件",
    description: "CNC 定制加工零件、来图加工产品。",
    promptFragment:
      "custom CNC machined part, precise manufacturing details, clean machined surface, accurate geometry, professional industrial product photography",
    tags: ["CNC", "定制", "机加工"],
    sortOrder: 6,
    enabled: true,
  },

  // ───────────────── image_type ─────────────────
  {
    id: "white_bg_main",
    group: "image_type",
    name: "白底主图",
    description: "电商平台标准白底产品主图，干净简洁。",
    promptFragment:
      "pure white background, centered composition, clean product catalog style, clear silhouette, no text, no watermark",
    tags: ["白底", "主图", "电商"],
    sortOrder: 1,
    enabled: true,
  },
  {
    id: "metal_texture",
    group: "image_type",
    name: "金属质感图",
    description: "突出金属表面质感和反光效果。",
    promptFragment:
      "emphasize realistic metallic texture, refined highlights, polished or brushed surface, subtle reflections, premium material appearance",
    tags: ["金属质感", "反光", "质感"],
    sortOrder: 2,
    enabled: true,
  },
  {
    id: "structure_detail",
    group: "image_type",
    name: "结构细节图",
    description: "展示产品结构、孔位、螺纹、槽型等细节。",
    promptFragment:
      "close-up view, highlighting structural details, holes, threads, grooves, cutting edges and machining precision",
    tags: ["细节", "结构", "特写"],
    sortOrder: 3,
    enabled: true,
  },
  {
    id: "scene_application",
    group: "image_type",
    name: "应用场景图",
    description: "产品在工业环境中的实际应用展示。",
    promptFragment:
      "placed in a clean industrial workspace or assembly environment, realistic usage context, professional and practical atmosphere",
    tags: ["场景", "应用", "工业"],
    sortOrder: 4,
    enabled: true,
  },
  {
    id: "display_pedestal",
    group: "image_type",
    name: "展台图",
    description: "产品放置在展台上，突出展示效果。",
    promptFragment:
      "placed on a minimal display pedestal, clean studio lighting, premium product presentation, soft shadows",
    tags: ["展台", "展示", "陈列"],
    sortOrder: 5,
    enabled: true,
  },
  {
    id: "premium_poster",
    group: "image_type",
    name: "高级宣传图",
    description: "高端商业海报风格，适合品牌宣传。",
    promptFragment:
      "premium commercial product poster style, dramatic lighting, strong visual focus, clean background, high-end industrial product presentation",
    tags: ["海报", "高端", "宣传"],
    sortOrder: 6,
    enabled: true,
  },

  // ───────────────── visual_style ─────────────────
  {
    id: "minimal_white",
    group: "visual_style",
    name: "极简白底",
    description: "纯白背景、干净简洁的产品目录风格。",
    promptFragment:
      "minimal pure white background, clean product catalog style, centered product, soft shadow, high clarity, no text, no clutter",
    tags: ["极简", "白底", "干净"],
    sortOrder: 1,
    enabled: true,
  },
  {
    id: "premium_light_gray",
    group: "visual_style",
    name: "高级浅灰",
    description: "浅灰影棚背景，柔和灯光，高端商业质感。",
    promptFragment:
      "premium light gray studio background, soft diffused lighting, clean composition, subtle shadow, refined commercial product photography",
    tags: ["浅灰", "影棚", "高端"],
    sortOrder: 2,
    enabled: true,
  },
  {
    id: "dark_metal",
    group: "visual_style",
    name: "深灰金属",
    description: "深灰背景，突出金属反光、刀具锋利感和工业产品质感。",
    promptFragment:
      "dark gray studio background, controlled highlights, strong metallic texture, premium industrial product photography, subtle dramatic lighting",
    tags: ["金属质感", "深灰", "工业产品"],
    sortOrder: 3,
    enabled: true,
  },
  {
    id: "blue_tech",
    group: "visual_style",
    name: "蓝白科技",
    description: "蓝白科技风格背景，现代工业感。",
    promptFragment:
      "clean blue and white technology-inspired background, precise lighting, modern industrial style, crisp details, professional commercial look",
    tags: ["科技", "蓝白", "现代"],
    sortOrder: 4,
    enabled: true,
  },
  {
    id: "showcase",
    group: "visual_style",
    name: "展台橱窗",
    description: "展台橱窗风格，精致陈列，高端商业视觉。",
    promptFragment:
      "minimal display pedestal, clean showcase composition, soft studio lighting, premium product presentation, elegant commercial visual style",
    tags: ["展台", "橱窗", "陈列"],
    sortOrder: 5,
    enabled: true,
  },
  {
    id: "workbench",
    group: "visual_style",
    name: "工业工作台",
    description: "真实工业工作台场景，实用专业氛围。",
    promptFragment:
      "realistic industrial workbench scene, clean workshop environment, practical product usage context, professional lighting, no mess",
    tags: ["工作台", "工业", "场景"],
    sortOrder: 6,
    enabled: true,
  },
  {
    id: "macro_detail",
    group: "visual_style",
    name: "微距细节",
    description: "微距摄影风格，突出材质纹理和结构细节。",
    promptFragment:
      "macro close-up photography, sharp focus on material texture and structural details, shallow depth of field, high precision",
    tags: ["微距", "细节", "纹理"],
    sortOrder: 7,
    enabled: true,
  },
  {
    id: "warm_commercial",
    group: "visual_style",
    name: "暖调商业",
    description: "暖色调商业摄影，柔和亲切的产品展示。",
    promptFragment:
      "warm commercial studio lighting, soft beige or light neutral background, approachable product presentation, clean and premium",
    tags: ["暖调", "商业", "柔和"],
    sortOrder: 8,
    enabled: true,
  },

  // ───────────────── background ─────────────────
  {
    id: "bg_pure_white",
    group: "background",
    name: "纯白背景",
    description: "纯白色背景，适合电商产品上架。",
    promptFragment:
      "pure white background, clean and minimal, suitable for e-commerce product listing",
    tags: ["纯白", "电商", "干净"],
    sortOrder: 1,
    enabled: true,
  },
  {
    id: "bg_light_gray",
    group: "background",
    name: "浅灰背景",
    description: "浅灰影棚背景，柔和专业。",
    promptFragment:
      "light gray studio background, soft shadow, clean professional product presentation",
    tags: ["浅灰", "影棚", "专业"],
    sortOrder: 2,
    enabled: true,
  },
  {
    id: "bg_stone",
    group: "background",
    name: "石台背景",
    description: "天然石材展台背景，高端质感。",
    promptFragment:
      "natural stone pedestal, premium texture, clean studio composition",
    tags: ["石材", "展台", "高端"],
    sortOrder: 3,
    enabled: true,
  },
  {
    id: "bg_display",
    group: "background",
    name: "展台背景",
    description: "简约展台背景，产品居中展示。",
    promptFragment:
      "minimal display stand, product centered, clean showcase layout",
    tags: ["展台", "简约", "展示"],
    sortOrder: 4,
    enabled: true,
  },

  // ───────────────── angle ─────────────────
  {
    id: "angle_front",
    group: "angle",
    name: "正面展示",
    description: "正面视角，展示产品整体轮廓和结构。",
    promptFragment:
      "front-facing product view, clear silhouette and structure",
    tags: ["正面", "整体", "轮廓"],
    sortOrder: 1,
    enabled: true,
  },
  {
    id: "angle_45",
    group: "angle",
    name: "45度角展示",
    description: "45度角展示，突出产品立体感和细节。",
    promptFragment:
      "45-degree product photography angle, showing depth, structure and material details",
    tags: ["45度", "立体", "细节"],
    sortOrder: 2,
    enabled: true,
  },
  {
    id: "angle_top",
    group: "angle",
    name: "俯视角度",
    description: "俯视角度，展示产品布局和外形。",
    promptFragment:
      "top-down view, clean composition, showing product layout and shape",
    tags: ["俯视", "布局", "外形"],
    sortOrder: 3,
    enabled: true,
  },
  {
    id: "angle_closeup",
    group: "angle",
    name: "细节特写",
    description: "特写镜头，聚焦关键结构和材质纹理。",
    promptFragment:
      "close-up detail shot, sharp focus on key structure and material texture",
    tags: ["特写", "结构", "纹理"],
    sortOrder: 4,
    enabled: true,
  },

  // ───────────────── material ─────────────────
  {
    id: "mat_metal",
    group: "material",
    name: "金属质感",
    description: "真实金属质感表现，精细高光和反射。",
    promptFragment:
      "realistic metallic texture, refined highlights and subtle reflections",
    tags: ["金属", "质感", "反光"],
    sortOrder: 1,
    enabled: true,
  },
  {
    id: "mat_brushed",
    group: "material",
    name: "拉丝金属",
    description: "拉丝金属表面，细密线性纹理。",
    promptFragment:
      "brushed metal surface, fine linear texture, premium industrial finish",
    tags: ["拉丝", "纹理", "工业"],
    sortOrder: 2,
    enabled: true,
  },
  {
    id: "mat_polished",
    group: "material",
    name: "抛光金属",
    description: "抛光金属表面，干净反射，高品质光泽。",
    promptFragment:
      "polished metal surface, clean reflection, high-quality finish",
    tags: ["抛光", "光泽", "高品质"],
    sortOrder: 3,
    enabled: true,
  },
  {
    id: "mat_precision",
    group: "material",
    name: "精密加工",
    description: "精密加工细节，清晰边缘和准确几何形状。",
    promptFragment:
      "precision machining details, clean edges, accurate geometry, professional manufacturing quality",
    tags: ["精密", "加工", "几何"],
    sortOrder: 4,
    enabled: true,
  },

  // ───────────────── negative ─────────────────
  {
    id: "neg_no_text",
    group: "negative",
    name: "无文字",
    description: "画面中不出现任何文字、标签。",
    promptFragment: "no text, no captions, no labels",
    tags: ["无文字", "排除"],
    sortOrder: 1,
    enabled: true,
  },
  {
    id: "neg_no_watermark",
    group: "negative",
    name: "无水印",
    description: "画面中不出现水印或标志。",
    promptFragment: "no watermark, no logo",
    tags: ["无水印", "排除"],
    sortOrder: 2,
    enabled: true,
  },
  {
    id: "neg_no_deform",
    group: "negative",
    name: "不变形",
    description: "保持原始几何形状，不扭曲变形。",
    promptFragment: "no deformation, preserve original geometry",
    tags: ["不变形", "排除"],
    sortOrder: 3,
    enabled: true,
  },
  {
    id: "neg_no_extra",
    group: "negative",
    name: "无多余零件",
    description: "不添加不存在的零件或组件。",
    promptFragment: "no extra parts, no incorrect components",
    tags: ["无多余", "排除"],
    sortOrder: 4,
    enabled: true,
  },
  {
    id: "neg_clean_bg",
    group: "negative",
    name: "背景干净",
    description: "背景不出现杂乱元素。",
    promptFragment: "no messy background, no clutter",
    tags: ["干净背景", "排除"],
    sortOrder: 5,
    enabled: true,
  },
];

/** Get all enabled fragments */
export function getAllFragments(): PromptFragment[] {
  return DEFAULT_FRAGMENTS.filter((f) => f.enabled).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
}

/** Get fragments by group */
export function getFragmentsByGroup(
  group: PromptFragmentGroup
): PromptFragment[] {
  return getAllFragments().filter((f) => f.group === group);
}

/** Get a single fragment by id */
export function getFragmentById(id: string): PromptFragment | undefined {
  return DEFAULT_FRAGMENTS.find((f) => f.id === id && f.enabled);
}

/** Get multiple fragments by ids (preserves order) */
export function getFragmentsByIds(ids: string[]): PromptFragment[] {
  const map = new Map(DEFAULT_FRAGMENTS.map((f) => [f.id, f]));
  return ids
    .map((id) => map.get(id))
    .filter((f): f is PromptFragment => f !== undefined && f.enabled);
}
