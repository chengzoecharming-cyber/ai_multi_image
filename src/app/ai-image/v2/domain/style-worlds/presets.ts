import type { StyleWorld } from "./types";

// ── 基础 StyleWorld（原 VisualStyle 映射） ──

export const swCleanCatalog: StyleWorld = {
  id: "clean_catalog",
  label: "干净货架主图",
  description:
    "平台级干净主图。纯白或极浅中性背景，产品完整展示，柔和漫射光， disciplined negative space。适合 Amazon、Temu、1688 等平台主图。",
  visualDirection:
    "Clean catalog-style product photography with full product visibility, deep focus, soft diffused overhead lighting, gentle contact shadow, and disciplined negative space. The image should feel trustworthy, neutral, and marketplace-ready rather than decorative.",
  colorDirection:
    "White or very light neutral background (#FFFFFF, #F7F7F7, #F2F4F7), product natural colors, dark charcoal text #111827, restrained gray support text #6B7280.",
  suitableIntents: ["hero_main", "bundle_showcase", "promo_campaign"],
  suitableFreedomLevels: ["strict", "balanced"],
  typicalBackgrounds: ["pure_white", "light_neutral"],
  typicalLighting: ["soft_diffused", "even_technical"],
};

export const swLightTechnical: StyleWorld = {
  id: "light_technical",
  label: "浅色技术说明",
  description:
    "浅色背景上的技术说明风格。cool light gray 背景，白色信息面板，单点技术蓝 accent。产品完整锐利，even studio light， engineered and readable。",
  visualDirection:
    "Light technical explainer style with full sharp product rendering, even studio light, subtle ground reflection, precise alignment, and clean information panels. The mood is engineered, readable, and calm.",
  colorDirection:
    "Cool light gray background #E8ECF0 to #F4F6F8, white panels #FFFFFF, primary text #111827, secondary #475569, single technical accent #0066CC or #008080.",
  suitableIntents: ["feature_explain", "spec_dimension", "hero_main"],
  suitableFreedomLevels: ["strict", "balanced"],
  typicalBackgrounds: ["light_neutral", "pure_white"],
  typicalLighting: ["even_technical", "soft_diffused"],
};

export const swDarkTechnical: StyleWorld = {
  id: "dark_technical",
  label: "深色工程解析",
  description:
    "深色 slate 背景上的工程解析风格。蓝/青 callout lines，技术网格纹理，controlled rim accents。 precise and analytical，不 decorative。",
  visualDirection:
    "Dark engineering breakdown style with sharp product geometry, blue/cyan callout lines, technical grid texture, controlled rim accents, and structured inset/detail panels. It should look precise and analytical, not decorative.",
  colorDirection:
    "Dark slate #0F172A to #020617, panel #1E293B, text #F8FAFC, blue #3B82F6 and cyan #06B6D4 accents, silver support #94A3B8.",
  suitableIntents: ["feature_explain", "spec_dimension", "comparison"],
  suitableFreedomLevels: ["balanced", "expressive"],
  typicalBackgrounds: ["deep_void", "cool_studio"],
  typicalLighting: ["even_technical", "dramatic_key_rim"],
};

export const swHighContrastPromo: StyleWorld = {
  id: "high_contrast_promo",
  label: "高对比促销",
  description:
    "高能量促销风格。dramatic upper-left key light，hard-edged geometric blocks，bold scale contrast。active and sales-driven，但不 fake pricing。",
  visualDirection:
    "High-energy commercial promo photography with a sharply lit product, dramatic upper-left key light, hard-edged geometric blocks, bold scale contrast, and strong thumbnail impact. The composition should feel active and sales-driven without fake pricing or platform UI.",
  colorDirection:
    "Deep black #0A0A0A or charcoal #171717, white text #FFFFFF, one saturated accent such as electric blue #007BFF, vivid orange #FF6B00, hot red #FF2D55, or acid green #39FF14.",
  suitableIntents: ["promo_campaign", "hero_main", "bundle_showcase"],
  suitableFreedomLevels: ["expressive", "balanced"],
  typicalBackgrounds: ["deep_void", "geometric_blocks", "colorful_flat"],
  typicalLighting: ["promo_spotlight", "dramatic_key_rim"],
};

