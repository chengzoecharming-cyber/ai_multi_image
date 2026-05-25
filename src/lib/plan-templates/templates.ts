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
## Template: Feature Explanation — FUNCTIONAL BRIEF

Purpose: Communicate product benefits through a structured "product + info" composition. The product is the HERO; information supports it. The image must make the viewer understand WHAT the product does and WHY it matters within 3 seconds.

---

### Hard Constraints (must follow)
- Product must remain fully visible and recognizably accurate to the reference image (no cropping of edges, holes, threads, teeth, or cutting edges).
- On-image text must follow the copy rules below; do NOT invent technical data.
- The image must contain the product AND structured benefit information — never product-only or text-only.

### Visual Direction (suggested, not mandatory)
The LLM may choose any of these three directions or invent a valid alternative:

A. Product + Side Panels
   - Product left or center (50-65% of frame), info panels on the opposite side.
   - 3-4 feature blocks: icon hint + bold title + 1-line body.
   - Blocks separated by GENEROUS SPACING + subtle hairline dividers, NOT flat color panels.

B. Hero with Orbital Features
   - Product as central hero (55-70% of frame), benefit callouts arranged around it (top, sides, or bottom).
   - Connecting lines or subtle visual paths linking features to product zones.
   - Background with subtle depth: faint gradient, noise texture, or geometric mesh.

C. Exploded Benefit Map
   - Product shown with "zones" or regions highlighted, each tied to a benefit.
   - Useful when different parts of the product deliver different advantages.

### Common Style Guidance
- Headline zone: MUST exist at top as the visual anchor. Headline must be the highest visual hierarchy — large, bold, ALL CAPS or heavy weight. Headline color must echo the product's tone (analogous or complementary), never a random unrelated accent.
- Background: light and clean (white, very light gray, or subtle cool tint) BUT must have subtle depth — use faint radial gradient, subtle noise texture, or soft brushed metal reflection. Avoid pure flat color fills.
- Lighting: professional product lighting that keeps the product clearly readable; avoid dramatic chiaroscuro that hides details. Product must have subtle ground reflection and soft shadow beneath — never floating.
- Color palette: restrained. One accent color maximum for headlines/icons; otherwise neutral. The accent must relate to the product's natural color. Avoid pastel or flat unlayered color schemes.
- Information separation: feature blocks must be separated by GENEROUS SPACING and subtle hairline dividers. Do NOT use flat opaque color blocks for every text module. If panels need background, use glassmorphism (subtle translucency + soft shadow + rounded corners), never flat opaque rectangles.
- Icons: prefer outline / line-art style, uniform and restrained. Avoid filled color blobs or overly complex illustrations.
- Layout priority: product first (50-65% of frame), text second. Text must never obscure the product. Information is the supporting actor, not the star.

### Copy Strategy
- Density: MEDIUM as the upper limit. Prioritize generous negative space over filling the frame.
- Required blocks: headline + subheadline + 3-4 feature_points (each with title AND body) + 3 bottom_info items.
- Feature body text must explain WHY the feature matters, not just restate the title.
- Prohibited: comparison_labels, application_labels, fake data tables, measurement annotations.

### Avoid
- Dark or heavy backgrounds that reduce readability.
- Fake specifications, dimension lines, or certification badges.
- Text crowding or overlapping the product.
- Warm/high-saturation accents that clash with industrial product tones.
- Pure flat backgrounds with no gradient, texture, or depth cues.
- Product floating without shadow or reflection.
- Information panels as flat color blocks with sharp edges and no layering.
- Every text module having its own opaque background color — separation comes from SPACING, not boxes.
- Information density so high that the image feels crowded.

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
## Template: Advantage Comparison — FUNCTIONAL BRIEF

Purpose: Visually prove the product's superiority through a side-by-side contrast. The viewer must instantly read "this is better than the alternative" at thumbnail size.

---

