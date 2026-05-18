/**
 * Template Library System
 *
 * Each template is a complete prompt solution — not a fragment.
 * Flow: Select template → Fill variables → Generate final prompt.
 *
 * Tags are used ONLY for filtering, NOT for prompt assembly.
 */

export function getDefaultVariableValues(template: PromptTemplate): Record<string, string> {
  const values: Record<string, string> = {};
  for (const v of template.variables) {
    values[v.key] = v.defaultValue || "";
  }
  return values;
}

// ─── Types ──────────────────────────────────────────────────────────

export interface TemplateVariable {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  options?: string[];
  required?: boolean;
  defaultValue?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  /** Tags for filtering only — never injected into the prompt */
  tags: {
    platformTags: string[];
    productTags: string[];
    templateTypeTags: string[];
  };
  variables: TemplateVariable[];
  /** Complete prompt template with {{variable}} placeholders */
  templatePrompt: string;
  /** Corresponding negative prompt */
  negativePrompt: string;
  sortOrder: number;
  enabled: boolean;
}

export interface TemplateFilterState {
  platformTag: string | null;
  productTag: string | null;
  templateTypeTag: string | null;
}

// ─── Common sections reused across templates ────────────────────────

const COMMON_ROLE = `ROLE:
You are a professional e-commerce product image generation specialist for industrial hardware, cutting tools, fasteners, and mechanical parts. Your expertise includes commercial product photography, industrial visual design, and marketplace-compliant image creation. You understand how to preserve product geometry while enhancing visual appeal for online sales.`;

const COMMON_IRON_RULES = `IRON RULES (Never Violate):
1. Use the product reference image as the GROUND TRUTH. Preserve original product shape, proportions, geometry, structure, holes, grooves, edges, threads, cutting edges, mounting points, and all key mechanical details.
2. Do NOT redesign, reshape, or alter the product structure. Do NOT add or remove parts, holes, threads, or features.
3. Do NOT generate fake logos, fake prices, fake slogans, fake sizes, fake numbers, fake measurement labels, or gibberish text.
4. Do NOT invent compatibility claims, performance specifications, or technical parameters.
5. Do NOT translate, rewrite, supplement, or fabricate text content.
6. If the user provides text, use ONLY the user-provided text exactly as given. If no text is provided, leave text areas blank or preserve clean information zone structures without adding content.
7. Mechanical accuracy is critical: hole count/positions/diameters, slot widths, thread pitch/profile, edges, chamfers, radii, angles, and overall dimensions must remain immutable.`;

const COMMON_TEXT_RULES = `TEXT RULES:
- If the user provides text in {{text_language}}: Use ONLY the user-provided text. Do NOT translate, rewrite, supplement, or fabricate.
- If the user does NOT provide text: Leave text areas blank or preserve clean information zone structures. Do NOT add placeholder text, fake words, or gibberish.
- Do NOT generate fake readable text, fake logos, fake prices, fake slogans, fake sizes, fake numbers, or incorrect language text.
- Do NOT generate fake arrows, fake labels, fake icons, or misleading annotations.`;

const COMMON_QUALITY_CHECK = `QUALITY CHECK (Self-verify before output):
1. Does the product geometry exactly match the reference image?
2. Are there any fake text, numbers, logos, or labels?
3. Is the product the clear main focus?
4. Is the background appropriate and non-distracting?
5. Are material textures and lighting realistic?
6. Have all iron rules been followed?`;

const COMMON_NEGATIVE_BASE = `no fake readable text, no gibberish words, no incorrect text, no fake numbers, no fabricated labels, no fake logos, no fake prices, no fake slogans, no watermark, no cartoon style, no illustration style, no toy-like 3D render, no deformation, no incorrect structure, no unrealistic mechanical geometry, no extra parts, no incorrect components, no messy background, no clutter, no people, no hands, no human face, color shift, inaccurate color, unnatural hue, oversaturated colors, low resolution, pixelated, compressed artifacts, blurry details, noise`;

// ─── Template 1: White Background Main Image ────────────────────────