export const swMacroChiaroscuro: StyleWorld = {
  id: "macro_chiaroscuro",
  label: "微距暗调质感",
  description:
    "Macro detail 风格。dramatic cropping，shallow depth of field，单一硬暖侧光。deep black falloff，强烈 specular highlights 揭示 surface texture。",
  visualDirection:
    "Macro detail photography with dramatic cropping, shallow depth of field, a single hard warm side light from camera-left, deep black falloff, and strong specular highlights revealing surface texture, edges, threads, or tool marks.",
  colorDirection:
    "Near-black background #050505 to #0F0F0F, product natural metal tones, warm edge highlight #D97706 or copper #B87333, minimal text #F5F5F0.",
  suitableIntents: ["detail_focus", "brand_mood", "hero_main"],
  suitableFreedomLevels: ["expressive", "balanced"],
  typicalBackgrounds: ["deep_void", "cinematic_dark"],
  typicalLighting: ["hard_chiaroscuro", "dramatic_key_rim"],
};

export const swPremiumBlack: StyleWorld = {
  id: "premium_black",
  label: "高端黑底质感",
  description:
    "Premium gallery 风格。deep black space，sculptural product treatment，dramatic rim light，satin reflection。产品感觉 heavy, precise, valuable。",
  visualDirection:
    "Premium gallery-style product photography in deep black space with sculptural product treatment, generous negative space, dramatic rim light, satin reflection, and restrained typography. The product should feel heavy, precise, and valuable.",
  colorDirection:
    "Near-black #0A0A0A to #111111, warm white #FFF8E7, champagne #F7E7CE or silver #C0C0C0 accents only, product natural material colors.",
  suitableIntents: ["brand_mood", "hero_main", "detail_focus"],
  suitableFreedomLevels: ["expressive", "balanced"],
  typicalBackgrounds: ["deep_void", "cinematic_dark"],
  typicalLighting: ["dramatic_key_rim", "hard_chiaroscuro"],
};

export const swComparisonDrama: StyleWorld = {
  id: "comparison_drama",
  label: "强对比论证",
  description:
    "Dramatic comparison 风格。before/after 或 ordinary/upgraded 对比，featured product 更强光和更大比例，inferior side 更暗更 desaturated。",
  visualDirection:
    "Dramatic comparison storytelling with clear before/after or ordinary/upgraded contrast, stronger light and scale on the featured product, dimmer desaturated treatment on the inferior side, and instantly readable visual symbols.",
  colorDirection:
    "Unified deep dark #151515 to #1E1E1E, desaturated blue-gray #5A6A7A for ordinary side, red #DC2626 for problem mark, green #22C55E for solution mark, warm amber #FFB347 on featured product.",
  suitableIntents: ["comparison", "promo_campaign", "feature_explain"],
  suitableFreedomLevels: ["expressive", "balanced"],
  typicalBackgrounds: ["deep_void", "geometric_blocks"],
  typicalLighting: ["dramatic_key_rim", "promo_spotlight"],
};

export const swBundlePop: StyleWorld = {
  id: "bundle_pop",
  label: "套装组合活力",
  description:
    "Bundle showcase 风格。multiple related items，even commercial lighting，bold geometric blocks。arranged value-focused composition。",
  visualDirection:
    "Orderly bundle showcase with multiple related items or variants, even commercial lighting across all items, bold but controlled geometric blocks, and an arranged value-focused composition.",
  colorDirection:
    "Deep navy #1A2744 or charcoal #2D2D2D, white text #FFFFFF, geometric accents #007BFF, #FF6B00, or #FF2D55, product natural colors.",
  suitableIntents: ["bundle_showcase", "promo_campaign", "hero_main"],
  suitableFreedomLevels: ["balanced", "expressive"],
  typicalBackgrounds: ["deep_void", "colorful_flat", "geometric_blocks"],
  typicalLighting: ["even_technical", "promo_spotlight"],
};

