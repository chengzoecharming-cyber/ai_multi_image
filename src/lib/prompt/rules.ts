/**
 * Prompt Rules Configuration
 *
 * MVP stage: defined as code-based config files.
 * Future: migrate to database + admin panel when options grow.
 *
 * Each rule category contains selectable options, each with a promptFragment
 * that contributes to the final generated prompt.
 */

import { PromptRuleCategory, PromptRuleOption } from "./types";

/** Platform options */
export const PLATFORM_RULES: PromptRuleCategory = {
  key: "platform",
  label: "电商平台",
  description: "选择目标电商平台，影响图片风格和构图要求",
  allowMultiple: false,
  options: [
    {
      id: "amazon",
      label: "Amazon",
      promptFragment:
        "Amazon-ready product listing image, clean commercial composition, high conversion layout, professional e-commerce standard",
      sortOrder: 1,
      enabled: true,
    },
    {
      id: "alibaba",
      label: "阿里巴巴",
      promptFragment:
        "Alibaba B2B product showcase, industrial commercial style, factory-direct aesthetic, bulk order appeal",
      sortOrder: 2,
      enabled: true,
    },
    {
      id: "taobao",
      label: "淘宝/天猫",
      promptFragment:
        "Taobao/Tmall style product image, vibrant consumer appeal, lifestyle context, C2C marketplace aesthetic",
      sortOrder: 3,
      enabled: true,
    },
    {
      id: "jd",
      label: "京东",
      promptFragment:
        "JD.com style product photography, premium quality feel, trustworthy brand image, clean retail presentation",
      sortOrder: 4,
      enabled: true,
    },
    {
      id: "ebay",
      label: "eBay",
      promptFragment:
        "eBay marketplace product image, clear and straightforward, auction-friendly composition, global appeal",
      sortOrder: 5,
      enabled: true,
    },
    {
      id: "generic",
      label: "通用",
      promptFragment:
        "professional e-commerce product image, versatile commercial photography, cross-platform compatible",
      sortOrder: 6,
      enabled: true,
    },
  ],
};

/** Product category options (focused on mechanical/industrial for MVP) */
export const PRODUCT_CATEGORY_RULES: PromptRuleCategory = {
  key: "productCategory",
  label: "产品类目",
  description: "选择产品类目，影响产品特征描述",
  allowMultiple: false,
  options: [
    {
      id: "shaft",
      label: "转轴",
      promptFragment:
        "precision metal shaft component, accurate mechanical structure, cylindrical metal part, rotational axis element",
      sortOrder: 1,
      enabled: true,
    },
    {
      id: "bearing",
      label: "轴承",
      promptFragment:
        "precision bearing component, smooth rotational mechanism, ball bearing or roller bearing, industrial mechanical part",
      sortOrder: 2,
      enabled: true,
    },
    {
      id: "gear",
      label: "齿轮",
      promptFragment:
        "precision gear component, toothed mechanical wheel, transmission element, accurate gear profile",
      sortOrder: 3,
      enabled: true,
    },
    {
      id: "fastener",
      label: "紧固件",
      promptFragment:
        "industrial fastener component, bolt nut screw washer, threaded connection element, standard hardware part",
      sortOrder: 4,
      enabled: true,
    },
    {
      id: "valve",
      label: "阀门",
      promptFragment:
        "industrial valve component, flow control mechanism, pipe connection fitting, pressure regulation device",
      sortOrder: 5,
      enabled: true,
    },
    {
      id: "pump",
      label: "泵类",
      promptFragment:
        "industrial pump component, fluid transfer device, impeller housing, mechanical seal assembly",
      sortOrder: 6,
      enabled: true,
    },
    {
      id: "mold",
      label: "模具",
      promptFragment:
        "precision mold component, die casting tool, injection molding part, cavity and core structure",
      sortOrder: 7,
      enabled: true,
    },
    {
      id: "automation",
      label: "自动化设备",
      promptFragment:
        "industrial automation equipment, robotic mechanism, linear motion system, precision assembly device",
      sortOrder: 8,
      enabled: true,
    },
    {
      id: "custom",
      label: "定制件",
      promptFragment:
        "custom machined component, OEM precision part, tailored industrial component, bespoke manufacturing piece",
      sortOrder: 9,
      enabled: true,
    },
  ],
};