const TEMPLATE_01: PromptTemplate = {
  id: "white_bg_main",
  name: "白底主图重构模版",
  description: "适合电商平台主图，纯白背景，产品居中清晰展示，强调产品本体和材质细节。",
  tags: {
    platformTags: ["Temu", "Amazon", "Ozon", "SHEIN"],
    productTags: ["五金", "刀具", "机械件", "紧固件"],
    templateTypeTags: ["白底主图"],
  },
  variables: [
    {
      key: "text_language",
      label: "文字语言",
      type: "select",
      options: ["English", "中文", "No text"],
      defaultValue: "No text",
      required: false,
    },
    {
      key: "free_description",
      label: "补充描述（可选）",
      type: "textarea",
      placeholder: "例如：需要展示产品的某个特定角度、强调某种材质...",
      required: false,
    },
  ],
  templatePrompt: `${COMMON_ROLE}

TASK:
Generate a clean white-background e-commerce main image. The product must be centered, clearly visible, with accurate silhouette and geometry. This is a catalog-style product photograph optimized for marketplace listing.

${COMMON_IRON_RULES}

EXECUTION PROCESS:
Step 1: Analyze the product reference image to understand exact shape, structure, proportions, and key details.
Step 2: Place the product in the center of a pure white (#FFFFFF) background. Ensure the product is the sole focus.
Step 3: Apply professional product lighting: soft, even illumination with subtle highlights that reveal material texture (metal, brushed, polished, matte, etc.) without overexposure.
Step 4: Optimize shadows: add a soft, natural drop shadow beneath the product to create depth and grounding, but keep it subtle and realistic.
Step 5: Ensure the product edges are clean and well-defined against the white background.
Step 6: Preserve all mechanical details: threads, holes, grooves, edges, cutting angles, surface textures.
Step 7: Apply final color correction to ensure accurate metal tones and avoid color casts.

${COMMON_TEXT_RULES}

VISUAL RULES:
- Background: Pure white, gradient white, or very subtle light gray gradient. No objects, no scenes, no props.
- Composition: Product centered, generous padding, balanced visual weight.
- Lighting: Softbox-style even lighting with gentle highlight accents.
- Shadow: Soft natural drop shadow only, no harsh or dramatic shadows.
- Angle: Default front-facing or 45-degree angle unless user specifies otherwise.
- Style: Professional product catalog photography, clean and minimal.
- {{free_description}}

${COMMON_QUALITY_CHECK}`,
  negativePrompt: `${COMMON_NEGATIVE_BASE}, colored background, gradient background with color tint, busy background, cluttered scene, props, objects around product, dramatic lighting, harsh shadows, people, hands, text, captions, labels, watermark, logo, cartoon, illustration, 3D toy render, deformation, incorrect geometry, extra parts, missing holes, changed structure`,
  sortOrder: 1,
  enabled: true,
};

// ─── Template 2: Temu Single Product Feature Image ──────────────────

const TEMPLATE_02: PromptTemplate = {
  id: "temu_single_feature",
  name: "Temu 单品卖点图模版",
  description: "Temu风格单品推广图，大标题区域 + 产品主体突出，适合单品卖点展示。",
  tags: {
    platformTags: ["Temu"],
    productTags: ["五金", "刀具", "机械件", "紧固件"],
    templateTypeTags: ["卖点图"],
  },
  variables: [
    {
      key: "headline",
      label: "主标题（英文）",
      type: "text",
      placeholder: "例如：Heavy Duty Hex Bolts",
      required: false,
    },
    {
      key: "subtitle",
      label: "副标题（英文）",
      type: "text",
      placeholder: "例如：Grade 8.8 Steel, Zinc Plated",
      required: false,
    },
    {
      key: "selling_points",
      label: "卖点文字（英文，每行一个）",
      type: "textarea",
      placeholder: "例如：\nPremium Grade 8.8 Steel\nZinc Plated Corrosion Resistant\nPrecision Threaded",
      required: false,
    },
    {
      key: "text_language",
      label: "文字语言",
      type: "select",
      options: ["English", "中文", "No text"],
      defaultValue: "English",
      required: false,
    },
    {
      key: "free_description",
      label: "补充描述（可选）",
      type: "textarea",
      placeholder: "例如：需要强调产品的耐用性、精度等...",
      required: false,
    },
  ],
  templatePrompt: `${COMMON_ROLE}

TASK:
Generate a Temu-style e-commerce feature poster for a single product. The composition must include: a large headline area at top, the main product prominently displayed in center, and selling-point blocks or subtitle area. Design for mobile-first viewing with strong visual impact and conversion-oriented layout.

${COMMON_IRON_RULES}

EXECUTION PROCESS:
Step 1: Analyze the product reference image. Identify key visual strengths: material quality, precision, durability, structural features.
Step 2: Create a bold promotional composition with clean color blocks or subtle gradients as background. Temu-style: vibrant but not garish, clean geometry.
Step 3: Place the product as the dominant visual element, centered or slightly offset for dynamic balance. Scale it large enough to show detail.
Step 4: Reserve a clean headline zone at the top for: {{headline}}. If no headline provided, leave this zone blank (solid color or gradient fill only).
Step 5: Reserve a subtitle zone for: {{subtitle}}. If no subtitle provided, leave blank.
Step 6: Create clean selling-point block areas for: {{selling_points}}. Each point should have its own clean zone. If no points provided, leave these as blank structural blocks.
Step 7: Apply Temu-appropriate styling: bold but clean, mobile-optimized proportions, strong product focus, energetic but professional atmosphere.
Step 8: Ensure all product geometry is preserved exactly.

${COMMON_TEXT_RULES}

VISUAL RULES:
- Background: Clean color blocks, subtle gradient, or light texture. No busy scenes.
- Composition: Mobile-first vertical or square layout. Product takes 50-70% of visual weight.
- Headline zone: Top area, large clean space, high contrast background.
- Selling-point blocks: Clean rectangular or rounded zones, evenly spaced.
- Colors: Bold accent colors (red, orange, blue) allowed for blocks, but product colors must remain accurate.
- Lighting: Bright commercial lighting that enhances product appeal.
- Style: Temu marketplace promotional aesthetic — energetic, clean, direct.
- {{free_description}}

${COMMON_QUALITY_CHECK}`,
  negativePrompt: `${COMMON_NEGATIVE_BASE}, busy background, cluttered composition, people, hands, fake text, fake numbers, fake prices, watermark, cartoon, illustration, 3D toy render, deformation, incorrect geometry, extra parts, missing holes, changed structure, messy layout, unprofessional design`,
  sortOrder: 2,
  enabled: true,
};