export const swWorkshopLifestyle: StyleWorld = {
  id: "workshop_lifestyle",
  label: "真实车间场景",
  description:
    "Authentic industrial lifestyle。产品是最亮最锐利的元素，warm workshop ambient light，shallow background bokeh。believable CNC bench or assembly context。",
  visualDirection:
    "Authentic industrial lifestyle scene with product as the brightest and sharpest element, warm workshop ambient light, shallow background bokeh, believable CNC bench or assembly context, and subtle dust or metal-shaving atmosphere.",
  colorDirection:
    "Warm amber #D4A574, workshop brown #8B6914, oxidized metal #B87333, steel gray #708090, white text with soft shadow. Avoid neon and pure black void backgrounds.",
  suitableIntents: ["usage_scene", "brand_mood", "promo_campaign"],
  suitableFreedomLevels: ["expressive", "balanced"],
  typicalBackgrounds: ["industrial_environment", "bokeh_scene", "material_surface"],
  typicalLighting: ["warm_ambient", "editorial_natural"],
};

export const swCncMachineBed: StyleWorld = {
  id: "cnc_machine_bed",
  label: "CNC 机床场景",
  description:
    "产品置于 CNC 机床床身，有 coolant residue、metal chips、cutting tools。warm amber workshop light，product 最亮最锐利。",
  visualDirection:
    "Product placed on or near a CNC machine bed with coolant residue, metal chips, and cutting tools scattered around. Warm amber workshop light from overhead. Background: blurred machine controls and tool carousel. Product is the brightest element, with sharp focus and warm rim light.",
  colorDirection:
    "Warm amber #D4A574, oxidized metal #B87333, steel gray #708090, coolant blue-green hint #4A7C6F (subtle), white text with soft shadow.",
  suitableIntents: ["usage_scene", "brand_mood", "detail_focus"],
  suitableFreedomLevels: ["expressive", "balanced"],
  typicalBackgrounds: ["industrial_environment", "material_surface"],
  typicalLighting: ["warm_ambient", "dramatic_key_rim"],
};

export const swWornWorkbench: StyleWorld = {
  id: "worn_workbench",
  label: "磨损工作台场景",
  description:
    "产品 resting on worn wooden or metal workbench，有 scratches, oil stains, scattered tools。warm tungsten light from upper-left。",
  visualDirection:
    "Product resting on a worn wooden or metal workbench with visible scratches, oil stains, and scattered tools (wrenches, calipers, rulers). Warm tungsten light from upper-left. Background: heavily blurred workshop wall with pegboard. Product in tack-sharp focus, catching the key light.",
  colorDirection:
    "Workshop brown #8B6914, warm amber #D4A574, steel gray #708090, dark wood #3D2B1F, white text with soft shadow.",
  suitableIntents: ["usage_scene", "brand_mood"],
  suitableFreedomLevels: ["expressive", "balanced"],
  typicalBackgrounds: ["material_surface", "industrial_environment"],
  typicalLighting: ["warm_ambient", "editorial_natural"],
};

export const swAssemblyStation: StyleWorld = {
  id: "assembly_station",
  label: "装配站场景",
  description:
    "Industrial assembly station。partially assembled components, torque tools, fixturing visible。warm overhead LED mixed with tungsten。",
  visualDirection:
    "Product at an industrial assembly station with partially assembled components, torque tools, and fixturing visible. Warm overhead LED light mixed with tungsten. Background: blurred conveyor or parts bin. Product is the hero, with crisp detail and subtle warm rim light separating it from background.",
  colorDirection:
    "Warm amber #D4A574, steel gray #708090, oxidized metal #B87333, safety yellow #FACC15 (subtle accent on tools), white text with soft shadow.",
  suitableIntents: ["usage_scene", "brand_mood", "feature_explain"],
  suitableFreedomLevels: ["expressive", "balanced"],
  typicalBackgrounds: ["industrial_environment", "material_surface"],
  typicalLighting: ["warm_ambient", "even_technical"],
};

// ── 新增视觉世界（v2.1 扩展方向） ──

