import type { VisualStyleId, VisualStyleProfile } from "./types";

export const VISUAL_STYLE_PROFILES: Record<VisualStyleId, VisualStyleProfile> = {
  clean_catalog: {
    id: "clean_catalog",
    label: "干净货架主图",
    visualDirection:
      "Clean catalog-style product photography with full product visibility, deep focus, soft diffused overhead lighting, gentle contact shadow, and disciplined negative space. The image should feel trustworthy, neutral, and marketplace-ready rather than decorative.",
    colorDirection:
      "White or very light neutral background (#FFFFFF, #F7F7F7, #F2F4F7), product natural colors, dark charcoal text #111827, restrained gray support text #6B7280.",
  },
  light_technical: {
    id: "light_technical",
    label: "浅色技术说明",
    visualDirection:
      "Light technical explainer style with full sharp product rendering, even studio light, subtle ground reflection, precise alignment, and clean information panels. The mood is engineered, readable, and calm.",
    colorDirection:
      "Cool light gray background #E8ECF0 to #F4F6F8, white panels #FFFFFF, primary text #111827, secondary #475569, single technical accent #0066CC or #008080.",
  },
  high_contrast_promo: {
    id: "high_contrast_promo",
    label: "高对比促销",
    visualDirection:
      "High-energy commercial promo photography with a sharply lit product, dramatic upper-left key light, hard-edged geometric blocks, bold scale contrast, and strong thumbnail impact. The composition should feel active and sales-driven without fake pricing or platform UI.",
    colorDirection:
      "Deep black #0A0A0A or charcoal #171717, white text #FFFFFF, one saturated accent such as electric blue #007BFF, vivid orange #FF6B00, hot red #FF2D55, or acid green #39FF14.",
  },
  macro_chiaroscuro: {
    id: "macro_chiaroscuro",
    label: "微距暗调质感",
    visualDirection:
      "Macro detail photography with dramatic cropping, shallow depth of field, a single hard warm side light from camera-left, deep black falloff, and strong specular highlights revealing surface texture, edges, threads, or tool marks.",
    colorDirection:
      "Near-black background #050505 to #0F0F0F, product natural metal tones, warm edge highlight #D97706 or copper #B87333, minimal text #F5F5F0.",
  },
  dark_technical: {
    id: "dark_technical",
    label: "深色工程解析",
    visualDirection:
      "Dark engineering breakdown style with sharp product geometry, blue/cyan callout lines, technical grid texture, controlled rim accents, and structured inset/detail panels. It should look precise and analytical, not decorative.",
    colorDirection:
      "Dark slate #0F172A to #020617, panel #1E293B, text #F8FAFC, blue #3B82F6 and cyan #06B6D4 accents, silver support #94A3B8.",
  },
  workshop_lifestyle: {
    id: "workshop_lifestyle",
    label: "真实车间场景",
    visualDirection:
      "Authentic industrial lifestyle scene with product as the brightest and sharpest element, warm workshop ambient light, shallow background bokeh, believable CNC bench or assembly context, and subtle dust or metal-shaving atmosphere.",
    colorDirection:
      "Warm amber #D4A574, workshop brown #8B6914, oxidized metal #B87333, steel gray #708090, white text with soft shadow. Avoid neon and pure black void backgrounds.",
  },
  premium_black: {
    id: "premium_black",
    label: "高端黑底质感",
    visualDirection:
      "Premium gallery-style product photography in deep black space with sculptural product treatment, generous negative space, dramatic rim light, satin reflection, and restrained typography. The product should feel heavy, precise, and valuable.",
    colorDirection:
      "Near-black #0A0A0A to #111111, warm white #FFF8E7, champagne #F7E7CE or silver #C0C0C0 accents only, product natural material colors.",
  },
  comparison_drama: {
    id: "comparison_drama",
    label: "强对比论证",
    visualDirection:
      "Dramatic comparison storytelling with clear before/after or ordinary/upgraded contrast, stronger light and scale on the featured product, dimmer desaturated treatment on the inferior side, and instantly readable visual symbols.",
    colorDirection:
      "Unified deep dark #151515 to #1E1E1E, desaturated blue-gray #5A6A7A for ordinary side, red #DC2626 for problem mark, green #22C55E for solution mark, warm amber #FFB347 on featured product.",
  },
  bundle_pop: {
    id: "bundle_pop",
    label: "套装组合活力",
    visualDirection:
      "Orderly bundle showcase with multiple related items or variants, even commercial lighting across all items, bold but controlled geometric blocks, and an arranged value-focused composition.",
    colorDirection:
      "Deep navy #1A2744 or charcoal #2D2D2D, white text #FFFFFF, geometric accents #007BFF, #FF6B00, or #FF2D55, product natural colors.",
  },
};

export const DEFAULT_THREE_PLAN_STYLE_IDS: VisualStyleId[] = [
  "light_technical",
  "high_contrast_promo",
  "premium_black",
];

export function getVisualStyleProfile(styleId: VisualStyleId): VisualStyleProfile {
  return VISUAL_STYLE_PROFILES[styleId];
}