// ─── Template 3: Temu Feature Explanation Image ─────────────────────

const TEMPLATE_03: PromptTemplate = {
  id: "temu_feature_explanation",
  name: "Temu 功能卖点说明图模版",
  description: "功能卖点说明图，突出关键优势，允许标题和卖点区块，但不生成真实文字。",
  tags: {
    platformTags: ["Temu"],
    productTags: ["五金", "刀具", "机械件", "紧固件"],
    templateTypeTags: ["卖点图", "信息图"],
  },
  variables: [
    {
      key: "headline",
      label: "主标题（英文）",
      type: "text",
      placeholder: "例如：Precision Engineered",
      required: false,
    },
    {
      key: "feature_1",
      label: "功能卖点 1（英文）",
      type: "text",
      placeholder: "例如：Hardened Steel Construction",
      required: false,
    },
    {
      key: "feature_2",
      label: "功能卖点 2（英文）",
      type: "text",
      placeholder: "例如：Precision CNC Machined",
      required: false,
    },
    {
      key: "feature_3",
      label: "功能卖点 3（英文）",
      type: "text",
      placeholder: "例如：Corrosion Resistant Finish",
      required: false,
    },
    {
      key: "text_language",
      label: "文字语言",
      type: "select",
      options: ["English", "中文", "No text"],
      defaultValue: "English",
      required: false,
    },
    {
      key: "free_description",
      label: "补充描述（可选）",
      type: "textarea",
      placeholder: "例如：需要突出产品的哪些具体功能或优势...",
      required: false,
    },
  ],
  templatePrompt: `${COMMON_ROLE}

TASK:
Generate a Temu-style feature explanation image that visually communicates product advantages. The layout includes: a headline area, the main product, and 2-4 clean callout blocks pointing to key features or benefits. Product remains the absolute center of attention.

${COMMON_IRON_RULES}

EXECUTION PROCESS:
Step 1: Analyze the product reference image. Identify the most visually compelling features: edges, threads, surface finish, structural strength, precision details.
Step 2: Create a clean informational layout. The product occupies the center or dominant portion.
Step 3: Add a headline zone at top for: {{headline}}. Leave blank if not provided.
Step 4: Create 3 feature callout zones for: {{feature_1}}, {{feature_2}}, {{feature_3}}. Each zone should be a clean block with structural space for text. If no text provided, leave as blank clean blocks.
Step 5: Use subtle connecting lines or clean geometric markers (NOT fake arrows with text) to relate callouts to product areas where possible.
Step 6: Ensure the background supports readability: light, clean, possibly with very subtle gradient.
Step 7: Preserve all product geometry exactly. Enhance material appearance with professional lighting.

${COMMON_TEXT_RULES}

VISUAL RULES:
- Background: Light, clean, subtle gradient or solid color. No distracting elements.
- Composition: Product is the hero element (40-60% of frame). Callout blocks arranged around it in balanced layout.
- Callout blocks: Clean rectangles or rounded cards with ample whitespace. No fake text inside.
- Connecting elements: If used, must be clean geometric lines only, not fake labels.
- Colors: Product colors accurate. Accent colors for blocks should complement, not clash.
- Lighting: Bright commercial lighting revealing material quality.
- Style: Clean infographic-meets-product-photography aesthetic.
- {{free_description}}

${COMMON_QUALITY_CHECK}`,
  negativePrompt: `${COMMON_NEGATIVE_BASE}, busy background, cluttered layout, fake arrows with text, fake labels, fake callouts, people, hands, watermark, cartoon, illustration, 3D toy render, deformation, incorrect geometry, extra parts, missing holes, changed structure`,
  sortOrder: 3,
  enabled: true,
};

// ─── Template 4: Multi-SKU Lineup Image ─────────────────────────────