export const swEditorialProductAd: StyleWorld = {
  id: "editorial_product_ad",
  label: "杂志广告风",
  description:
    "杂志封面级商业摄影。大留白、高级排版、产品像被精心摆放的艺术品。字体对比强烈，画面有呼吸感。适合表达设计感、品牌调性。",
  visualDirection:
    "Editorial magazine-style commercial photography. Generous negative space, the product is placed like a curated art object. Bold typography with extreme size contrast between massive headlines and minimal supporting text. The overall mood is Apple-product-page level restraint, authority, and editorial confidence.",
  colorDirection:
    "Background: very light warm gray #FAFAFA to #F0F0F0, or muted sage #E8E8E0, or dusty rose #F5E6E0 depending on product tone. Product: natural material colors only. Text: deep charcoal #1A1A1A for headlines, medium gray #6B7280 for subtext. Accent: single technical blue #0066FF or terracotta #C67B5C used sparingly for one highlight element only.",
  suitableIntents: ["hero_main", "brand_mood", "feature_explain"],
  suitableFreedomLevels: ["balanced", "expressive"],
  typicalBackgrounds: ["light_neutral", "editorial_negative_space", "soft_gradient"],
  typicalLighting: ["editorial_natural", "soft_diffused"],
};

export const swGradientModernShowcase: StyleWorld = {
  id: "gradient_modern_showcase",
  label: "现代渐变展示",
  description:
    "现代感渐变背景产品展示。柔和流动的色彩过渡，产品清晰锐利，整体感觉年轻、科技、有活力。",
  visualDirection:
    "Modern gradient showcase photography. Soft flowing color transitions in the background, crisp and sharp product in the foreground. The mood is young, tech-forward, and energetic without being aggressive. Smooth gradients create depth without clutter.",
  colorDirection:
    "Background: soft gradient from muted blue-gray #E8EDF3 to warm blush #F3E8E8, or sage to cream, or lavender to white. Avoid neon or high-saturation gradients. Product: natural colors. Text: deep charcoal #1F2937. Accent: single restrained accent matching the cooler end of the gradient.",
  suitableIntents: ["hero_main", "feature_explain", "promo_campaign", "bundle_showcase"],
  suitableFreedomLevels: ["balanced", "expressive"],
  typicalBackgrounds: ["soft_gradient", "light_neutral"],
  typicalLighting: ["soft_diffused", "editorial_natural"],
};

export const swMaterialStage: StyleWorld = {
  id: "material_stage",
  label: "材质台面",
  description:
    "产品置于真实的材质台面上——石材、金属拉丝、亚克力、磨砂玻璃、混凝土。背景与台面一体化，营造真实空间感。",
  visualDirection:
    "Product resting on an authentic material surface — brushed aluminum, raw concrete, frosted acrylic, stone slab, or oiled wood. The background merges with the surface, creating a believable spatial context. The product feels grounded and real, not floating in void.",
  colorDirection:
    "Surface-driven palette: concrete gray #B0B0B0, brushed aluminum #D4D4D4, warm oak #C4A77D, black granite #2A2A2A, frosted glass white #F5F5F5. Text: charcoal or white depending on surface darkness. Accent: metallic copper #B87333 or muted gold #C5A059.",
  suitableIntents: ["hero_main", "brand_mood", "feature_explain", "detail_focus"],
  suitableFreedomLevels: ["balanced", "expressive"],
  typicalBackgrounds: ["material_surface", "warm_studio", "cool_studio"],
  typicalLighting: ["soft_diffused", "editorial_natural", "dramatic_key_rim"],
};