### Hard Constraints (must follow)
- BOTH sides must depict the SAME product type / category.
- The LEFT side must show the product in a REAL PROBLEM / DEFECT STATE (e.g., chip welding, wear, dull finish, rough surface, poor cut quality) — NOT simply a desaturated version.
- The RIGHT side must show the SAME product in the IDEAL / SOLVED STATE (e.g., smooth finish, iridescent coating, sharp edges, pristine surface, clean cut) — a genuine state difference, not just color adjustment.
- The featured product (superior side) must preserve all visible features from the reference image: holes, grooves, threads, edges, teeth, contours.
- Do NOT generate fake performance data, test scores, statistics, or comparison numbers.
- Do NOT reference real competitor brands, logos, or identifiable products.

### Visual Direction (suggested, not mandatory)
The LLM may choose any of these three directions or invent a valid alternative:

A. Side-by-Side Split
   - Vertical or horizontal split. The superior side must be visually dominant (brighter, warmer, sharper, or slightly larger).
   - A clear "VS" or dividing element makes the comparison unmistakable.
   - Left side: product in defect state — dimmer, cooler, showing real wear/problems. Right side: product in ideal state — bright, vivid, premium finish.

B. Diagonal Contrast
   - A diagonal dividing line creates dynamic tension.
   - Superior product sits in the brighter/warmer zone; inferior product in the cooler/dimmer zone.
   - Useful when the product shape benefits from diagonal flow.

C. Before/After Reveal
   - A single product shown transitioning from "problem state" to "solved state."
   - Could use a slider-like visual or a wipe effect within one cohesive frame.

### Common Style Guidance
- Headline zone: MUST exist at top as the visual anchor. Headline must be the highest visual hierarchy — large, bold, ALL CAPS or heavy weight. Headline color should echo the product's tone or the "solved" side's warmth (analogous or complementary), never a random unrelated accent.
- Background: unified across both sides with SUBTLE DEPTH — use faint radial gradient from center, subtle light streaks, soft vignette, or faint brushed texture. Dark is recommended so the contrast reads as one image, not two pasted together. AVOID pure flat solid color.
- Color signals: the superior side should feel "solved / premium" (warm, bright, saturated); the inferior side should feel "problem / basic" (cool, dim, desaturated).
- Visual indicators: some form of status mark is recommended — e.g., red X / green check, or other intuitive iconography — but size must be MODERATE. Status marks are supporting elements, NOT the visual focus. They must not cover the product or dominate the frame.
- Layout priority: the superior side must feel dominant. Exact split ratio is flexible; let the product shape and chosen layout type decide.
- Products must have natural ground contact: subtle reflection plane + soft shadow beneath each product. Do NOT let products float.
- Content separation: comparison cards or blocks should be separated by GENEROUS SPACING + subtle hairline dividers or rounded-corner translucent containers. Do NOT use flat opaque color blocks for every module.
- Bottom feature bar is OPTIONAL. If present, it should have subtle top glow or gradient edge that blends naturally with the main background, not a hard rectangular block.
- Unified ambient light across the entire image creates cohesion; the two sides should not feel like separate images pasted together.

### Copy Strategy
- Density: MEDIUM as upper limit, but LOW-MEDIUM is also acceptable. Let the number of selling points dictate density; never force fill.
- Required blocks: headline + 2 comparison_labels (e.g., "ORDINARY" / "OUR PRODUCT") + feature_points + bottom_info items. Density is flexible.
- Comparison labels must be generic; never reference real brands.
- Feature points should highlight the specific advantages that make the product superior.