const TEMPLATE_04: PromptTemplate = {
  id: "multi_sku_lineup",
  name: "多规格组合图模版",
  description: "多个规格或变体产品整齐排列展示，适合展示尺寸系列或颜色系列。",
  tags: {
    platformTags: ["Temu", "Amazon", "Ozon", "SHEIN"],
    productTags: ["五金", "刀具", "机械件", "紧固件"],
    templateTypeTags: ["组合图"],
  },
  variables: [
    {
      key: "headline",
      label: "标题（英文）",
      type: "text",
      placeholder: "例如：Multiple Sizes Available",
      required: false,
    },
    {
      key: "text_language",
      label: "文字语言",
      type: "select",
      options: ["English", "中文", "No text"],
      defaultValue: "English",
      required: false,
    },
    {
      key: "free_description",
      label: "补充描述（可选）",
      type: "textarea",
      placeholder: "例如：需要展示3个不同尺寸、从左到右排列...",
      required: false,
    },
  ],
  templatePrompt: `${COMMON_ROLE}

TASK:
Generate a multi-SKU e-commerce lineup image. Arrange multiple variants of the product in a clean, organized row or grid. Show different sizes, lengths, or configurations clearly. The composition must make it easy for shoppers to compare options at a glance.

${COMMON_IRON_RULES}

EXECUTION PROCESS:
Step 1: Analyze the product reference image. Determine the base product form.
Step 2: Create a clean grid or row layout with equal spacing between each variant.
Step 3: Generate 3-6 product variants showing logical size progression or type variation. Each variant must maintain the exact same structural proportions relative to its size — do NOT invent product types not present in the reference.
Step 4: Apply consistent lighting and shadow direction across all variants for cohesion.
Step 5: Add subtle size comparison cues (clean spacing, optional alignment guides) but NO fake dimension labels.
Step 6: Reserve a headline zone for: {{headline}}. Leave blank if not provided.
Step 7: Ensure all variants are equally sharp and well-lit.

${COMMON_TEXT_RULES}

VISUAL RULES:
- Background: Clean white, light gray, or very subtle gradient. Uniform across entire image.
- Composition: Horizontal row (preferred) or 2x2/2x3 grid. Equal spacing. Balanced visual weight.
- Alignment: All products aligned on a consistent baseline. Consistent shadow direction.
- Size relationship: Variants must show realistic relative proportions. Do NOT make all variants the same size.
- Lighting: Uniform lighting across all items. No item should be brighter or darker than others.
- Style: Clean catalog lineup. Professional, organized, easy to compare.
- {{free_description}}

${COMMON_QUALITY_CHECK}`,
  negativePrompt: `${COMMON_NEGATIVE_BASE}, fake size labels, fake dimension numbers, fake measurement text, busy background, cluttered arrangement, uneven spacing, mismatched lighting, people, hands, watermark, cartoon, illustration, 3D toy render, deformation, incorrect geometry, extra parts, missing holes, changed structure, invented product types`,
  sortOrder: 4,
  enabled: true,
};

// ─── Template 5: Detail Magnifier Image ─────────────────────────────

const TEMPLATE_05: PromptTemplate = {
  id: "detail_magnifier",
  name: "局部放大说明图模版",
  description: "主产品 + 局部放大区域，展示关键细节如螺纹、刃口、孔位、槽型。",
  tags: {
    platformTags: ["Temu", "Amazon", "Ozon", "SHEIN"],
    productTags: ["五金", "刀具", "机械件", "紧固件"],
    templateTypeTags: ["卖点图", "信息图"],
  },
  variables: [
    {
      key: "headline",
      label: "标题（英文）",
      type: "text",
      placeholder: "例如：Precision Detail Close-up",
      required: false,
    },
    {
      key: "detail_focus",
      label: "放大重点说明",
      type: "select",
      options: ["Thread detail", "Cutting edge", "Hole/precision", "Surface finish", "Groove/slot", "Connection point", "Other"],
      defaultValue: "Thread detail",
      required: false,
    },
    {
      key: "text_language",
      label: "文字语言",
      type: "select",
      options: ["English", "中文", "No text"],
      defaultValue: "No text",
      required: false,
    },
    {
      key: "free_description",
      label: "补充描述（可选）",
      type: "textarea",
      placeholder: "例如：需要放大展示螺纹的精度...",
      required: false,
    },
  ],
  templatePrompt: `${COMMON_ROLE}

TASK:
Generate a detail magnifier e-commerce image. Show the main product together with one or two enlarged detail inset areas that highlight critical features. This template emphasizes quality and precision by letting shoppers see what matters up close.

${COMMON_IRON_RULES}

EXECUTION PROCESS:
Step 1: Analyze the product reference image. Identify the most compelling detail to magnify based on: {{detail_focus}}.
Step 2: Compose the main product at a comfortable size (typically 60-70% of frame) showing the full product.
Step 3: Create 1-2 circular or rounded-rect magnifier insets positioned near the detail area. Use clean geometric frames (thin border, subtle shadow) — NOT fake annotation labels.
Step 4: The magnified view must show the EXACT same detail from the main product, not a different version. Scale up the detail area with enhanced sharpness and clarity.
Step 5: Add subtle visual connection between the main product detail area and the magnifier (thin clean line, soft highlight circle) — purely visual, no fake text.
Step 6: Reserve a headline zone for: {{headline}}. Leave blank if not provided.
Step 7: Ensure both main product and magnified details have consistent lighting and color accuracy.

${COMMON_TEXT_RULES}

VISUAL RULES:
- Background: Clean white or light gray. No distractions.
- Composition: Main product dominant, magnifier insets placed strategically (typically right side or bottom-right).
- Magnifier frames: Clean thin borders, subtle drop shadow, rounded corners or circular. Professional catalog style.
- Connection: Optional subtle line or highlight area linking detail to magnifier. No fake labels.
- Detail accuracy: Magnified area must be geometrically identical to the corresponding area on the main product.
- Lighting: Consistent across main product and magnified views.
- Style: Technical product photography with detail enhancement.
- {{free_description}}

${COMMON_QUALITY_CHECK}`,
  negativePrompt: `${COMMON_NEGATIVE_BASE}, fake labels, fake annotations, fake arrows with text, fake callouts, busy background, people, hands, watermark, cartoon, illustration, 3D toy render, deformation, incorrect geometry in magnified view, extra parts, missing holes, changed structure, mismatched detail between main and magnified`,
  sortOrder: 5,
  enabled: true,
};

