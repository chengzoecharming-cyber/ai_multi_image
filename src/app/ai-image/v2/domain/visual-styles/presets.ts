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

  cnc_machine_bed: {
    id: "cnc_machine_bed",
    label: "CNC 机床场景",
    visualDirection:
      "Product placed on or near a CNC machine bed with coolant residue, metal chips, and cutting tools scattered around. Warm amber workshop light from overhead. Background: blurred machine controls and tool carousel. Product is the brightest element, with sharp focus and warm rim light.",
    colorDirection:
      "Warm amber #D4A574, oxidized metal #B87333, steel gray #708090, coolant blue-green hint #4A7C6F (subtle), white text with soft shadow.",
  },

  worn_workbench: {
    id: "worn_workbench",
    label: "磨损工作台场景",
    visualDirection:
      "Product resting on a worn wooden or metal workbench with visible scratches, oil stains, and scattered tools (wrenches, calipers, rulers). Warm tungsten light from upper-left. Background: heavily blurred workshop wall with pegboard. Product in tack-sharp focus, catching the key light.",
    colorDirection:
      "Workshop brown #8B6914, warm amber #D4A574, steel gray #708090, dark wood #3D2B1F, white text with soft shadow.",
  },

  assembly_station: {
    id: "assembly_station",
    label: "装配站场景",
    visualDirection:
      "Product at an industrial assembly station with partially assembled components, torque tools, and fixturing visible. Warm overhead LED light mixed with tungsten. Background: blurred conveyor or parts bin. Product is the hero, with crisp detail and subtle warm rim light separating it from background.",
    colorDirection:
      "Warm amber #D4A574, steel gray #708090, oxidized metal #B87333, safety yellow #FACC15 (subtle accent on tools), white text with soft shadow.",
  },

  // ============================================================
  // 空模板专用 Light 模式风格
  // ============================================================

  empty_light_clean: {
    id: "empty_light_clean",
    label: "极简高级目录",
    visualDirection:
      "Premium catalog-style product photography on a very light neutral background (#FAFAFA to #F0F0F0) with generous negative space. The product is the sole hero, occupying 60-70% of the frame with tack-sharp focus and a subtle directional drop shadow. Typography is bold and confident with extreme size contrast between the massive headline and minimal supporting text. The overall mood is Apple-product-page level restraint and authority.",
    colorDirection:
      "Background: very light warm gray #FAFAFA to #F0F0F0. Product: natural material colors only. Text: deep charcoal #1a1a1a for headlines, medium gray #6B7280 for subtext. Accent: single technical blue #0066FF used sparingly for one highlight element only.",
  },

  empty_light_bold: {
    id: "empty_light_bold",
    label: "Bold 对比冲击",
    visualDirection:
      "Magazine-cover level commercial photography with a light background but dramatic high-contrast treatment. The product has strong directional shadow and bold graphic framing. Large typography dominates the upper portion with aggressive scale contrast. Geometric shapes or bold lines create visual tension. The mood is confident, punchy, and impossible to scroll past.",
    colorDirection:
      "Background: clean white #FFFFFF to very light gray #F5F5F5. Product: high contrast with deep shadow. Text: pure black #000000 headlines, dark gray #333333 body. Accent: vivid electric blue #007BFF or bold orange #FF6B00 for one key visual element.",
  },

  empty_light_technical: {
    id: "empty_light_technical",
    label: "浅色技术说明",
    visualDirection:
      "Light technical explainer style with clean studio lighting, subtle ground reflection, and structured information panels. The product is sharp and well-lit with even illumination. Feature information is organized in geometric cards with icons, creating a sense of engineered precision. The mood is readable, trustworthy, and analytical without being cold.",
    colorDirection:
      "Background: cool light gray #E8ECF0 to #F4F6F8. Panels: white #FFFFFF with subtle shadow. Text: dark #111827 headlines, secondary #475569 descriptions. Accent: single technical blue #0066CC or teal #008080.",
  },

  // ============================================================
  // 空模板专用 Dark 模式风格
  // ============================================================

  empty_dark_tech: {
    id: "empty_dark_tech",
    label: "深蓝科技剧场",
    visualDirection:
      "Dark cinematic product photography with a deep blue-black background and dramatic rim lighting. The product catches a cool blue key light from upper-left and a subtle rim light from behind, creating a glowing edge separation. Subtle particle effects or faint light streaks add atmosphere without clutter. The mood is futuristic, powerful, and tech-forward.",
    colorDirection:
      "Background: deep navy-black #0A0A1A to #0F172A with radial light falloff. Text: pure white #FFFFFF headlines, cool blue-gray #94A3B8 descriptions. Accent: electric blue #3B82F6 and cyan #06B6D4 for glow effects and highlights.",
  },

  empty_dark_luxury: {
    id: "empty_dark_luxury",
    label: "黑金高端质感",
    visualDirection:
      "Premium gallery-style dark photography with near-black background and sculptural product treatment. Dramatic warm rim light wraps the product edges. Satin or brushed metal reflections are emphasized. Typography is elegant and restrained. The mood is expensive, rare, and museum-quality.",
    colorDirection:
      "Background: near-black #0A0A0A to #111111. Text: warm white #FFF8E7 headlines, champagne #F7E7CE accents. Accent: champagne gold #D4AF37 or antique gold #C5A059 for subtle highlights and decorative elements only.",
  },

  empty_dark_dynamic: {
    id: "empty_dark_dynamic",
    label: "动感工业力量",
    visualDirection:
      "High-energy industrial photography with dark background and dramatic motion elements. Sparks, metal chips, or light trails suggest active machining or cutting. The product is sharply lit with a hard key light while the environment falls into deep shadow. The mood is raw power, precision in motion, and mechanical dominance.",
    colorDirection:
      "Background: deep charcoal-black #0F0F0F to #1A1A1A. Text: bright white #FFFFFF headlines, steel gray #C0C0C0 descriptions. Accent: hot orange #FF6B00 or molten gold #FFB800 for sparks and dynamic light effects. Cool blue #3B82F6 for secondary highlights.",
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
