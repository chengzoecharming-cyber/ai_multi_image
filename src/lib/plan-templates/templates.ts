import type { PlanTemplate } from "./types";

const COMMON_RISK_RULES: string[] = [
  "Do not generate fake logos, fake prices, fake parameters, fake sizes, fake certifications",
  "Do not generate specific technical data not provided by the user",
  "All on-image text must follow the copy rules below",
  "Product reference image is the sole basis for product structure",
  "Do not alter product outline, proportions, holes, teeth, cutting edges, threads, slots, edges, or irregular contours",
  "Do not add or remove product parts",
];

const COMMON_COPY_RULES = `
## Copy Rules

The image may contain English text. Determine copySource based on user input:

A. user_exact — User provided exact English text for the image
Rules:
- Use the user's exact English text
- Do NOT translate, rewrite, expand, or add extra text

B. ai_rewritten — User provided Chinese requirements or natural-language selling points
Rules:
- Rewrite user intent into short English e-commerce copy
- headline and sellingPoints must be in English
- Copy must be short and suitable for image display
- Only express general selling points already mentioned by the user
- Do NOT generate specific technical data not provided

Example:
User input: 经典钥匙，更坚固、更牢靠、更精准
→ headline: CLASSIC KEY
→ sellingPoints: ["STRONGER", "MORE SECURE", "MORE PRECISE"]

C. ai_suggested — User did NOT provide specific selling points
Rules:
- AI may generate 2–4 safe generic selling-point suggestions
- Examples: DURABLE DESIGN / CLEAN FINISH / EASY TO USE / RELIABLE QUALITY
- Mark these clearly as "AI suggested copy" in the plan
- User can edit and confirm before generation

PROHIBITED in ALL modes:
- Unprovided sizes, models, material grades, hardness, load capacity, lifespan
- Unprovided prices, certifications, brand names, technical parameters
- Platform logos, fake numbers, fake labels, garbled text
`;

const COMMON_QUALITY_CHECKS = `
## Quality Check

Before finalizing, ensure:
- Product geometry remains accurate to the reference image
- No product parts are added or removed
- No holes, grooves, threads, teeth, cutting edges, or irregular contours are changed
- No fake text, numbers, labels, prices, certifications, or claims are generated
- No platform logo, fake logo, or watermark appears
`;