// ─── Template 6: Compatible Tools Image ─────────────────────────────

const TEMPLATE_06: PromptTemplate = {
  id: "compatible_tools",
  name: "适配工具图模版",
  description: "产品与适配工具或设备一起展示，帮助买家理解使用场景和兼容性。",
  tags: {
    platformTags: ["Temu", "Amazon", "Ozon", "SHEIN"],
    productTags: ["五金", "刀具", "机械件", "紧固件"],
    templateTypeTags: ["场景图"],
  },
  variables: [
    {
      key: "headline",
      label: "标题（英文）",
      type: "text",
      placeholder: "例如：Compatible With Standard Tools",
      required: false,
    },
    {
      key: "tool_type",
      label: "适配工具类型",
      type: "select",
      options: ["Drill", "Screwdriver", "Wrench", "Pneumatic tool", "CNC machine", "Hand tool set", "Other"],
      defaultValue: "Hand tool set",
      required: false,
    },
    {
      key: "text_language",
      label: "文字语言",
      type: "select",
      options: ["English", "中文", "No text"],
      defaultValue: "No text",
      required: false,
    },
    {
      key: "free_description",
      label: "补充描述（可选）",
      type: "textarea",
      placeholder: "例如：需要展示产品与电钻的配合使用...",
      required: false,
    },
  ],
  templatePrompt: `${COMMON_ROLE}

TASK:
Generate a compatible tools e-commerce image. Show the main product together with relevant tools or equipment to communicate usability and compatibility. The product must remain the primary focus; tools are supporting elements only.

${COMMON_IRON_RULES}

EXECUTION PROCESS:
Step 1: Analyze the product reference image. Determine what type of tool or equipment it naturally pairs with based on: {{tool_type}}.
Step 2: Place the main product as the dominant element (50-60% of visual weight). Position it prominently in center or foreground.
Step 3: Add clean visual panels or subtle background elements showing the compatible tool/equipment. Tools should be clearly recognizable but secondary in visual hierarchy.
Step 4: Do NOT show the product actually being used (no hands, no action shots). Show the product and tool as clean static objects.
Step 5: Create a clean compatibility context: tools arranged neatly, professional workshop or clean surface background.
Step 6: Reserve a headline zone for: {{headline}}. Leave blank if not provided.
Step 7: Ensure tool representations are generic and clean — do NOT generate fake brand names or model numbers on tools.

${COMMON_TEXT_RULES}

VISUAL RULES:
- Background: Clean workshop surface, organized tool area, or neutral gradient. Not busy.
- Composition: Product dominant, tools secondary and arranged neatly around or behind.
- Tool styling: Clean, generic tools without brand markings. Well-maintained appearance.
- Lighting: Professional product lighting. Product slightly brighter/more prominent than tools.
- Color: Product colors accurate. Tool colors should be neutral (silver, black, blue-gray).
- Style: Clean static product arrangement, not action photography.
- {{free_description}}

${COMMON_QUALITY_CHECK}`,
  negativePrompt: `${COMMON_NEGATIVE_BASE}, fake brand names on tools, fake model numbers, hands using tools, action shots, busy workshop, cluttered tool area, people, watermark, cartoon, illustration, 3D toy render, deformation, incorrect geometry, extra parts, missing holes, changed structure`,
  sortOrder: 6,
  enabled: true,
};

// ─── Template 7: Advantage Comparison Image ─────────────────────────