### Avoid
- Real competitor names, logos, or identifiable products.
- Fake data, test scores, or statistics.
- Equal treatment on both sides (defeats the purpose of comparison).
- Two completely different products.
- Text that covers or crowds the product.
- Pure flat backgrounds with no gradient, texture, or depth cues (e.g., solid #000000 or #1A1A1A).
- Products floating without shadow or reflection.
- Status marks that are oversized, cover the product, or dominate the visual hierarchy.
- Every text module having its own opaque background color — separation comes from SPACING, not boxes.
- Bottom bar with sharp edges, hard borders, or high-saturation color blocks.

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
## Template: Lifestyle / Usage Scene — FUNCTIONAL BRIEF

Purpose: Show the product in a believable real-world environment so the buyer can instantly imagine owning and using it. The product must remain the undisputed hero; the environment exists only to give context.

---

### Hard Constraints (must follow)
- Product must remain fully visible and recognizably accurate to the reference image (no cropping of edges, holes, threads, teeth, or cutting edges).
- Product must be the brightest and sharpest element in the frame. The environment must NOT steal attention.
- A HEADLINE ZONE must exist at the top of the frame as a visual anchor. The headline color should echo the product's dominant color (analogous or complementary), NOT generic black/white.
- Do NOT invent usage scenarios that are physically impossible or exaggerated for the product category.
- On-image text must follow the copy rules below; do NOT invent technical data.
- Content blocks must be separated by generous spacing and subtle hairline dividers, NOT by giving every text module its own opaque background color block.

### Visual Direction (suggested, not mandatory)
The LLM may choose any of these three directions or invent a valid alternative:

A. Single Environment Hero
   - One cohesive environment (workshop bench, CNC machine bed, assembly station, tool cart, etc.).
   - Product positioned using standard compositional techniques (rule of thirds, leading lines, or centered hero).
   - Background: shallow depth of field so the environment reads as context, not detail.

B. Multi-Scenario Grid
   - 2×2 or 3-panel grid showing the product in 2-4 different usage contexts.
   - Each panel is a mini lifestyle shot with its own micro-environment.
   - Best when the product has multiple clear use cases (e.g., cutting, drilling, finishing).

C. Process Flow
   - A sequence or path showing the product at different stages of a workflow.
   - Could be a left-to-right narrative: raw material → product in action → finished result.
   - Useful for tools where the "before/during/after" story is compelling.

### Common Style Guidance
- Environment: authentic and believable with AUTHENTIC USE TRACES — visible wear, tool marks, oil stains, metal shavings, cutting fluid residue, or worn surfaces. The environment must look REAL and USED, not sterile or obviously fake staging.
- Lighting: warm ambient environment light (tungsten/LED mix ~3000K-3500K) plus a dedicated key light on the product so it pops. Avoid flat even lighting.
- Depth of field: generally shallow — product sharp, background soft. The blur area should have SUBTLE DEPTH CUES like light falloff, soft vignette, or tonal variation. Avoid uniform flat blur.
- Background: MUST have depth — subtle gradient, soft vignette, light falloff, or environmental texture. NEVER a flat solid color fill (e.g., solid #000000, #1A1A1A, or pure RGB).
- Color palette: warm, earthy, industrial. Amber, brown, steel gray, oxidized metal tones are natural fits. The headline/title color should be drawn from the product's own color family. Avoid neon, pure black, or cool blue casts that fight the warmth.
- Atmosphere: subtle dust, shavings, or light beams are acceptable if they add realism without clutter. Do not overdo particles or lens effects.
- Layout: product is the hero. Environment frames it. Text stays in negative space; never place dense text over a busy background. If info labels or application tags are needed, prefer glassmorphism or subtle translucent overlays over opaque color blocks.
- Product must have natural ground contact: subtle shadow beneath + soft reflection on workbench surface. Do NOT let the product float.
- Density: MEDIUM is the upper limit. Prefer generous negative space. Do NOT crowd the frame with text boxes, labels, or decorative elements.

### Copy Strategy
- Density: MINIMAL–MEDIUM. MEDIUM is the absolute upper limit.
- Required blocks: headline + 2-3 application_labels (title + short body describing WHERE and HOW the product is used) + 3 bottom_info items.
- Application labels must describe the scenario, not just restate product features.
- Prohibited: comparison_labels, dense feature panels, fake certifications.

### Avoid
- Clean studio backgrounds or pure color fills (defeats the lifestyle purpose).
- Even lighting that makes the product blend into the environment.
- Product cropped or in extreme close-up (must show enough context).
- Exaggerated or physically impossible usage scenarios.
- Environment brighter or sharper than the product.
- Text-heavy layouts placed over busy backgrounds.
- Sterile or overly clean environments (brand-new unused equipment, spotless workbenches with no use marks).
- Flat uniform background blur with no tonal variation or depth cues.
- Product floating without shadow or ground contact.
- Every text module having its own opaque background color — separation comes from SPACING, not boxes.
- Oversized status marks, badges, or decorative icons that dominate the frame.

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