export const swSoftPremium: StyleWorld = {
  id: "soft_premium",
  label: "柔和高级感",
  description:
    "不是纯黑 luxury，而是柔和的高级感。暖灰、雾蓝、奶白、浅驼色背景，产品像被柔光包裹。温润、克制、有温度。",
  visualDirection:
    "Soft premium product photography with warm gray, mist blue, cream, or camel backgrounds. The product is wrapped in gentle, even light with subtle warm fill. The mood is warm, restrained, and human — premium without coldness. Like a luxury skincare or audio product page.",
  colorDirection:
    "Background: warm gray #E5E5E0, mist blue #E8ECF0, cream #F5F0E8, or camel #D4C4A8. Text: deep espresso #2D2420 or charcoal #333333. Accent: antique gold #C5A059 or rose gold #B76E79 used as subtle highlight only.",
  suitableIntents: ["hero_main", "brand_mood", "bundle_showcase"],
  suitableFreedomLevels: ["balanced", "expressive"],
  typicalBackgrounds: ["light_neutral", "soft_gradient", "warm_studio"],
  typicalLighting: ["soft_diffused", "editorial_natural"],
};

export const swColorfulMarketplace: StyleWorld = {
  id: "colorful_marketplace",
  label: "彩色电商",
  description:
    "明快、饱和但协调的彩色电商风格。不是黑底neon，而是彩色背景+白色/深色产品，或浅色背景+彩色几何块。适合年轻消费品牌。",
  visualDirection:
    "Bright, saturated yet harmonious colorful e-commerce style. Not black-base neon, but solid color backgrounds with white/dark products, or light backgrounds with bold geometric color blocks. The mood is cheerful, approachable, and thumb-stopping for younger consumer brands.",
  colorDirection:
    "Background: bold flat colors — coral #FF6B6B, mint #4ECDC4, lavender #A78BFA, sunshine #FBBF24, or teal #14B8A6. Use one dominant background color per plan. Product: natural or white. Text: white on dark backgrounds, dark charcoal on light backgrounds. Accent: complement the background with a secondary bright tone.",
  suitableIntents: ["promo_campaign", "bundle_showcase", "hero_main"],
  suitableFreedomLevels: ["balanced", "expressive"],
  typicalBackgrounds: ["colorful_flat", "geometric_blocks"],
  typicalLighting: ["promo_spotlight", "soft_diffused"],
};

export const swMinimalNoText: StyleWorld = {
  id: "minimal_no_text",
  label: "无文字极简",
  description:
    "没有任何文字，纯产品视觉。通过光影、角度、材质、负空间来传递信息。像品牌画册中的产品页。",
  visualDirection:
    "Absolutely no text. Pure product visual communication through light, shadow, angle, material, and negative space. Like a brand lookbook product page or gallery print. The product must speak entirely through its form, surface, and placement.",
  colorDirection:
    "Background: pure white #FFFFFF, warm gray #F5F5F0, or deep matte #121212 depending on product. No text colors needed. Accent: none — let product material be the only color story.",
  suitableIntents: ["hero_main", "brand_mood", "detail_focus"],
  suitableFreedomLevels: ["expressive", "balanced"],
  typicalBackgrounds: ["pure_white", "deep_void", "light_neutral"],
  typicalLighting: ["dramatic_key_rim", "soft_diffused", "hard_chiaroscuro"],
};

export const swDiagramLight: StyleWorld = {
  id: "diagram_light",
  label: "轻量图解",
  description:
    "不是硬核 CAD 蓝图，而是轻量、干净、现代的产品图解。细线、圆角卡片、柔和标注，适合电商详情页的'轻技术感'。",
  visualDirection:
    "Lightweight, clean, modern product diagram — not hardcore CAD. Thin lines, rounded cards, soft annotations, subtle icons. Suitable for e-commerce detail pages that need a 'light technical feel' without engineering intimidation.",
  colorDirection:
    "Background: white #FFFFFF or very light warm gray #F8F8F6. Lines: medium gray #9CA3AF or soft blue #60A5FA. Cards: white with subtle shadow #F3F4F6 border. Accent: single friendly blue #3B82F6 or teal #14B8A6. Avoid dark slate or grid-heavy aesthetics.",
  suitableIntents: ["feature_explain", "spec_dimension", "story_sequence"],
  suitableFreedomLevels: ["strict", "balanced"],
  typicalBackgrounds: ["pure_white", "light_neutral"],
  typicalLighting: ["even_technical", "soft_diffused"],
};