const TEMPLATE_07: PromptTemplate = {
  id: "advantage_comparison",
  name: "优势对比图模版",
  description: "电商风格对比图，突出产品优势，如材质、精度、耐用性等。",
  tags: {
    platformTags: ["Temu", "Amazon", "Ozon", "SHEIN"],
    productTags: ["五金", "刀具", "机械件", "紧固件"],
    templateTypeTags: ["对比图"],
  },
  variables: [
    {
      key: "headline",
      label: "标题（英文）",
      type: "text",
      placeholder: "例如：Why Choose Our Product",
      required: false,
    },
    {
      key: "comparison_aspect",
      label: "对比维度",
      type: "select",
      options: ["Material quality", "Precision", "Durability", "Surface finish", "Structural strength", "Overall quality"],
      defaultValue: "Overall quality",
      required: false,
    },
    {
      key: "text_language",
      label: "文字语言",
      type: "select",
      options: ["English", "中文", "No text"],
      defaultValue: "No text",
      required: false,
    },
    {
      key: "free_description",
      label: "补充描述（可选）",
      type: "textarea",
      placeholder: "例如：需要对比展示产品的精度优势...",
      required: false,
    },
  ],
  templatePrompt: `${COMMON_ROLE}

TASK:
Generate an e-commerce advantage comparison image. Compare the product against a simple generic alternative or abstract baseline to highlight superior quality. The comparison must be visual and intuitive — showing the difference in material finish, precision, structural quality, or overall craftsmanship.

${COMMON_IRON_RULES}

EXECUTION PROCESS:
Step 1: Analyze the product reference image. Identify its strongest visual advantage based on: {{comparison_aspect}}.
Step 2: Create a split or side-by-side comparison layout. Left side (or top): a simple, generic, lower-quality representation of a similar item — plain, basic, unremarkable. Right side (or bottom): the actual product from reference, shown with superior finish, precision, and detail.
Step 3: The "generic" side must NOT be a fake competitor product. Use an abstract, simplified, or plain version that visually communicates "basic/standard" without specific brand or fake details.
Step 4: Use subtle visual cues to emphasize the difference: better lighting on the product side, cleaner background, sharper focus, or a subtle quality gradient.
Step 5: Do NOT use fake text labels like "BEFORE/AFTER" or fake checkmark icons with text. Purely visual comparison.
Step 6: Reserve a headline zone for: {{headline}}. Leave blank if not provided.
Step 7: Ensure the actual product side preserves exact geometry from reference.

${COMMON_TEXT_RULES}

VISUAL RULES:
- Layout: Split screen (vertical or horizontal) or side-by-side arrangement. Clear visual separation.
- Generic side: Plain, simplified, lower visual quality. Not a specific fake product. Communicates "standard/basic" visually.
- Product side: Full detail, accurate geometry, enhanced material appearance. The hero side.
- Comparison cues: Lighting difference, sharpness difference, background contrast — purely visual.
- No fake labels: No text banners, no checkmark icons with text, no fake ratings.
- Background: Clean and consistent or subtly differentiated between sides.
- Style: Professional product comparison photography.
- {{free_description}}

${COMMON_QUALITY_CHECK}`,
  negativePrompt: `${COMMON_NEGATIVE_BASE}, fake before/after labels, fake checkmarks with text, fake ratings, fake competitor products with brand names, busy background, people, hands, watermark, cartoon, illustration, 3D toy render, deformation, incorrect geometry, extra parts, missing holes, changed structure`,
  sortOrder: 7,
  enabled: true,
};

// ─── Template 8: Specification Info Image ───────────────────────────

const TEMPLATE_08: PromptTemplate = {
  id: "specification_info",
  name: "规格信息图模版",
  description: "信息卡片版式，展示比例和结构，不做真实尺寸数字标注。",
  tags: {
    platformTags: ["Temu", "Amazon", "Ozon", "SHEIN"],
    productTags: ["五金", "刀具", "机械件", "紧固件"],
    templateTypeTags: ["信息图"],
  },
  variables: [
    {
      key: "headline",
      label: "标题（英文）",
      type: "text",
      placeholder: "例如：Product Specifications",
      required: false,
    },
    {
      key: "spec_fields",
      label: "规格字段（英文，每行一个）",
      type: "textarea",
      placeholder: "例如：\nMaterial: [user will fill]\nSize: [user will fill]\nFinish: [user will fill]",
      required: false,
    },
    {
      key: "text_language",
      label: "文字语言",
      type: "select",
      options: ["English", "中文", "No text"],
      defaultValue: "No text",
      required: false,
    },
    {
      key: "free_description",
      label: "补充描述（可选）",
      type: "textarea",
      placeholder: "例如：需要展示哪些规格信息...",
      required: false,
    },
  ],
  templatePrompt: `${COMMON_ROLE}

TASK:
Generate a specification-style e-commerce information image. Show the product with its proportions, structure, and detail zones in a clean information-card composition. This template provides structural specification layout WITHOUT generating fake numeric dimensions or measurement labels.

${COMMON_IRON_RULES}

IMPORTANT: Do NOT generate any numeric dimensions, measurement labels, technical annotation text, or fake parameters. Only show blank specification fields or structural zones.

EXECUTION PROCESS:
Step 1: Analyze the product reference image. Understand its overall shape, key structural zones, and proportional relationships.
Step 2: Place the product in the composition (typically left side or center-left) at a clear, well-lit angle that shows overall form.
Step 3: Create 4-6 clean specification field blocks on the right side or below the product. These are blank rectangular zones with clean borders — ready for user to add real specifications later.
Step 4: Optionally show a simple proportional diagram or structural outline (thin line drawing style) of the product to communicate shape without fake numbers.
Step 5: Reserve a headline zone for: {{headline}}. Leave blank if not provided.
Step 6: The specification blocks correspond to: {{spec_fields}}. If provided, these inform the BLOCK LABELS ONLY (not the values). If not provided, use generic blank blocks.
Step 7: Ensure the product image is accurate and the layout is clean and professional.

${COMMON_TEXT_RULES}

VISUAL RULES:
- Background: Clean white or very light gray.
- Composition: Product on left (or top), specification blocks on right (or bottom). Balanced whitespace.
- Specification blocks: Clean rectangles with thin borders, ample internal padding. Blank inside (no fake numbers).
- Block labels: If user provides field names, show ONLY those names. No fabricated values.
- Proportional diagram (optional): Thin line outline showing product shape, no dimension numbers.
- Style: Technical datasheet aesthetic meets product photography. Clean, organized, professional.
- {{free_description}}

${COMMON_QUALITY_CHECK}`,
  negativePrompt: `${COMMON_NEGATIVE_BASE}, fake dimension numbers, fake measurement labels, fake technical annotations, fake parameter text, fake size numbers, busy background, cluttered layout, people, hands, watermark, cartoon, illustration, 3D toy render, deformation, incorrect geometry, extra parts, missing holes, changed structure`,
  sortOrder: 8,
  enabled: true,
};