/** Image type options */
export const IMAGE_TYPE_RULES: PromptRuleCategory = {
  key: "imageType",
  label: "图片类型",
  description: "选择生成的图片类型",
  allowMultiple: false,
  options: [
    {
      id: "white-background-main-image",
      label: "白底主图",
      promptFragment:
        "pure white background, centered product, clean catalog style, isolated product photography, no shadows on background",
      sortOrder: 1,
      enabled: true,
    },
    {
      id: "scene-image",
      label: "场景图",
      promptFragment:
        "lifestyle product scene, contextual environment, real-world application setting, atmospheric lighting",
      sortOrder: 2,
      enabled: true,
    },
    {
      id: "detail-image",
      label: "细节图",
      promptFragment:
        "close-up product detail, macro photography style, surface texture focus, precision feature highlight",
      sortOrder: 3,
      enabled: true,
    },
    {
      id: "comparison-image",
      label: "对比图",
      promptFragment:
        "product comparison layout, before and after style, size reference included, dimensional comparison",
      sortOrder: 4,
      enabled: true,
    },
    {
      id: "package-image",
      label: "包装图",
      promptFragment:
        "product packaging presentation, boxed or bagged product, retail packaging display, branded container",
      sortOrder: 5,
      enabled: true,
    },
    {
      id: "poster",
      label: "海报",
      promptFragment:
        "promotional poster design, marketing banner style, eye-catching layout, bold typography space, campaign ready",
      sortOrder: 6,
      enabled: true,
    },
  ],
};

/** Visual tag options (multiple selection allowed) */
export const VISUAL_TAG_RULES: PromptRuleCategory = {
  key: "visualTags",
  label: "视觉标签",
  description: "选择视觉风格标签，可多选",
  allowMultiple: true,
  options: [
    {
      id: "metal-texture",
      label: "金属质感",
      promptFragment:
        "realistic metallic texture, refined highlights and reflections, polished metal surface, CNC machined finish",
      sortOrder: 1,
      enabled: true,
    },
    {
      id: "precision-machining",
      label: "精密加工",
      promptFragment:
        "precision machining marks, fine tolerance details, CNC milling traces, high accuracy manufacturing",
      sortOrder: 2,
      enabled: true,
    },
    {
      id: "rust-proof",
      label: "防锈处理",
      promptFragment:
        "corrosion-resistant coating, zinc plated or black oxide finish, protective surface treatment, anti-rust appearance",
      sortOrder: 3,
      enabled: true,
    },
    {
      id: "high-gloss",
      label: "高光泽",
      promptFragment:
        "high gloss finish, mirror-like reflective surface, chrome plated appearance, shiny polished look",
      sortOrder: 4,
      enabled: true,
    },
    {
      id: "matte-finish",
      label: "哑光处理",
      promptFragment:
        "matte finish surface, satin texture, low reflection, soft diffused appearance, anodized matte look",
      sortOrder: 5,
      enabled: true,
    },
    {
      id: "industrial-style",
      label: "工业风格",
      promptFragment:
        "industrial design aesthetic, mechanical engineering look, functional beauty, robust construction feel",
      sortOrder: 6,
      enabled: true,
    },
    {
      id: "premium-quality",
      label: "高端品质",
      promptFragment:
        "premium quality appearance, luxury product feel, high-end manufacturing, superior craftsmanship",
      sortOrder: 7,
      enabled: true,
    },
    {
      id: "dimensional-accuracy",
      label: "尺寸精确",
      promptFragment:
        "dimensionally accurate representation, true-to-scale proportions, engineering drawing precision, exact measurements",
      sortOrder: 8,
      enabled: true,
    },
  ],
};

/** Background options */
export const BACKGROUND_RULES: PromptRuleCategory = {
  key: "background",
  label: "背景",
  description: "选择背景风格",
  allowMultiple: false,
  options: [
    {
      id: "pure-white",
      label: "纯白",
      promptFragment:
        "pure white seamless background, clean and minimal, no distractions, professional studio white",
      sortOrder: 1,
      enabled: true,
    },
    {
      id: "gradient-gray",
      label: "渐变灰",
      promptFragment:
        "subtle gradient gray background, soft tonal transition, professional neutral backdrop, elegant simplicity",
      sortOrder: 2,
      enabled: true,
    },
    {
      id: "concrete",
      label: "水泥质感",
      promptFragment:
        "concrete texture background, industrial workshop feel, raw material aesthetic, gritty professional setting",
      sortOrder: 3,
      enabled: true,
    },
    {
      id: "wooden",
      label: "木质",
      promptFragment:
        "wooden surface background, warm natural texture, workshop table feel, organic material contrast",
      sortOrder: 4,
      enabled: true,
    },
    {
      id: "workshop",
      label: "车间环境",
      promptFragment:
        "industrial workshop background, factory environment, manufacturing setting, CNC machine blurred backdrop",
      sortOrder: 5,
      enabled: true,
    },
    {
      id: "transparent",
      label: "透明",
      promptFragment:
        "transparent or neutral background, PNG style isolation, no background elements, product-only focus",
      sortOrder: 6,
      enabled: true,
    },
  ],
};