export const SYSTEM_TEMPLATES: PlanTemplate[] = [
  {
    id: "tpl-white-bg-hero",
    name: "白底主图",
    description:
      "Amazon / Temu 平台主图。整体白色/浅灰背景，产品占画面主体，文案精简干净，不花哨。",
    scope: "system",
    category: "single_image",
    tags: ["主图", "白底", "Amazon", "干净"],
    applicablePlatforms: ["Amazon", "Temu", "Ozon", "通用"],
    applicableProducts: ["工业品", "五金", "工具", "紧固件", "切削工具"],
    variables: [
      { key: "product_name", label: "产品名称", type: "text", required: true },
    ],
    templatePrompt: `
## Template Style: White Background Hero (Amazon/Temu Main Image) — MANDATORY

This is NOT a generic product showcase. This is a PLATFORM MAIN IMAGE designed for Amazon/Temu thumbnail visibility and trust.

MANDATORY visual identity (all 3 plans must share this):
- Background: PURE WHITE (#FFFFFF) or very light neutral gray (#F5F5F5 to #F8F8F8). NO gradients. NO textures. NO environment hints. NO colored cast. The background must read as "nothing there" — clean, clinical, empty space.
- Product treatment: product MUST be shown in FULL — no cropping of edges, tips, or handles. Product occupies 70-85% of frame, centered or slightly offset. The product is the ONLY visual element besides text.
- Lighting: soft diffused overhead studio light at approximately 60° elevation. FILL light from the front-right at low intensity to eliminate harsh shadows. NO dramatic side light. NO rim light. NO colored gels. Shadows must be soft, natural, and fall directly beneath or slightly behind the product.
- Depth of field: DEEP. The entire product must be tack-sharp from front to back. NO shallow DOF, NO selective focus, NO bokeh.
- Reflection: subtle ground reflection directly beneath the product at 15-25% opacity. NO mirror reflection. NO floating shadow.
- Color palette: product's natural metal/material colors only. NO accent colors. NO color blocks. NO gradient overlays.
- Text: MINIMAL but clear. Exactly 1 headline (2-5 words, ALL CAPS, bold sans-serif, placed in upper or lower third). PLUS 2-3 very short feature labels (single words or 2-word phrases, small font, arranged in a clean horizontal row or vertical stack beside the product). NO subheadline. NO body paragraphs. NO bullet points with long text.
- Layout: single-product centered composition. NO side panels. NO bottom bars. NO multi-column grids. NO decorative frames.

Copy strategy for this template: MINIMAL. Headline + 2-3 short labels ONLY. Do NOT generate subheadline, core_claim, feature_points with body text, or comparison_labels.

AVOID:
- Any background that is not pure white or very light gray
- Colored rim lights, particles, lens flares, or dramatic effects
- Cropping the product edges
- Dark panels, colored blocks, or gradient backgrounds
- Text that crowds or overlaps the product
- Multiple products or product variations in one frame
- Shadows that are too dark or cast in unnatural directions

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: COMMON_RISK_RULES,
    enabled: true,
  },

  {
    id: "tpl-temu-promo",
    name: "Temu 高对比促销图",
    description:
      "高能量促销风格。深色背景 + 亮色块/渐变，大标题，强视觉冲击力。",
    scope: "system",
    category: "single_image",
    tags: ["Temu", "促销", "高对比"],
    applicablePlatforms: ["Temu", "拼多多跨境", "速卖通"],
    applicableProducts: ["工业品", "五金", "工具", "紧固件", "切削工具"],
    variables: [
      { key: "headline", label: "主标题 Headline", type: "text", required: true },
      { key: "selling_points", label: "卖点 Selling Points", type: "string_list", required: true },
    ],
    templatePrompt: `
## Template Style: Temu High-Contrast Promo — MANDATORY

This is NOT a general product photo. This is a HIGH-ENERGY SALES PROMO image designed to grab attention in a crowded feed.

MANDATORY visual identity (all 3 plans must share this):
- Background: deep matte black (#0A0A0A to #1A1A1A) with BOLD geometric color blocks. Accent colors MUST be high-saturation: electric blue (#007BFF), vivid orange (#FF6B00), hot red (#FF2D55), or acid green (#39FF14). Color blocks must be hard-edged rectangles, diagonal slices, or angular shapes — NO soft gradients, NO rounded blobs.
- Product treatment: product shown in FULL, floating or grounded with a crisp shadow. Product occupies 55-65% of frame. Product must be brightly lit and sharply focused, standing out against the dark background.
- Lighting: dramatic key light from upper-left at 45° with strong specular highlights. Hard shadows on the right side. A subtle colored rim light (matching the accent block color) tracing the product's right edge at 20-30% intensity.
- Depth of field: MODERATE. Product fully sharp. Background color blocks may have slight softness but must remain readable shapes.
- Text: BOLD and AGGRESSIVE. Headline must be OVERSIZED (6-12 words, ALL CAPS, heavy weight, occupying top 20-25% of frame). Subheadline in smaller weight below headline. 3-4 feature badges or blocks with short punchy text. Bottom info bar with 2-3 icons/labels. This is HIGH text density.
- Layout: asymmetric. Large headline top-left or top-center. Product center-right or center. Color blocks behind or beside product. Feature badges arranged in a dynamic staggered grid.

Copy strategy for this template: RICH and BOLD. Headline + subheadline + core_claim + 3-4 feature_points + 3 bottom_info items. Text must feel urgent and sales-driven.

AVOID:
- Soft gradients or pastel colors (kills the promo energy)
- Minimal text or generous negative space (this is not premium, this is promo)
- Fake prices, fake discounts, fake countdown timers, platform logos
- Even studio lighting or flat lighting
- Symmetrical, centered, balanced layouts (promo needs asymmetry and tension)
- Product cropping or extreme close-ups

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: [
      ...COMMON_RISK_RULES,
      "Do NOT generate fake prices, fake discounts, fake countdown timers",
    ],
    enabled: true,
  },

  {
    id: "tpl-feature-explanation",
    name: "功能卖点说明图",
    description:
      "详情页卖点说明。产品+卖点信息，背景偏浅冷色调，排版干净可读。",
    scope: "system",
    category: "single_image",
    tags: ["详情页", "功能卖点", "说明图"],
    applicablePlatforms: ["Amazon", "Temu", "Ozon", "独立站", "通用"],
    applicableProducts: ["工业品", "五金", "工具", "紧固件", "切削工具"],
    variables: [
      { key: "headline", label: "主标题 Headline", type: "text", required: true },
      { key: "selling_points", label: "卖点 Selling Points", type: "string_list", required: true },
    ],
    templatePrompt: `
## Template Style: Feature Explanation (Info Panel Layout) — MANDATORY

This is NOT a general product showcase. This is a FEATURE EXPLANATION image where the primary job is to communicate product benefits through structured information panels.

MANDATORY visual identity (all 3 plans must share this):
- Background: cool light gray (#E8ECF0 to #F0F2F5) with subtle blue undertone. NO gradients. NO textures. The background must feel like a clean whiteboard or tech document.
- Product treatment: product shown at a 3/4 angle or profile view, occupying 40-50% of frame, positioned LEFT or CENTER. Product must be fully visible with crisp edges. NO cropping.
- Lighting: professional even studio light from upper-front at 50°. Soft fill from below to reduce under-shadow. Slight ground reflection. NO dramatic shadows. NO rim light.
- Depth of field: DEEP. Entire product sharp.
- Information panels: RIGHT side or BOTTOM must contain 3-4 structured feature blocks. Each block has a small icon hint + bold title (2-4 words, ALL CAPS) + short body text (8-15 words). Blocks separated by thin hairline dividers or subtle background tints (#FFFFFF panels on #E8ECF0 background).
- Color palette: cool neutrals + ONE accent color (tech blue #0066CC, teal #008080, or steel blue #4682B4) used sparingly for icon hints and headline only. NO warm colors. NO high-saturation accents.
- Text: MEDIUM density. Headline + subheadline + 3-4 feature_points (with body text) + 3 bottom_info items. Text arranged in clean vertical stacks or grids. NO comparison_labels. NO application_labels.
- Layout: product on left/center, info panels on right/bottom. Clean vertical alignment. No overlapping text on product.

Copy strategy for this template: MEDIUM-RICH. Headline + subheadline + 3-4 feature_points (each with title AND body explaining the benefit) + 3 bottom_info items. Feature body text must explain WHY the feature matters, not just restate the title.

AVOID:
- Dark backgrounds or heavy panels
- Fake data tables, specification boxes, or measurement annotations
- Warm colors, orange, red, or yellow accents
- Asymmetrical or diagonal layouts
- Product cropped or shown in extreme close-up
- Cluttered text that overlaps the product

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: COMMON_RISK_RULES,
    enabled: true,
  },

  {
    id: "tpl-macro-detail",
    name: "局部放大细节图",
    description:
      "微距特写风格，突出刀刃、螺纹、表面质感。深背景，戏剧性侧光，质感强烈。",
    scope: "system",
    category: "single_image",
    tags: ["局部放大", "微距", "细节图", "质感"],
    applicablePlatforms: ["Amazon", "Temu", "Ozon", "独立站", "通用"],
    applicableProducts: ["切削工具", "紧固件", "精密零件", "五金件"],
    variables: [
      { key: "headline", label: "主标题 Headline", type: "text", required: true },
      { key: "detail_focus", label: "细节聚焦", type: "textarea", required: true },
    ],
    templatePrompt: `
## Template Style: Macro Detail / Texture Close-Up — MANDATORY

This is NOT a general product showcase. This is a MACRO DETAIL image where the primary subject is SURFACE TEXTURE, MATERIAL FINISH, and PRECISION GEOMETRY.

MANDATORY visual identity (all 3 plans must share this):
- Background: pure black or extremely dark matte (RGB 5-15, no gradients, no textures, no environment hints).
- Lighting: single hard light source from camera-left at approximately 45° elevation. Warm white (3200K-4000K) key light. NO fill light — let shadows fall to pure black. Strong specular highlights on metal edges. This is chiaroscuro lighting, not studio even lighting.
- Depth of field: SHALLOW. The focal plane is razor-thin. Background and non-focal areas must fall into soft blur (bokeh).
- Product treatment: The main product body should be partially cropped by the frame edges — do NOT show the full product. Show 40-60% of the product, cropped dramatically. This is a DETAIL shot, not a product shot.
- Detail insets: 1-2 circular or rectangular magnified callouts (15-20% each) showing actual surface texture: tool marks, grain structure, cutting edge geometry, thread profile, or surface finish. These must look like optical micro-photography, not digital illustrations.
- Color palette: monochromatic metal tones only — silver, steel gray, gunmetal, brass. ONE single warm accent allowed (copper or amber) for the highlight edge only. NO blue, NO green, NO red.
- Text: ABSOLUTELY MINIMAL. Exactly 1 headline (2-4 words, ALL CAPS, thin weight, placed in negative space). NO subheadline. NO body text. NO bullet points. NO feature labels. The image must communicate through texture and light, not words.
- Layout: product dominates 70-80% of frame, cropped. Inset(s) float in the remaining space with thin hairline borders. No decorative frames, no shadow boxes, no gradients behind insets.

Copy strategy for this template: MINIMAL — headline only. Do NOT generate feature_points, technical_points, or comparison_labels. The headline is the ONLY text element.

AVOID:
- Showing the complete product (this kills the macro feel)
- Even studio lighting (this kills the dramatic mood)
- Multiple colors or color blocks
- Text-heavy layouts
- Fake measurement callouts or dimension lines
- Decorative elements, particles, or lens flares

{{detail_focus}}

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: [
      ...COMMON_RISK_RULES,
      "Magnified detail areas must correspond to real visible structures; do not invent details",
    ],
    enabled: true,
  },

  {
    id: "tpl-advantage-comparison",
    name: "优势对比图",
    description:
      "展示产品优势。左侧产品主体，右侧抽象化的普通版本对比物，不引用真实竞品。",
    scope: "system",
    category: "single_image",
    tags: ["优势对比", "对比图", "产品优势"],
    applicablePlatforms: ["Amazon", "Temu", "Ozon", "独立站", "通用"],
    applicableProducts: ["工业品", "五金", "工具", "紧固件", "切削工具"],
    variables: [
      { key: "headline", label: "主标题 Headline", type: "text", required: true },
      { key: "selling_points", label: "卖点 Selling Points", type: "string_list", required: true },
    ],
    templatePrompt: `
## Template Style: Advantage Comparison (Split-Screen Before vs After / Ordinary vs Premium) — MANDATORY

This is NOT a general product showcase. This is a SPLIT-SCREEN COMPARISON image that visually proves product superiority through dramatic side-by-side contrast. The image must instantly read as "THIS vs THAT" even at thumbnail size.

CRITICAL: BOTH SIDES MUST SHOW THE SAME PRODUCT TYPE. The left side is the SAME product but rendered to look inferior through visual treatment only (desaturation, dimmer light, cooler color). The right side is the SAME product in its best form (full color, bright light, warm tones). They must NOT be two different products.

MANDATORY visual identity (all 3 plans must share this):
- Layout: STRICT 50/50 vertical split-screen. Left half and right half must be visually equal in width. A bold vertical dividing line or VS element runs down the exact center.
- Background: unified deep dark background (#151515 to #1E1E1E) across the entire image. NO separate backgrounds for each side. The darkness unifies the two halves into one cohesive image.

LEFT SIDE ("ORDINARY" / "STANDARD" / "BEFORE") — must feel inferior:
- The SAME product as the right side, shown as a GENERIC, LOWER-QUALITY version. NOT a real competitor brand. NOT a different product type.
- Must have the SAME overall shape, structure, proportions, and visible features as the right side product.
- Visual treatment: DESATURATED to 20-30% saturation. Dimmer lighting. Cool blue-gray color cast (#5A6A7A). Slightly softer focus.
- Product scale: 30-40% of the left half.
- Large RED "X" mark or red cross indicator placed prominently beside or over the product (NOT covering the product itself). The red X signals "problem / inferior".
- Label above the product: "ORDINARY" or "STANDARD" in ALL CAPS, cool gray color (#8A9AAF), medium weight.
- Short negative descriptor text beneath the product label (e.g., "Chip Welding / Poor Finish") in smaller muted red-gray text.

CENTER DIVIDER ("VS") — must be immediately visible:
- Large bold "VS" text centered vertically on the dividing line. White (#FFFFFF) or bright silver (#E0E0E0), heavy weight, substantial size (must be readable at thumbnail scale).
- The VS can sit inside a subtle circular badge or diamond shape with dark translucent background, or directly on a thin vertical divider line.
- The VS must be the visual anchor that makes the comparison unmistakable.

RIGHT SIDE ("OUR" / "UPGRADED" / "PREMIUM") — must feel superior:
- The EXACT SAME featured product from the user's reference image, in FULL COLOR, tack-sharp focus, bright warm key light (3200K-4000K) from upper-left.
- Must preserve ALL visible features from the reference image: every hole, groove, thread, edge, tooth, and contour must match exactly.
- Visual treatment: FULL saturation. Bright, vivid, premium. Warm white or amber highlights on edges. A subtle warm glow or soft halo around the product.
- Product scale: 35-45% of the right half — slightly larger than the left side to subconsciously signal superiority.
- Large GREEN CHECKMARK or green tick indicator placed prominently beside the product. The green check signals "solution / superior".
- Label above the product: "OUR END MILL" or "UPGRADED" in ALL CAPS, warm accent color (#FFB347 or #4ADE80), bold weight.
- Short positive descriptor text beneath the product label (e.g., "Smooth Finish / No Chip Welding") in smaller warm white text.

BOTTOM FEATURE BAR (mandatory — spans full width below both panels):
- A horizontal dark panel or bar at the bottom 15-20% of the image.
- 3 feature advantage cards evenly spaced across the bar.
- Each card: small icon + bold title (2-4 words, ALL CAPS) + optional 1-line description.
- Card style: dark translucent background with colored left-border accent (green #22C55E for positive features).
- Example features: "ANTI-STICK COATING", "STABLE CUTTING", "LONGER TOOL LIFE".

Color palette:
- Left side: desaturated blue-gray (#5A6A7A), muted, dim.
- Right side: full product colors + warm amber highlights (#FFB347) + bright green accents (#22C55E).
- Center: white/silver VS divider.
- Bottom bar: dark charcoal (#1A1A1A) with green left-border accents.
- Overall: unified dark background makes both sides feel like one image, not two separate images pasted together.

Text density: MEDIUM-HIGH.
- Headline (top center or top-left, spanning both halves): bold ALL CAPS, 4-8 words.
- Subheadline (beneath headline): 6-12 words.
- Left label + descriptor + red X.
- Right label + descriptor + green check.
- VS center divider.
- Bottom bar with 3 feature cards.

Copy strategy for this template: MEDIUM. Headline + subheadline + 2 comparison_labels ("ORDINARY" / "OUR PRODUCT") + 3-4 feature_points + 3 bottom_info items. Comparison labels must NOT reference real brands.

AVOID:
- Real competitor brand names, logos, or identifiable products
- Fake performance data, test scores, statistics, or numbers
- Equal lighting, equal saturation, or equal size on both sides (the right side MUST be visually dominant)
- Separate backgrounds for left and right (must be unified dark background)
- Missing VS divider (without it, the image is not a comparison)
- Missing red X / green check visual indicators
- Missing bottom feature bar
- Overlapping or crowded layouts where text covers the product
- Two completely different products (both sides must be the same product category)

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: [
      ...COMMON_RISK_RULES,
      "Do NOT reference specific competitor brands or products",
      "Do NOT generate fake performance data, test scores, comparison numbers, or statistics",
      "The abstract alternative on the right must be generic and unbranded",
    ],
    enabled: true,
  },

  {
    id: "tpl-lifestyle-scene",
    name: "应用场景 Lifestyle 图",
    description:
      "产品置于真实工作环境中。车间、机加工台、装配现场等。暖色调，背景虚化，产品清晰。",
    scope: "system",
    category: "single_image",
    tags: ["应用场景", "lifestyle", "环境氛围", "车间"],
    applicablePlatforms: ["Amazon", "Temu", "Ozon", "独立站", "通用"],
    applicableProducts: ["切削工具", "紧固件", "工具", "五金件"],
    variables: [
      { key: "headline", label: "主标题 Headline", type: "text", required: true },
      { key: "scene_direction", label: "场景方向", type: "textarea", required: true },
    ],
    templatePrompt: `
## Template Style: Lifestyle / Usage Scene — MANDATORY

This is NOT a studio product shot. This is a LIFESTYLE image where the product lives in a believable industrial environment.

MANDATORY visual identity (all 3 plans must share this):
- Background: authentic industrial environment — CNC machine bed, workshop bench with scattered tools, metal shavings, vise, or assembly station. The environment must look REAL, not staged. Visible workshop details: worn surfaces, oil stains, tool marks, clamps, rulers.
- Background treatment: SHALLOW DEPTH OF FIELD. Background must be heavily blurred (bokeh at f/1.8-f/2.8 level). Product in tack-sharp focus. The blur transition must be natural — closer elements slightly sharper, distant elements fully soft.
- Color palette: warm amber (#D4A574), workshop brown (#8B6914), steel gray (#708090), oxidized metal (#B87333). NO cool blue tones. NO neon accents. NO pure black backgrounds.
- Product treatment: product shown in FULL, 35-45% of frame, positioned slightly off-center (rule of thirds). Product must be the brightest and sharpest element in the frame. A subtle warm rim light on the product's top edge to separate it from the background.
- Lighting: warm ambient workshop light (tungsten/LED mix, ~3000K-3500K) from the environment + a dedicated crisp key light on the product from upper-left. The product must catch more light than the surroundings. NO flat even lighting.
- Depth of field: SHALLOW. Product sharp. Background heavily blurred. Foreground may have slight blur if something is very close to camera.
- Atmosphere: slight dust particles or metal shavings visible in the light beam (subtle, not overwhelming). The scene must feel like someone just paused work.
- Text: MINIMAL. Headline + 2-3 short application_labels (describing the scenario) + 3 bottom_info items. NO dense feature panels. NO comparison_labels.
- Layout: product is the hero. Environment frames it. Text elements placed in negative space (upper corners or bottom edge), never over the busy background.

Copy strategy for this template: MINIMAL-MEDIUM. Headline + 2-3 application_labels (title + short body describing the use scenario) + 3 bottom_info items. Application labels must describe WHERE and HOW the product is used, not just what it is.

AVOID:
- Clean studio backgrounds or pure colors
- Even lighting across the entire frame
- Product cropped or shown in extreme close-up
- Exaggerated scenarios (product doing impossible things)
- Environment that is brighter or sharper than the product
- Text-heavy layouts or dense info panels
- Cool blue/gray color cast on the product

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: [
      ...COMMON_RISK_RULES,
      "Environment must NOT distract from product; product must be brightest and sharpest element",
    ],
    enabled: true,
  },

  {
    id: "tpl-bundle-showcase",
    name: "促销套装组合图",
    description:
      "展示产品组合/套装。多个产品或不同角度排列，鲜艳背景，大标题。",
    scope: "system",
    category: "single_image",
    tags: ["套装", "组合", "促销", "多产品"],
    applicablePlatforms: ["Temu", "拼多多跨境", "速卖通"],
    applicableProducts: ["工业品", "五金", "工具", "紧固件"],
    variables: [
      { key: "headline", label: "主标题 Headline", type: "text", required: true },
      { key: "selling_points", label: "卖点 Selling Points", type: "string_list", required: true },
    ],
    templatePrompt: `
## Template Style: Product Bundle / Multi-Item Showcase — MANDATORY

This is NOT a single-product image. This is a BUNDLE SHOWCASE showing multiple related items or variants in one compelling composition.

MANDATORY visual identity (all 3 plans must share this):
- Background: bold flat color blocks or a clean subtle gradient. Primary background color: deep navy (#1A2744) or charcoal (#2D2D2D). Accent block colors: bright complementary tones (electric blue #007BFF, vivid orange #FF6B00, or magenta #FF2D55) used as geometric shapes behind or between products.
- Product treatment: 3-5 related items arranged in a deliberate composition. Options:
  A) One hero product (45-50%) center + 2-3 smaller variants (12-18%) arranged around it in a triangular or arc formation.
  B) All items equal size (20-25% each) in a clean horizontal row or staggered grid.
  All products must be fully visible, sharp, and evenly lit. NO cropping of smaller items.
- Lighting: clean commercial studio light from upper-front at 45°. Even illumination across ALL products — no product should be in shadow while another is brightly lit. Soft fill from below. Subtle individual shadows beneath each product.
- Depth of field: DEEP. All products tack-sharp from front to back.
- Color palette: product natural colors + background block colors + ONE accent for headline. NO clashing colors between products and background.
- Text: MEDIUM density. Headline + subheadline + 3-4 feature_points (title only, no body text for bundles) + 3 bottom_info items. Feature text should emphasize VALUE and COMPLETENESS ("COMPLETE SET", "FULL RANGE", "ALL SIZES").
- Layout: products arranged in a dynamic but orderly composition. Color blocks behind products create visual separation. Headline top-center or top-left. Feature badges or labels beneath the product arrangement.

Copy strategy for this template: MEDIUM. Headline + subheadline + 3-4 feature_points (title + 1-line body) + 3 bottom_info items. Copy must emphasize abundance, variety, and value.

AVOID:
- Single product only (defeats the purpose of a bundle image)
- Products of wildly different sizes without scale indication
- Fake prices, fake discounts, fake bundle values
- Uneven lighting where some products are dark
- Overlapping products that hide each other
- Cluttered data tables or specification boxes
- Soft pastel backgrounds (bundle needs bold presence)

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: [
      ...COMMON_RISK_RULES,
      "Do NOT generate fake prices, fake discounts, or fake bundle values",
    ],
    enabled: true,
  },

  {
    id: "tpl-spec-technical",
    name: "规格参数技术图",
    description:
      "技术文档风格。冷色调背景，网格/坐标感，产品+规格面板。不生成真实数字，但保留规格框架感。",
    scope: "system",
    category: "single_image",
    tags: ["规格参数", "技术图", "冷色调", "文档风"],
    applicablePlatforms: ["Amazon", "Temu", "Ozon", "独立站", "通用"],
    applicableProducts: ["工业品", "五金", "工具", "紧固件", "切削工具"],
    variables: [
      { key: "headline", label: "主标题 Headline", type: "text", required: true },
    ],
    templatePrompt: `
## Template Style: Technical Spec / Documentation Style — MANDATORY

This is NOT a sales promo or lifestyle shot. This is a TECHNICAL DOCUMENTATION image that presents the product with engineering precision and structured information.

MANDATORY visual identity (all 3 plans must share this):
- Background: cool slate blue-gray (#4A5568 to #5A6A7A) with a faint technical grid at 5-8% opacity. Grid lines: white or light gray (#E2E8F0), 0.5px weight, 40-50px spacing. The grid must feel like blueprint paper or CAD background.
- Product treatment: product shown at a TECHNICAL ANGLE — isometric (30°), profile side view, or top-down technical view. Product occupies 40-50% of frame, positioned LEFT or CENTER. Full product visible, NO cropping.
- Lighting: FLAT, EVEN, TECHNICAL. Diffused overhead light at 80° elevation with strong fill from all sides. NO dramatic shadows. NO rim light. NO specular highlights. The lighting must feel like a 3D CAD render or technical illustration — clean, clinical, shadowless.
- Depth of field: INFINITE. Entire product perfectly sharp. NO bokeh. NO selective focus.
- Technical panels: RIGHT side must contain 3-4 structured info blocks with placeholder labels. Format: thin rectangular panels with hairline borders (#FFFFFF at 40% opacity). Each panel has a label ("MATERIAL", "TYPE", "APPLICATION" etc.) and a placeholder value (dashes, blank lines, or "—"). NO real numbers. NO fake data.
- Annotation style: thin dashed or solid lines (#FFFFFF, 1px) pointing from panels to corresponding product features. Arrowheads: simple triangles.
- Color palette: cool slate background + product natural colors + white/light gray for text and lines + ONE subtle accent (tech blue #00BCD4 or electric blue #2196F3) for emphasis lines only.
- Text: MEDIUM density. Headline + subheadline + 3-4 technical_points (title + body describing structure) + 3 bottom_info items. Text must feel technical and precise.
- Layout: product left/center, technical panels right. Clean horizontal alignment. Grid background visible in all empty areas.

Copy strategy for this template: MEDIUM. Headline + subheadline + 3-4 technical_points (each with title AND body explaining the structure/detail) + 3 bottom_info items. Technical body text must describe physical characteristics, not benefits.

AVOID:
- Real measurement numbers, dimensions, or specific technical data
- Fake data tables with invented specifications
- Warm colors, orange, or red accents
- Dramatic lighting, shadows, or rim light
- Lifestyle backgrounds or workshop environments
- Product cropping or artistic angles
- Cluttered or overlapping text panels

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: [
      ...COMMON_RISK_RULES,
      "Do NOT generate real size dimensions, measurement lines, or technical annotations",
      "Specification fields must be placeholder-style labels only",
    ],
    enabled: true,
  },

  {
    id: "tpl-premium-luxury",
    name: "高端质感展示图",
    description:
      "深色背景下的高端质感展示。强调材质、反射、边缘光。适合表达精密、高端、耐用的产品形象。",
    scope: "system",
    category: "single_image",
    tags: ["高端", "奢华", "深色背景", "质感"],
    applicablePlatforms: ["Amazon", "Temu", "Ozon", "独立站", "通用"],
    applicableProducts: ["工业品", "五金", "工具", "紧固件", "切削工具"],
    variables: [
      { key: "headline", label: "主标题 Headline", type: "text", required: true },
    ],
    templatePrompt: `
## Template Style: Premium Luxury Showcase — MANDATORY

This is NOT a general product photo. This is a PREMIUM LUXURY image where the product's material, finish, and weight are the entire story.

MANDATORY visual identity (all 3 plans must share this):
- Background: deep matte black (#0A0A0A to #111111). NO gradients. NO textures. NO environment. The background must feel like infinite void — pure, absolute darkness.
- Product treatment: product shown in FULL, 60-70% of frame, centered or slightly below center. Generous negative space above and around. The product must feel like a sculpture in a gallery — isolated, honored, studied.
- Lighting: DRAMATIC RIM LIGHT is the PRIMARY light source. A single sharp light from behind the product at 10-20° above horizon, tracing every edge with a bright white or warm white highlight (#FFF8E7 or #FFFFFF). Key light from upper-front at low intensity just enough to reveal surface texture. NO fill light. Shadows fall to pure black.
- Reflections: a SATIN-SMOOTH ground reflection directly beneath the product, fading vertically over 15-20% of frame height. Reflection must be softer than the product (gaussian blur ~3-5px). NO mirror reflection. NO double image.
- Depth of field: DEEP. Entire product sharp. Background remains pure black regardless.
- Color palette: product's natural metal tones + champagne gold (#F7E7CE) or silver (#C0C0C0) accent for rim light only. NO other colors. NO blue. NO green. NO red. The palette must feel like a luxury watch ad.
- Text: ABSOLUTELY MINIMAL. Exactly 1 headline (2-4 words, elegant serif or thin sans-serif, all caps or title case, small size, placed in upper third with generous spacing). NO subheadline. NO body text. NO feature labels. NO bottom info bar. The product speaks; words are almost unnecessary.
- Layout: center-product, maximum negative space. The product is the ONLY element. Text, if present, floats in the vast darkness.

Copy strategy for this template: MINIMAL — headline ONLY. Do NOT generate subheadline, feature_points, technical_points, or bottom_info items. The headline is the ONLY text element.

AVOID:
- Any background that is not near-pure black
- Multiple colors, color blocks, or gradients
- Text-heavy layouts, bullet points, or feature panels
- Even studio lighting or flat lighting
- Product cropping or extreme close-ups
- Decorative elements, particles, or lens flares
- Cluttered compositions with multiple products

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: COMMON_RISK_RULES,
    enabled: true,
  },

  {
    id: "tpl-dimension-annotation",
    name: "尺寸标注展示图",
    description:
      "展示产品尺寸和结构标注。带测量示意线和标注框，但不生成真实数字。",
    scope: "system",
    category: "single_image",
    tags: ["尺寸标注", "测量", "结构", "几何"],
    applicablePlatforms: ["Amazon", "Temu", "Ozon", "独立站", "通用"],
    applicableProducts: ["工业品", "五金", "工具", "紧固件", "切削工具"],
    variables: [
      { key: "headline", label: "主标题 Headline", type: "text", required: true },
    ],
    templatePrompt: `
## Template Style: Dimension Annotation / Structural Overview — MANDATORY

This is NOT a general product showcase. This is a DIMENSION ANNOTATION image that reveals the product's geometry and structure through precise visual measurement guides.

MANDATORY visual identity (all 3 plans must share this):
- Background: clean neutral white (#FFFFFF) or very light warm gray (#F5F5F0). NO gradients. NO textures. The background must feel like an engineering drawing sheet.
- Product treatment: product shown at an angle that REVEALS KEY DIMENSIONS — side profile view, top-down view, or isometric (30°) view. Product occupies 50-60% of frame, positioned CENTER or slightly left. FULL product visible, NO cropping.
- Lighting: even diffused studio light at 60° elevation with soft fill. Crisp edges with slight ground shadow. NO dramatic shadows. NO rim light. The lighting must reveal all edges clearly for annotation.
- Depth of field: DEEP. Entire product perfectly sharp. NO selective focus.
- Annotation style: THIN measurement lines (#333333 or #666666, 1px weight) with simple arrowheads pointing to real product features: edges, holes, slots, threads, tips, lengths, diameters. Lines must be straight and precise, not freehand.
- Dimension values: ALL values must be PLACEHOLDERS — blank spaces, dashes ("—"), or generic labels ("LENGTH", "DIAMETER", "HEIGHT"). NO real numbers. NO fake measurements. NO invented dimensions.
- Dimension panels: small rectangular boxes (#F0F0F0 fill, #CCCCCC border, 1px) next to each measurement line containing the placeholder label.
- Color palette: neutral white/gray background + product natural colors + dark gray (#333333) for annotation lines and text + ONE subtle accent (blue #2196F3 or red #F44336) for dimension leader lines only.
- Text: MINIMAL-MEDIUM. Headline + 3-4 short feature labels (describing what is being annotated: "OVERALL LENGTH", "THREAD SIZE", etc.) + 3 bottom_info items. NO body paragraphs. NO comparison_labels.
- Layout: product center-left with annotation lines radiating outward. Dimension labels placed in clean empty space. Lines must not cross each other.

Copy strategy for this template: MINIMAL-MEDIUM. Headline + 3-4 short labels describing the annotated dimensions + 3 bottom_info items. Labels should name the dimension type, not state a value.

AVOID:
- Real measurement numbers or specific dimensions
- Cluttered tables, data grids, or specification panels
- Dark backgrounds or heavy panels
- Lifestyle environments or workshop backgrounds
- Dramatic lighting or colored gels
- Product cropping (must show full product for annotation)
- Overlapping or crossing annotation lines
- Fake certifications or specification claims

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: [
      ...COMMON_RISK_RULES,
      "Do NOT generate real size dimensions or specific numerical measurements",
      "Dimension values must be placeholder-style only (blank, dashes, or generic labels)",
      "Annotation lines must point to real visible structures only",
    ],
    enabled: true,
  },

  {
    id: "tpl-image-set-5",
    name: "五张详情组图策划方案",
    description:
      "一次生成一套五张详情图。每张有独立视觉风格，全组保持产品一致性。",
    scope: "system",
    category: "image_set",
    tags: ["组图", "详情页", "五张图", "整套方案"],
    applicablePlatforms: ["Amazon", "Temu", "Ozon", "独立站", "通用"],
    applicableProducts: ["工业品", "五金", "工具", "紧固件", "切削工具"],
    variables: [
      { key: "overall_goal", label: "整体目标", type: "textarea", required: true },
    ],
    templatePrompt: `
## Template Style: 5-Image Detail Page Suite — MANDATORY

This is NOT 5 random product images. This is a COHERENT DETAIL PAGE STORY that guides the buyer from identification to purchase decision through a deliberate visual narrative.

MANDATORY structure for all 5 images (each image follows its own visual identity, but all must maintain consistent product appearance):

IMAGE 1 — HERO / MAIN IMAGE:
- Background: pure white (#FFFFFF) or very light gray (#F8F8F8). NO gradients. NO textures.
- Product: FULL product visible, 75-85% of frame, centered. Deep DOF, fully sharp.
- Lighting: soft diffused studio light, even illumination.
- Text: MINIMAL. Headline only (2-4 words, ALL CAPS). NO other text.
- Archetype: hero_feature. Layout: premium_center_product_minimal_text.

IMAGE 2 — FEATURE EXPLANATION:
- Background: cool light gray (#E8ECF0) with subtle blue undertone.
- Product: 40-50% of frame, positioned left or center, 3/4 angle.
- Lighting: professional even studio light.
- Text: MEDIUM. Headline + 3-4 feature_points (title + body) arranged in clean panels on the right.
- Archetype: multi_panel_info. Layout: hero_right_product_left_features.

IMAGE 3 — DETAIL / MACRO:
- Background: pure black (#0A0A0A). NO gradients. NO environment.
- Product: 40-60% of frame, DRAMATICALLY CROPPED — show only a key detail (edge, thread, tip, surface). This is a CLOSE-UP, not a full product shot.
- Lighting: single hard side light from left at 45°. Strong specular highlights. Deep shadows. Chiaroscuro.
- Detail insets: 1-2 magnified callouts showing surface texture.
- Text: MINIMAL. Headline only.
- Archetype: technical_breakdown. Layout: technical_callout_with_insets.

IMAGE 4 — LIFESTYLE / USAGE SCENE:
- Background: authentic workshop environment (CNC bed, workbench, assembly station). Warm tones.
- Background treatment: SHALLOW DOF, heavily blurred.
- Product: 35-45% of frame, in sharp focus, slightly off-center.
- Lighting: warm ambient workshop light (~3000K) + crisp key light on product.
- Text: MINIMAL. Headline + 2-3 short application_labels.
- Archetype: application_scene. Layout: four_panel_application_grid.

IMAGE 5 — PROMO / VALUE PROPOSITION:
- Background: deep dark (#1A1A1A) with bold geometric color blocks (electric blue, vivid orange, or hot red).
- Product: 55-65% of frame, brightly lit, sharp.
- Lighting: dramatic key light from upper-left + colored rim light matching accent block.
- Text: RICH. Oversized headline + subheadline + 3-4 feature badges + bottom info bar.
- Archetype: promo_sales. Layout: top_headline_bottom_feature_bar.

Cross-image consistency rules:
- Product material, color, and finish must be IDENTICAL across all 5 images.
- Product proportions and visible features must not change.
- The 5 images must feel like they belong to the same product page.

Copy strategy per image: Follow each image's own copy strategy (Hero=minimal, Feature=medium-rich, Detail=minimal, Lifestyle=minimal-medium, Promo=rich).

AVOID:
- Making any image look like it belongs to a different product
- Inconsistent product appearance between images
- Fake prices, fake discounts, or platform logos in any image
- Real measurement numbers in the Detail or Feature images

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: [
      ...COMMON_RISK_RULES,
      "All 5 images must maintain consistent product proportions and structure",
      "Material appearance must be consistent across the set",
    ],
    enabled: true,
  },
];