// ─── Template 9: Promotional Sales Image ────────────────────────────

const TEMPLATE_09: PromptTemplate = {
  id: "promo_sales",
  name: "促销销售图模版",
  description: "高冲击力促销构图，适合 Temu 风格促销商品图，强调购买冲动。",
  tags: {
    platformTags: ["Temu", "Amazon", "Ozon", "SHEIN"],
    productTags: ["五金", "刀具", "机械件", "紧固件"],
    templateTypeTags: ["促销图"],
  },
  variables: [
    {
      key: "headline",
      label: "促销标题（英文）",
      type: "text",
      placeholder: "例如：Limited Time Offer",
      required: false,
    },
    {
      key: "subtitle",
      label: "副标题（英文）",
      type: "text",
      placeholder: "例如：Premium Quality at Best Price",
      required: false,
    },
    {
      key: "selling_points",
      label: "卖点文字（英文，每行一个）",
      type: "textarea",
      placeholder: "例如：\nTop Grade Material\nFactory Direct\nFast Shipping",
      required: false,
    },
    {
      key: "text_language",
      label: "文字语言",
      type: "select",
      options: ["English", "中文", "No text"],
      defaultValue: "English",
      required: false,
    },
    {
      key: "free_description",
      label: "补充描述（可选）",
      type: "textarea",
      placeholder: "例如：需要营造什么样的促销氛围...",
      required: false,
    },
  ],
  templatePrompt: `${COMMON_ROLE}

TASK:
Generate a high-impact e-commerce promotional sales image. Bold composition, strong product presence, clean selling-point blocks, energetic marketplace style. Design to create shopping impulse while maintaining product accuracy and professional appearance.

${COMMON_IRON_RULES}

EXECUTION PROCESS:
Step 1: Analyze the product reference image. Identify visual hooks: material shine, precision edges, robust structure.
Step 2: Create a bold promotional composition with dynamic background elements: color blocks, subtle geometric patterns, or clean gradient bursts. Energy without chaos.
Step 3: Place the product as the dominant hero element, large and well-lit. Consider a slight dynamic angle for energy.
Step 4: Add a prominent headline zone for: {{headline}}. Large clean area. Leave blank if not provided.
Step 5: Add a subtitle zone for: {{subtitle}}. Leave blank if not provided.
Step 6: Create 2-4 clean selling-point badge/block areas for: {{selling_points}}. Each is a clean structural zone. Leave blank if not provided.
Step 7: Apply energetic but tasteful color accents: red, orange, or vibrant blue accents on blocks. Product colors remain accurate.
Step 8: Ensure the composition feels urgent and exciting but not cheap or spammy.

${COMMON_TEXT_RULES}

VISUAL RULES:
- Background: Bold color blocks, clean geometric shapes, or energetic gradient. NOT busy textures.
- Composition: Product is the hero (40-50% of frame). Headline and badges fill remaining space dynamically.
- Headline zone: Large, high contrast, top or upper area.
- Selling-point badges: Clean rounded rectangles or geometric shapes, evenly spaced.
- Colors: Bold accent colors allowed for UI elements. Product must keep accurate colors.
- Lighting: Bright, energetic commercial lighting with crisp highlights.
- Style: Modern marketplace promotional design — clean, bold, conversion-optimized.
- Do NOT generate fake prices, fake countdown timers, fake "SALE" percentages, or fake urgency text.
- {{free_description}}

${COMMON_QUALITY_CHECK}`,
  negativePrompt: `${COMMON_NEGATIVE_BASE}, fake prices, fake sale percentages, fake countdown timers, fake urgency text, busy chaotic background, cluttered layout, people, hands, watermark, cartoon, illustration, 3D toy render, deformation, incorrect geometry, extra parts, missing holes, changed structure`,
  sortOrder: 9,
  enabled: true,
};

// ─── Template 10: Application Scene Image ───────────────────────────