/** Angle / perspective options */
export const ANGLE_RULES: PromptRuleCategory = {
  key: "angle",
  label: "拍摄角度",
  description: "选择产品拍摄角度",
  allowMultiple: false,
  options: [
    {
      id: "front",
      label: "正面",
      promptFragment:
        "front view angle, direct frontal perspective, head-on product shot, face-forward composition",
      sortOrder: 1,
      enabled: true,
    },
    {
      id: "45-degree",
      label: "45度",
      promptFragment:
        "45-degree isometric angle, three-quarter view, dynamic product perspective, best feature showcase angle",
      sortOrder: 2,
      enabled: true,
    },
    {
      id: "side",
      label: "侧面",
      promptFragment:
        "side profile view, lateral perspective, length and dimension showcase, side elevation angle",
      sortOrder: 3,
      enabled: true,
    },
    {
      id: "top",
      label: "俯视",
      promptFragment:
        "top-down view, overhead perspective, plan view angle, bird's eye product shot",
      sortOrder: 4,
      enabled: true,
    },
    {
      id: "detail-closeup",
      label: "细节特写",
      promptFragment:
        "extreme close-up detail shot, macro perspective, feature highlight angle, surface texture focus",
      sortOrder: 5,
      enabled: true,
    },
    {
      id: "exploded",
      label: "爆炸图",
      promptFragment:
        "exploded view perspective, component separation visualization, assembly diagram style, parts disassembled",
      sortOrder: 6,
      enabled: true,
    },
  ],
};

/** Negative tag options (for negative prompt building) */
export const NEGATIVE_TAG_RULES: PromptRuleCategory = {
  key: "negativeTags",
  label: "排除标签",
  description: "选择需要排除的元素",
  allowMultiple: true,
  options: [
    {
      id: "no-humans",
      label: "无人物",
      promptFragment: "people, person, human, hand, finger, body",
      sortOrder: 1,
      enabled: true,
    },
    {
      id: "no-text",
      label: "无文字",
      promptFragment: "text, words, letters, watermark, logo, label, typography",
      sortOrder: 2,
      enabled: true,
    },
    {
      id: "no-shadows",
      label: "无阴影",
      promptFragment: "harsh shadows, dark shadows, heavy shadow",
      sortOrder: 3,
      enabled: true,
    },
    {
      id: "no-clutter",
      label: "无杂乱背景",
      promptFragment: "cluttered background, busy background, distracting elements, noise",
      sortOrder: 4,
      enabled: true,
    },
    {
      id: "no-damage",
      label: "无瑕疵",
      promptFragment: "scratches, dents, rust, corrosion, damage, defects, imperfections",
      sortOrder: 5,
      enabled: true,
    },
    {
      id: "no-blur",
      label: "无模糊",
      promptFragment: "blur, blurry, out of focus, soft focus, motion blur",
      sortOrder: 6,
      enabled: true,
    },
  ],
};

/** All rule categories in display order */
export const ALL_RULE_CATEGORIES: PromptRuleCategory[] = [
  PLATFORM_RULES,
  PRODUCT_CATEGORY_RULES,
  IMAGE_TYPE_RULES,
  VISUAL_TAG_RULES,
  BACKGROUND_RULES,
  ANGLE_RULES,
  NEGATIVE_TAG_RULES,
];

/** Get a specific rule category by key */
export function getRuleCategory(key: string): PromptRuleCategory | undefined {
  return ALL_RULE_CATEGORIES.find((cat) => cat.key === key);
}

/** Get enabled options for a specific rule category */
export function getEnabledOptions(key: string): PromptRuleOption[] {
  const category = getRuleCategory(key);
  if (!category) return [];
  return category.options
    .filter((opt) => opt.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Get a single option by category key and option id */
export function getOptionById(
  categoryKey: string,
  optionId: string
): PromptRuleOption | undefined {
  const category = getRuleCategory(categoryKey);
  if (!category) return undefined;
  return category.options.find((opt) => opt.id === optionId && opt.enabled);
}

/** Get multiple options by category key and option ids */
export function getOptionsByIds(
  categoryKey: string,
  optionIds: string[]
): PromptRuleOption[] {
  const category = getRuleCategory(categoryKey);
  if (!category) return [];
  return optionIds
    .map((id) => category.options.find((opt) => opt.id === id && opt.enabled))
    .filter((opt): opt is PromptRuleOption => opt !== undefined);
}
