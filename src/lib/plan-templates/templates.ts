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

const COMMON_EXECUTION_FLOW = `
## Execution Flow

S1 Product Analysis
- Analyze the reference image to identify product type, visible structure, material guess, and critical features

S2 Structure Lock
- Lock product geometry; mark all structure risks based on visible contours, holes, edges, threads, teeth, slots

S3 Layout Planning
- Determine composition based on template type and user goal
- Assign zones for product, headline, selling points, and optional detail areas

S4 Copy Processing
- Determine copySource (user_exact / ai_rewritten / ai_suggested)
- Generate or preserve headline, subtitle, and sellingPoints per copy rules

S5 Visual Enhancement
- Apply lighting, color, background, and style per visual rules
- Ensure product remains the visual center

S6 Quality Check
- Run the quality checklist before outputting final prompt
`;

export const SYSTEM_TEMPLATES: PlanTemplate[] = [
  // ───────────────────────────────────────────────
  // 1. 白底主图重构方案
  // ───────────────────────────────────────────────
  {
    id: "tpl-white-bg-hero",
    name: "白底主图重构方案",
    description:
      "适合 Amazon / Temu / Ozon 等平台主图。商品居中、白底、无文字、无 logo、无促销元素，产品轮廓清楚，结构准确。",
    scope: "system",
    category: "single_image",
    tags: ["主图", "白底", "无文字", "Amazon", "Temu", "Ozon"],
    applicablePlatforms: ["Amazon", "Temu", "Ozon", "通用"],
    applicableProducts: ["工业品", "五金", "工具", "紧固件", "切削工具"],
    variables: [
      { key: "product_name", label: "产品名称", type: "text", required: true, placeholder: "例如：Drill Bit" },
      { key: "product_analysis", label: "产品分析", type: "textarea", placeholder: "产品类型、可见结构、材质预估" },
    ],
    templatePrompt: `
You are an expert industrial e-commerce image planning assistant.

## Core Task
Create a clean white-background e-commerce main image for {{product_name}}.
The product must be centered, with clear silhouette and accurate geometry.
No text, no logo, no watermark, no extra objects, no promotional elements.

## Absolute Rules
- Product reference image is the sole basis for product structure
- Do not alter product outline, proportions, holes, teeth, cutting edges, threads, slots, edges, or irregular contours
- Do not add or remove product parts
- Do not generate fake logos, fake prices, fake parameters, fake sizes, fake certifications
- Do not generate specific technical data not provided by the user
- Image must contain ZERO on-image text

${COMMON_EXECUTION_FLOW}

## Copy Rules
- This template produces a NO-TEXT image
- headline, subtitle, and sellingPoints should be empty or marked as "N/A"
- If user provided text, note it for other templates but do NOT place it on this image

## Visual Rules
- Pure white background (#FFFFFF)
- Product centered, occupying 60–70% of frame
- Soft natural drop shadow beneath product
- Even studio lighting, no harsh shadows
- Crisp edges, high-resolution surface detail visible
- Clean silhouette, no color cast on background
- Slight reflection or grounding shadow acceptable

## Layout
- Product centered horizontally and vertically
- Generous negative space on all four sides
- No text zones, no badge zones, no info panels

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: COMMON_RISK_RULES,
    enabled: true,
  },

  // ───────────────────────────────────────────────
  // 2. Temu 单品卖点图方案
  // ───────────────────────────────────────────────
  {
    id: "tpl-temu-single-sales",
    name: "Temu 单品卖点图方案",
    description:
      "适合单个商品的强视觉卖点图。商品主体放大，有英文标题和 2–4 个卖点，适合 Temu 移动端浏览，有强销售感但不生成假价格和假 logo。",
    scope: "system",
    category: "single_image",
    tags: ["Temu", "单品", "卖点图", "移动端", "强销售感"],
    applicablePlatforms: ["Temu", "拼多多跨境", "移动端电商"],
    applicableProducts: ["工业品", "五金", "工具", "紧固件", "切削工具"],
    variables: [
      { key: "headline", label: "主标题 Headline", type: "text", required: true, placeholder: "例如：HEAVY DUTY DRILL BIT" },
      { key: "selling_points", label: "卖点 Selling Points", type: "string_list", required: true, placeholder: "例如：PROVEN DURABILITY" },
      { key: "visual_direction", label: "视觉方向", type: "textarea", placeholder: "例如：Bold commercial photography with strong contrast" },
      { key: "color_direction", label: "色彩方向", type: "textarea", placeholder: "例如：Dark charcoal background with bright orange accents" },
    ],
    templatePrompt: `
You are an expert industrial e-commerce image planning assistant specialized in high-conversion Temu-style product images.

## Core Task
Create a high-conversion single-product feature image for {{product_name}} based on the product reference image and user goal.
The image must work well on mobile screens and convey strong sales appeal.

## Absolute Rules
- Product reference image is the sole basis for product structure
- Do not alter product outline, proportions, holes, teeth, cutting edges, threads, slots, edges, or irregular contours
- Do not add or remove product parts
- Do not generate fake logos, fake prices, fake parameters, fake sizes, fake certifications
- Do not generate specific technical data not provided by the user
- All on-image text must follow the copy rules below
- Do NOT imitate platform logos (Temu, Amazon, etc.)

${COMMON_EXECUTION_FLOW}

${COMMON_COPY_RULES}

## Visual Rules
- Product dominates the frame at 60–75% scale
- Bold, high-contrast commercial photography style
- Crisp product edges with professional studio lighting
- Mobile-first composition: key info within thumb-reachable zones
- Product is the absolute visual center
- Strong e-commerce sales tension without looking cheap
- Dynamic angle or perspective to add energy
- Optional subtle glow or highlight treatment around product

## Layout
- Large headline area (top or upper-left)
- 2–4 selling point badges or blocks arranged for mobile readability
- Product centered or slightly offset for visual dynamism
- Clean background with subtle gradient or solid color
- Avoid cluttered corners; keep breathing room

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: COMMON_RISK_RULES,
    enabled: true,
  },

  // ───────────────────────────────────────────────
  // 3. 功能卖点说明图方案
  // ───────────────────────────────────────────────
  {
    id: "tpl-feature-explanation",
    name: "功能卖点说明图方案",
    description:
      "适合详情页卖点说明图。商品主体清楚，有标题区和卖点块，可展示材质、结构、耐用、精度等优势，不生成虚假参数。",
    scope: "system",
    category: "single_image",
    tags: ["详情页", "功能卖点", "说明图", "材质", "结构"],
    applicablePlatforms: ["Amazon", "Temu", "Ozon", "独立站", "通用"],
    applicableProducts: ["工业品", "五金", "工具", "紧固件", "切削工具"],
    variables: [
      { key: "headline", label: "主标题 Headline", type: "text", required: true, placeholder: "例如：BUILT TO LAST" },
      { key: "selling_points", label: "卖点 Selling Points", type: "string_list", required: true, placeholder: "例如：DURABLE CONSTRUCTION" },
      { key: "layout_direction", label: "版式方向", type: "textarea", placeholder: "例如：Product on left 45%, feature callouts on right" },
      { key: "visual_direction", label: "视觉方向", type: "textarea", placeholder: "例如：Clean technical illustration style" },
    ],
    templatePrompt: `
You are an expert industrial e-commerce image planning assistant.

## Core Task
Create a feature-explanation product image for {{product_name}}.
The image should clearly communicate product advantages (material, structure, durability, precision) without fabricating technical data.

## Absolute Rules
- Product reference image is the sole basis for product structure
- Do not alter product outline, proportions, holes, teeth, cutting edges, threads, slots, edges, or irregular contours
- Do not add or remove product parts
- Do not generate fake logos, fake prices, fake parameters, fake sizes, fake certifications
- Do not generate specific technical data not provided by the user
- All on-image text must follow the copy rules below

${COMMON_EXECUTION_FLOW}

${COMMON_COPY_RULES}

## Visual Rules
- Clean, professional technical illustration style overlaid on product photo
- Product body must remain clearly visible and accurate
- Subtle highlight circles or lines pointing to key functional areas
- Crisp, readable typography
- Professional studio lighting with even exposure
- Background should not distract from product and feature callouts

## Layout
- Clear title zone (top-center or top-left)
- Selling point blocks arranged logically around or beside product
- Optional subtle connector lines from callout text to corresponding product areas
- Product occupies 40–55% of frame; info areas balanced with negative space
- No cluttered data tables or fake specification boxes

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: COMMON_RISK_RULES,
    enabled: true,
  },

  // ───────────────────────────────────────────────
  // 4. 局部放大说明图方案
  // ───────────────────────────────────────────────
  {
    id: "tpl-detail-magnifier",
    name: "局部放大说明图方案",
    description:
      "适合突出刀刃、孔位、螺纹、槽口、连接头、边缘等细节。主产品 + 1–2 个局部放大区域，放大区域必须来自真实结构，不得杜撰局部细节。",
    scope: "system",
    category: "single_image",
    tags: ["局部放大", "细节图", "刀刃", "螺纹", "槽口"],
    applicablePlatforms: ["Amazon", "Temu", "Ozon", "独立站", "通用"],
    applicableProducts: ["切削工具", "紧固件", "精密零件", "五金件"],
    variables: [
      { key: "headline", label: "主标题 Headline", type: "text", required: true, placeholder: "例如：PRECISION CRAFTED" },
      { key: "detail_focus", label: "细节聚焦 Detail Focus", type: "textarea", required: true, placeholder: "例如：Cutting edge geometry and surface finish" },
      { key: "selling_points", label: "卖点 Selling Points", type: "string_list", placeholder: "例如：SHARP EDGES, SMOOTH FINISH" },
    ],
    templatePrompt: `
You are an expert industrial e-commerce image planning assistant specialized in detail-magnifier product images.

## Core Task
Create a detail-magnifier image for {{product_name}} that highlights critical structural details (cutting edges, holes, threads, slots, joints, edges).
The magnified areas must correspond to real structures visible in the reference image.

## Absolute Rules
- Product reference image is the sole basis for product structure
- Do not alter product outline, proportions, holes, teeth, cutting edges, threads, slots, edges, or irregular contours
- Do not add or remove product parts
- Magnified detail areas must come from ACTUAL visible structures; do NOT invent details
- Do not generate fake labels, fake measurements, or garbled text on magnified areas
- Do not generate fake logos, fake prices, fake parameters, fake sizes, fake certifications
- All on-image text must follow the copy rules below

${COMMON_EXECUTION_FLOW}

${COMMON_COPY_RULES}

## Visual Rules
- Macro-photography style with razor-sharp focus on critical surfaces
- Shallow depth of field to isolate detail areas
- Visible material grain, finish quality, and surface topography
- Dramatic side or rim lighting to emphasize edges and texture
- 1–2 magnified inset circles or zoom panels showing real structural detail
- Inset zoom must be accurate to actual proportions; no exaggerated or invented features

## Layout
- Main product shown at moderate scale with key detail area indicated
- Magnified inset(s) placed at top-right or adjacent to main product
- Minimal text labels pointing to specific real features only
- Dark gradient vignette optional to focus attention
- No fake measurement lines, dimension callouts, or technical annotations

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: [
      ...COMMON_RISK_RULES,
      "Magnified detail areas must correspond to real visible structures; do not invent details",
      "Do not generate fake measurement lines or dimension callouts",
    ],
    enabled: true,
  },

  // ───────────────────────────────────────────────
  // 5. 优势对比图方案
  // ───────────────────────────────────────────────
  {
    id: "tpl-advantage-comparison",
    name: "优势对比图方案",
    description:
      "适合表达与普通产品相比的优势。可以有对比区域，表达强度、耐用、精度、材质等差异，不生成假版本、假参数、假数字。",
    scope: "system",
    category: "single_image",
    tags: ["优势对比", "对比图", "强度", "耐用", "精度"],
    applicablePlatforms: ["Amazon", "Temu", "Ozon", "独立站", "通用"],
    applicableProducts: ["工业品", "五金", "工具", "紧固件", "切削工具"],
    variables: [
      { key: "headline", label: "主标题 Headline", type: "text", required: true, placeholder: "例如：WHY CHOOSE US" },
      { key: "selling_points", label: "卖点 Selling Points", type: "string_list", required: true, placeholder: "例如：SUPERIOR DESIGN" },
      { key: "comparison_direction", label: "对比方向", type: "textarea", placeholder: "例如：Featured product vibrant on left vs generic alternative muted on right" },
    ],
    templatePrompt: `
You are an expert industrial e-commerce image planning assistant.

## Core Task
Create an advantage-comparison image for {{product_name}} that visually communicates why this product is superior.
Comparison may express strength, durability, precision, or material quality differences.
No fake versions, fake parameters, or fake numbers may be generated.

## Absolute Rules
- Product reference image is the sole basis for product structure
- Do not alter product outline, proportions, holes, teeth, cutting edges, threads, slots, edges, or irregular contours
- Do not add or remove product parts
- Do NOT generate fake performance data, test scores, comparison numbers, or statistics
- Do NOT reference specific competitor brands or products
- Do NOT invent warranty periods, lifespan claims, or durability statistics
- Do not generate fake logos, fake prices, fake parameters, fake sizes, fake certifications
- All on-image text must follow the copy rules below
- Visual comparison only — no fabricated charts, graphs, or data tables

${COMMON_EXECUTION_FLOW}

${COMMON_COPY_RULES}

## Visual Rules
- Side-by-side or implied comparison layout
- Featured product prominently displayed with vibrant color, sharp focus, and subtle highlight/glow
- Generic alternative represented abstractly (smaller, desaturated, less defined) — no real competitor imagery
- Strong visual hierarchy: left side dominant, right side subdued
- Subtle diagonal dividing line or gradient transition acceptable
- Clean, professional studio lighting on featured product
- No cluttered text or data tables

## Layout
- Headline centered at top
- Featured product on left at larger scale with full color and warm highlights
- Abstract/generic alternative on right at smaller scale with desaturated treatment
- 2–3 advantage points as bold vertical bars or clean text blocks between the two sides
- No specific numerical comparisons, no fake test result icons

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: [
      ...COMMON_RISK_RULES,
      "Do NOT generate fake performance data, test scores, comparison numbers, or statistics",
      "Do NOT reference specific competitor brands or products",
      "Do NOT invent warranty periods, lifespan claims, or durability statistics",
      "Visual comparison only — no fabricated charts, graphs, or data tables",
    ],
    enabled: true,
  },

  // ───────────────────────────────────────────────
  // 6. 适配工具图方案
  // ───────────────────────────────────────────────
  {
    id: "tpl-compatible-tools",
    name: "适配工具图方案",
    description:
      "适合展示适配工具、设备、使用方式。商品主体准确，可以有适配工具或设备面板，不编造兼容范围，不生成误导性图标。",
    scope: "system",
    category: "single_image",
    tags: ["适配工具", "设备", "使用方式", "兼容性"],
    applicablePlatforms: ["Amazon", "Temu", "Ozon", "独立站", "通用"],
    applicableProducts: ["切削工具", "紧固件", "配件", "连接件"],
    variables: [
      { key: "headline", label: "主标题 Headline", type: "text", required: true, placeholder: "例如：UNIVERSAL FIT" },
      { key: "compatible_tools", label: "适配工具 Compatible Tools", type: "textarea", placeholder: "例如：Standard drill chucks, rotary tools" },
      { key: "selling_points", label: "卖点 Selling Points", type: "string_list", placeholder: "例如：WIDE COMPATIBILITY" },
    ],
    templatePrompt: `
You are an expert industrial e-commerce image planning assistant.

## Core Task
Create a compatible-tools / usage-context image for {{product_name}}.
Show the product with relevant tools, equipment, or interfaces it works with.
Do NOT invent compatibility ranges or generate misleading icons.

## Absolute Rules
- Product reference image is the sole basis for product structure
- Do not alter product outline, proportions, holes, teeth, cutting edges, threads, slots, edges, or irregular contours
- Do not add or remove product parts
- Do NOT invent specific tool models, brands, or compatibility lists not provided by user
- Do NOT generate misleading compatibility icons, certification badges, or compatibility charts
- Do not generate fake logos, fake prices, fake parameters, fake sizes, fake certifications
- All on-image text must follow the copy rules below

${COMMON_EXECUTION_FLOW}

${COMMON_COPY_RULES}

## Visual Rules
- Product remains accurate and clearly visible
- Compatible tools or equipment panels shown as contextual supporting elements
- Tools should be generic/industry-standard in appearance; no branded equipment
- Clean, professional studio or controlled-environment lighting
- Context should enhance understanding without overwhelming the product
- Subtle depth-of-field to keep product in sharp focus while tools are slightly softer

## Layout
- Product positioned to show connection point or interface clearly
- Compatible tool or device panel placed adjacent or behind product
- Headline and 1–2 selling points in clean text zones
- No cluttered compatibility tables or fake model lists
- Connection interface must be accurate to real geometry

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: [
      ...COMMON_RISK_RULES,
      "Do NOT invent specific tool models, brands, or compatibility lists not provided by user",
      "Do NOT generate misleading compatibility icons or certification badges",
    ],
    enabled: true,
  },

  // ───────────────────────────────────────────────
  // 7. 规格信息图方案
  // ───────────────────────────────────────────────
  {
    id: "tpl-spec-info",
    name: "规格信息图方案",
    description:
      "适合做信息感、规格感较强的详情页图。允许信息区和规格区，但不生成真实尺寸数字、技术参数、测量线和假标注。",
    scope: "system",
    category: "single_image",
    tags: ["规格信息", "详情页", "信息图", "参数"],
    applicablePlatforms: ["Amazon", "Temu", "Ozon", "独立站", "通用"],
    applicableProducts: ["工业品", "五金", "工具", "紧固件", "切削工具"],
    variables: [
      { key: "headline", label: "主标题 Headline", type: "text", required: true, placeholder: "例如：PRODUCT SPECIFICATIONS" },
      { key: "selling_points", label: "卖点 Selling Points", type: "string_list", placeholder: "例如：PREMIUM QUALITY" },
      { key: "layout_direction", label: "版式方向", type: "textarea", placeholder: "例如：Product on left, info panels on right with placeholder fields" },
    ],
    templatePrompt: `
You are an expert industrial e-commerce image planning assistant.

## Core Task
Create a specification-style information image for {{product_name}}.
The image should feel informative and technical, but must NOT generate real size numbers, technical parameters, measurement lines, or fake annotations.

## Absolute Rules
- Product reference image is the sole basis for product structure
- Do not alter product outline, proportions, holes, teeth, cutting edges, threads, slots, edges, or irregular contours
- Do not add or remove product parts
- Do NOT generate real size dimensions, measurement lines, or technical annotations
- Do NOT generate specific technical parameters (torque, hardness, load, RPM, etc.) unless explicitly provided by user
- Do not generate fake logos, fake prices, fake parameters, fake sizes, fake certifications
- All on-image text must follow the copy rules below
- Specification fields should be presented as placeholder-style labels or generic category headers only

${COMMON_EXECUTION_FLOW}

${COMMON_COPY_RULES}

## Visual Rules
- Clean, technical, information-dense aesthetic without looking cluttered
- Product shown clearly with optional dimension reference lines (stylistic only, no real numbers)
- Info panels with placeholder-style labels (e.g., "Size:", "Material:", "Application:") — values left blank or generic
- Professional studio lighting, crisp edges
- Background: neutral gray or subtle gradient suggesting technical documentation

## Layout
- Product on one side (left or center-left)
- Info/specification zones on the other side as clean panels or rows
- Headline at top
- 1–2 selling points as trust badges
- No real measurement callouts, no fake data tables with numbers
- Specification fields must be clearly placeholder-style if no real data provided

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: [
      ...COMMON_RISK_RULES,
      "Do NOT generate real size dimensions, measurement lines, or technical annotations",
      "Do NOT generate specific technical parameters unless explicitly provided by user",
      "Specification fields should be placeholder-style labels or generic category headers only",
    ],
    enabled: true,
  },

  // ───────────────────────────────────────────────
  // 8. 应用场景图方案
  // ───────────────────────────────────────────────
  {
    id: "tpl-usage-scene",
    name: "应用场景图方案",
    description:
      "适合机加工、装配安装、维修维护、仓储供货、质检检测等应用场景。场景不能喧宾夺主，商品主体清楚，结构不变，场景应服务于产品用途。",
    scope: "system",
    category: "single_image",
    tags: ["应用场景", "机加工", "装配", "维修", "仓储"],
    applicablePlatforms: ["Amazon", "Temu", "Ozon", "独立站", "通用"],
    applicableProducts: ["切削工具", "紧固件", "工具", "五金件"],
    variables: [
      { key: "headline", label: "主标题 Headline", type: "text", required: true, placeholder: "例如：REAL PERFORMANCE" },
      { key: "scene_direction", label: "场景方向", type: "textarea", required: true, placeholder: "例如：Machine shop workbench with metal workpieces" },
      { key: "selling_points", label: "卖点 Selling Points", type: "string_list", placeholder: "例如：WORKSITE READY" },
    ],
    templatePrompt: `
You are an expert industrial e-commerce image planning assistant.

## Core Task
Create a usage-scene / lifestyle image for {{product_name}}.
Show the product in a realistic working environment (machining, assembly, maintenance, warehousing, quality inspection).
The scene must serve the product's purpose without overwhelming or distracting from it.

## Absolute Rules
- Product reference image is the sole basis for product structure
- Do not alter product outline, proportions, holes, teeth, cutting edges, threads, slots, edges, or irregular contours
- Do not add or remove product parts
- Do NOT invent usage scenarios beyond what is reasonable for this product type
- Do NOT show the product performing impossible or exaggerated tasks
- Environment should suggest context but NOT distract from the product
- Do not generate fake logos, fake prices, fake parameters, fake sizes, fake certifications
- All on-image text must follow the copy rules below

${COMMON_EXECUTION_FLOW}

${COMMON_COPY_RULES}

## Visual Rules
- Natural environmental photography with authentic industrial or workshop setting
- Warm ambient lighting suggesting real working conditions
- Shallow depth of field: product in sharp focus, background softly blurred
- Realistic shadows and reflections on surrounding surfaces
- Scene elements (workbench, materials, tools) should be generic and unbranded
- Product shown in natural working position, not floating or disconnected from context

## Layout
- Product positioned slightly off-center in natural working orientation
- Relevant environment context softly blurred in background
- Headline top-left or top-center with generous spacing
- Selling points as clean vertical list or badges on right edge
- Scene must not cover more than 40% of visual weight; product remains dominant

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: [
      ...COMMON_RISK_RULES,
      "Do NOT invent usage scenarios beyond what is reasonable for this product type",
      "Do NOT show the product performing impossible or exaggerated tasks",
      "Environment should suggest context but NOT distract from the product",
    ],
    enabled: true,
  },

  // ───────────────────────────────────────────────
  // 9. 促销销售图方案
  // ───────────────────────────────────────────────
  {
    id: "tpl-promo-sales",
    name: "促销销售图方案",
    description:
      "适合 Temu / 跨境电商强销售感图片。大标题区、卖点块、产品组合或产品主体突出、强电商销售感，不生成假价格、假折扣、假活动信息。",
    scope: "system",
    category: "single_image",
    tags: ["促销", "销售图", "Temu", "跨境电商", "强销售感"],
    applicablePlatforms: ["Temu", "拼多多跨境", "速卖通", "移动端电商"],
    applicableProducts: ["工业品", "五金", "工具", "紧固件", "切削工具"],
    variables: [
      { key: "headline", label: "主标题 Headline", type: "text", required: true, placeholder: "例如：HOT SALE — PREMIUM QUALITY" },
      { key: "selling_points", label: "卖点 Selling Points", type: "string_list", required: true, placeholder: "例如：LIMITED STOCK, FACTORY DIRECT" },
      { key: "visual_direction", label: "视觉方向", type: "textarea", placeholder: "例如：High-energy commercial photography with bold colors" },
      { key: "color_direction", label: "色彩方向", type: "textarea", placeholder: "例如：Vibrant orange and red accents on dark background" },
    ],
    templatePrompt: `
You are an expert industrial e-commerce image planning assistant specialized in high-energy promotional product images.

## Core Task
Create a promotional sales image for {{product_name}} with strong e-commerce sales appeal.
Suitable for Temu and cross-border e-commerce platforms.
Must feel urgent and compelling WITHOUT generating fake prices, fake discounts, or fake campaign info.

## Absolute Rules
- Product reference image is the sole basis for product structure
- Do not alter product outline, proportions, holes, teeth, cutting edges, threads, slots, edges, or irregular contours
- Do not add or remove product parts
- Do NOT generate fake prices, fake discounts, fake countdown timers, or fake campaign banners
- Do NOT generate fake "original price / sale price" comparisons
- Do NOT generate fake "limited time" or "flash sale" claims with specific numbers
- Do not generate fake logos, fake parameters, fake sizes, fake certifications
- All on-image text must follow the copy rules below
- Do NOT imitate platform logos (Temu, Amazon, etc.)

${COMMON_EXECUTION_FLOW}

${COMMON_COPY_RULES}

## Visual Rules
- High-energy commercial photography with bold, saturated colors
- Large, commanding headline area
- Product or product combination prominently featured
- Strong sales tension through color, composition, and typography — not through fake pricing
- Dynamic diagonal or off-center composition for energy
- Optional subtle burst, star, or highlight effects (non-literal, decorative only)
- Mobile-optimized: key message readable on small screens

## Layout
- Large headline zone (top or upper area)
- 2–4 selling point blocks arranged for maximum visual impact
- Product centered or dominant with optional secondary product angle
- Clean background with bold color blocks or gradient
- No fake price tags, no fake discount percentages, no fake countdown numbers
- CTA-style text allowed only as generic phrases (e.g., "SHOP NOW" — not tied to fake offers)

${COMMON_QUALITY_CHECKS}
`.trim(),
    defaultRiskRules: [
      ...COMMON_RISK_RULES,
      "Do NOT generate fake prices, fake discounts, fake countdown timers, or fake campaign banners",
      "Do NOT generate fake 'original price / sale price' comparisons",
      "Do NOT generate fake 'limited time' or 'flash sale' claims with specific numbers",
    ],
    enabled: true,
  },

  // ───────────────────────────────────────────────
  // 10. 五张详情组图策划方案
  // ───────────────────────────────────────────────
  {
    id: "tpl-image-set-5",
    name: "五张详情组图策划方案",
    description:
      "一次生成一套五张商品详情图的策划方案。默认五张：主图、功能卖点图、局部细节图、应用场景图、优势对比图/规格信息图。全组图风格统一，每张图职责明确，可逐张生成。",
    scope: "system",
    category: "image_set",
    tags: ["组图", "详情页", "五张图", "整套方案"],
    applicablePlatforms: ["Amazon", "Temu", "Ozon", "独立站", "通用"],
    applicableProducts: ["工业品", "五金", "工具", "紧固件", "切削工具"],
    variables: [
      { key: "overall_goal", label: "整体目标", type: "textarea", required: true, placeholder: "例如：一套专业钻头详情页组图，强调精度和耐用性" },
      { key: "headline", label: "默认主标题 Headline", type: "text", placeholder: "例如：PREMIUM DRILL BIT SET" },
      { key: "selling_points", label: "默认卖点 Selling Points", type: "string_list", placeholder: "例如：PROVEN DURABILITY, PRECISION ENGINEERED" },
      { key: "scene_direction", label: "场景方向", type: "textarea", placeholder: "例如：Machine shop workbench environment" },
    ],
    templatePrompt: `
You are an expert industrial e-commerce image planning assistant.

## Core Task
Create a cohesive 5-image product detail-page visual suite for {{product_name}}.
The set must have a unified style while each image has a distinct role.
This template generates an ImageSetPlan containing 5 CreativePlans.
Each CreativePlan can be generated individually — do NOT generate all images at once.

## Default 5-Image Structure
1. Hero Image / 主图 — Clean product showcase, minimal text
2. Feature Explanation / 功能卖点图 — Highlight key advantages with callouts
3. Detail Magnifier / 局部细节图 — Zoom into critical structural details
4. Usage Scene / 应用场景图 — Product in realistic working environment
5. Advantage Comparison OR Spec Info / 优势对比图 or 规格信息图 — Visual comparison or placeholder spec layout

## Absolute Rules
- Product reference image is the sole basis for product structure across ALL 5 images
- Do not alter product outline, proportions, holes, teeth, cutting edges, threads, slots, edges, or irregular contours in ANY image
- Do not add or remove product parts in ANY image
- All 5 images must maintain consistent product proportions and structure
- Do not vary material appearance across images in the same set
- Text style and typography must be consistent across the set
- Do not generate fake logos, fake prices, fake parameters, fake sizes, fake certifications
- All on-image text must follow the copy rules below

${COMMON_EXECUTION_FLOW}

${COMMON_COPY_RULES}

## Visual Rules (Set-Wide)
- Unified color temperature and lighting direction across all 5 images
- Consistent background family (e.g., all white, all dark, or all neutral gray)
- Consistent product scale reference so proportions feel natural across the set
- Each image has a clearly differentiated composition while maintaining style coherence
- Professional studio lighting baseline with per-image variations for role emphasis

## Per-Image Role Guidelines

### Image 1 — Hero Image
- Clean, minimal, product-centered
- Optional headline + 2–3 short selling points as badges
- No clutter, maximum clarity

### Image 2 — Feature Explanation
- Product + feature callout areas
- Subtle connector lines to real product features
- No fake performance metrics

### Image 3 — Detail Magnifier
- Main product + 1–2 magnified insets of real visible details
- Macro-style focus on critical edges, surfaces, or interfaces
- No invented detail structures

### Image 4 — Usage Scene
- Natural working environment, product in context
- Background softly blurred, product in sharp focus
- Scene serves product; does not distract

### Image 5 — Advantage Comparison OR Spec Info
- If comparison: featured product vs abstract generic alternative, no fake data
- If spec info: placeholder-style labels, no real measurement numbers
- Choose based on user goal and product type

## Layout (Set-Wide)
- Consistent safe zones for text across all images
- Headline position standardized (e.g., always top-left or always top-center)
- Selling point badge style consistent
- Product anchor point consistent (e.g., always center-left or always center)

${COMMON_QUALITY_CHECKS}

Additional set-wide checks:
- All 5 images maintain consistent product proportions and structure
- Material appearance does not vary across the set
- Text style and typography are consistent across all images
`.trim(),
    defaultRiskRules: [
      ...COMMON_RISK_RULES,
      "All 5 images must maintain consistent product proportions and structure",
      "Do not vary material appearance across images in the same set",
      "Text style and typography must be consistent across the set",
    ],
    enabled: true,
  },
];