const TEMPLATE_10: PromptTemplate = {
  id: "application_scene",
  name: "应用场景图模版",
  description: "产品在真实应用场景中展示，场景作为模版变量可选（机加工/装配/维修/仓储）。",
  tags: {
    platformTags: ["Temu", "Amazon", "Ozon", "SHEIN"],
    productTags: ["五金", "刀具", "机械件", "紧固件"],
    templateTypeTags: ["场景图"],
  },
  variables: [
    {
      key: "scene_style",
      label: "应用场景",
      type: "select",
      options: ["CNC machining", "Assembly line", "Maintenance repair", "Warehouse storage", "Workshop bench", "Construction site"],
      defaultValue: "Workshop bench",
      required: false,
    },
    {
      key: "headline",
      label: "标题（英文）",
      type: "text",
      placeholder: "例如：Built for Real-World Applications",
      required: false,
    },
    {
      key: "text_language",
      label: "文字语言",
      type: "select",
      options: ["English", "中文", "No text"],
      defaultValue: "No text",
      required: false,
    },
    {
      key: "free_description",
      label: "补充描述（可选）",
      type: "textarea",
      placeholder: "例如：需要在CNC加工场景中展示产品...",
      required: false,
    },
  ],
  templatePrompt: `${COMMON_ROLE}

TASK:
Generate an application-oriented e-commerce product image. Show the product in a realistic industrial scene to communicate real-world usage and reliability. The product must remain the clear main focus; the scene provides context and credibility.

${COMMON_IRON_RULES}

EXECUTION PROCESS:
Step 1: Analyze the product reference image. Understand its form and likely application context.
Step 2: Create a {{scene_style}} environment as the background/context:
   - CNC machining: Clean machine tool setting, machining equipment subtly in background, professional manufacturing atmosphere.
   - Assembly line: Organized assembly area, parts and tools neatly arranged, clean industrial setting.
   - Maintenance repair: Organized tool area, spare parts, practical service environment, clean industrial setting.
   - Warehouse storage: Clean industrial warehouse or supply shelf context, organized inventory atmosphere.
   - Workshop bench: Clean workbench with tools, professional but not cluttered.
   - Construction site: Clean construction context with relevant equipment, organized and professional.
Step 3: Place the product as the main focus in the foreground or center. It should be clearly visible and well-lit.
Step 4: The scene elements must be secondary and slightly muted (softer focus, lower contrast) compared to the product. Use depth of field to separate product from background.
Step 5: Do NOT show people, hands, or faces. Show only the environment and the product.
Step 6: Do NOT invent false assembly structures, fake machinery details, or incorrect usage contexts.
Step 7: Reserve a headline zone for: {{headline}}. Leave blank if not provided.
Step 8: Ensure lighting is consistent between product and scene. Product should have professional product lighting even within the scene.

${COMMON_TEXT_RULES}

VISUAL RULES:
- Background: Realistic industrial scene matching {{scene_style}}. Clean and professional, not dirty or chaotic.
- Composition: Product in foreground/center (40-50% of frame). Scene elements provide depth and context.
- Depth of field: Product sharp and prominent. Background slightly softer to create separation.
- Scene accuracy: Environment must look realistic and appropriate for the product type. No fake machinery details.
- Lighting: Professional product lighting on the product. Ambient environmental lighting in background. Consistent direction.
- Colors: Product colors accurate. Scene colors should be natural industrial tones (grays, metallics, muted colors).
- Style: Professional industrial product photography in context. Credible and trustworthy.
- {{free_description}}

${COMMON_QUALITY_CHECK}`,
  negativePrompt: `${COMMON_NEGATIVE_BASE}, people, hands, human face, fake machinery details, fake equipment brands, cluttered dirty scene, unrealistic environment, busy background overwhelming product, watermark, cartoon, illustration, 3D toy render, deformation, incorrect geometry, extra parts, missing holes, changed structure`,
  sortOrder: 10,
  enabled: true,
};

// ─── Template Registry ──────────────────────────────────────────────

export const ALL_TEMPLATES: PromptTemplate[] = [
  TEMPLATE_01,
  TEMPLATE_02,
  TEMPLATE_03,
  TEMPLATE_04,
  TEMPLATE_05,
  TEMPLATE_06,
  TEMPLATE_07,
  TEMPLATE_08,
  TEMPLATE_09,
  TEMPLATE_10,
];

export function getAllTemplates(): PromptTemplate[] {
  return ALL_TEMPLATES.filter((t) => t.enabled).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getTemplateById(id: string): PromptTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id && t.enabled);
}

// ─── Filter options for UI ──────────────────────────────────────────

export const PLATFORM_FILTER_OPTIONS = [
  { id: "all", label: "全部平台" },
  { id: "Temu", label: "Temu" },
  { id: "Amazon", label: "Amazon" },
  { id: "Ozon", label: "Ozon" },
  { id: "SHEIN", label: "SHEIN" },
];

export const PRODUCT_FILTER_OPTIONS = [
  { id: "all", label: "全部品类" },
  { id: "五金", label: "五金" },
  { id: "刀具", label: "刀具" },
  { id: "机械件", label: "机械件" },
  { id: "紧固件", label: "紧固件" },
];

export const TEMPLATE_TYPE_FILTER_OPTIONS = [
  { id: "all", label: "全部类型" },
  { id: "白底主图", label: "白底主图" },
  { id: "卖点图", label: "卖点图" },
  { id: "信息图", label: "信息图" },
  { id: "组合图", label: "组合图" },
  { id: "对比图", label: "对比图" },
  { id: "促销图", label: "促销图" },
  { id: "场景图", label: "场景图" },
];

// ─── Filter logic ───────────────────────────────────────────────────

export function filterTemplates(
  templates: PromptTemplate[],
  filters: TemplateFilterState
): PromptTemplate[] {
  return templates.filter((t) => {
    if (filters.platformTag && filters.platformTag !== "all") {
      if (!t.tags.platformTags.includes(filters.platformTag)) return false;
    }
    if (filters.productTag && filters.productTag !== "all") {
      if (!t.tags.productTags.includes(filters.productTag)) return false;
    }
    if (filters.templateTypeTag && filters.templateTypeTag !== "all") {
      if (!t.tags.templateTypeTags.includes(filters.templateTypeTag)) return false;
    }
    return true;
  });
}