export const swSceneStory: StyleWorld = {
  id: "scene_story",
  label: "场景故事",
  description:
    "用一张图讲一个小故事。产品处于使用前后的情境中，有人的痕迹、时间感、叙事性。不是单纯摆拍，而是'发生了什么'。",
  visualDirection:
    "A single image that tells a small story. The product sits in a before/after or in-use context with human traces, sense of time, and narrative quality. Not a sterile product shot, but a 'something happened here' feeling. Like a well-composed documentary photograph.",
  colorDirection:
    "Warm documentary palette: amber #D4A574, worn brown #8B6914, steel #708090, dusty green #6B8E6B. Natural daylight or warm tungsten mixed with window light. Text: white with soft shadow, or deep charcoal if on light background.",
  suitableIntents: ["usage_scene", "brand_mood", "promo_campaign"],
  suitableFreedomLevels: ["expressive", "balanced"],
  typicalBackgrounds: ["industrial_environment", "bokeh_scene", "material_surface"],
  typicalLighting: ["warm_ambient", "cinematic_mixed", "editorial_natural"],
};

export const swCinematicWorkshop: StyleWorld = {
  id: "cinematic_workshop",
  label: "电影感车间",
  description:
    "电影级别的工业场景。戏剧性光源、烟雾/粉尘粒子、金属反光、纵深构图。产品像电影主角一样被照亮。",
  visualDirection:
    "Cinematic-grade industrial scene. Dramatic light beams, subtle dust/particle atmosphere, metal reflections, deep depth composition. The product is lit like a movie protagonist. Anamorphic lens feel optional. Raw, powerful, and visually arresting.",
  colorDirection:
    "Deep charcoal #1A1A1A to warm black #0F0F0F base. Warm key light #FFD700 to #FFA500. Cool fill from opposite side #4A5568. Steel and oxidized metal tones. Accent: molten orange #FF6B00 or welding blue #00BFFF for sparks/light effects.",
  suitableIntents: ["usage_scene", "brand_mood", "detail_focus"],
  suitableFreedomLevels: ["expressive"],
  typicalBackgrounds: ["cinematic_dark", "industrial_environment"],
  typicalLighting: ["cinematic_mixed", "dramatic_key_rim"],
};

// ── 全集 ──

export const STYLE_WORLD_PRESETS: Record<string, StyleWorld> = {
  // 基础方向
  clean_catalog: swCleanCatalog,
  light_technical: swLightTechnical,
  dark_technical: swDarkTechnical,
  high_contrast_promo: swHighContrastPromo,
  macro_chiaroscuro: swMacroChiaroscuro,
  premium_black: swPremiumBlack,
  comparison_drama: swComparisonDrama,
  bundle_pop: swBundlePop,
  workshop_lifestyle: swWorkshopLifestyle,
  cnc_machine_bed: swCncMachineBed,
  worn_workbench: swWornWorkbench,
  assembly_station: swAssemblyStation,
  // 新增方向
  editorial_product_ad: swEditorialProductAd,
  gradient_modern_showcase: swGradientModernShowcase,
  material_stage: swMaterialStage,
  soft_premium: swSoftPremium,
  colorful_marketplace: swColorfulMarketplace,
  minimal_no_text: swMinimalNoText,
  diagram_light: swDiagramLight,
  scene_story: swSceneStory,
  cinematic_workshop: swCinematicWorkshop,
};

export function getStyleWorldById(id: string): StyleWorld | undefined {
  return STYLE_WORLD_PRESETS[id];
}

export function getStyleWorldsForIntent(intentId: string): StyleWorld[] {
  return Object.values(STYLE_WORLD_PRESETS).filter((sw) =>
    sw.suitableIntents.includes(intentId as StyleWorld["suitableIntents"][number])
  );
}

export function getStyleWorldsForFreedom(
  level: StyleWorld["suitableFreedomLevels"][number]
): StyleWorld[] {
  return Object.values(STYLE_WORLD_PRESETS).filter((sw) =>
    sw.suitableFreedomLevels.includes(level)
  );
}
