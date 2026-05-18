import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import type {
  ProductAnalysis,
  CreativePlan,
  ImageSetPlan,
  LayoutOverlay,
  CopySource,
  TextBlockPosition,
  ColorTheme,
  VisualDensity,
} from "../../../../ai-image/v2/types";
import { getTemplateById } from "@/lib/plan-templates/store";

interface PlanRequest {
  mode: "single" | "set";
  rawProductImageUrl?: string;
  productImageUrl?: string; // backward compat
  productReferenceImageUrl?: string;
  styleReferenceUrls?: string[];
  userGoal?: string;
  goal?: string; // backward compat
  selectedTemplateId?: string;
  basePlan?: CreativePlan;
}

const LLM_API_URL = process.env.LLM_API_URL || "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
const LLM_MODEL = process.env.LLM_MODEL || "doubao-seed-2-0-lite-260215";

// 备用 vision 模型列表（按推荐顺序）
const FALLBACK_VISION_MODELS = [
  "doubao-seed-2-0-lite-260215",
  "doubao-1-5-vision-pro-250328",
  "doubao-1-5-vision-lite-250315",
  "doubao-vision-lite-32k-241015",
  "doubao-seed-1-6-250615",
  "doubao-seed-1-6-flash-250615",
  "doubao-1-5-thinking-pro-m-250428",
];

// ==================== Image to Base64 ====================

async function imageUrlToBase64(imageUrl: string): Promise<string | null> {
  try {
    if (imageUrl.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", imageUrl);
      const buffer = await readFile(filePath);
      const ext = path.extname(imageUrl).toLowerCase();
      const mimeType =
        ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".webp"
              ? "image/webp"
              : "image/jpeg";
      return `data:${mimeType};base64,${buffer.toString("base64")}`;
    }
    if (imageUrl.startsWith("http")) {
      const res = await fetch(imageUrl);
      if (!res.ok) return null;
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") || "image/jpeg";
      return `data:${contentType};base64,${buffer.toString("base64")}`;
    }
    return null;
  } catch (e) {
    console.error("[imageUrlToBase64] error:", e);
    return null;
  }
}

// ==================== Copy Source Detection ====================

function detectCopySource(userGoal: string): CopySource {
  const trimmed = userGoal.trim();
  const hasQuotedEnglish = /"[A-Z][A-Z\s]{2,30}"/.test(trimmed);
  const isMostlyEnglish = /^[\x00-\x7F]{10,}$/.test(trimmed) && trimmed.length > 10;
  const hasUppercaseSellingPoints = /\b[A-Z]{3,15}(\s+[A-Z]{3,15}){0,3}\b/.test(trimmed);

  if (hasQuotedEnglish || (isMostlyEnglish && hasUppercaseSellingPoints)) {
    const explicitLabelPatterns = [
      /headline\s*[:：]\s*"?([A-Z][A-Za-z\s]+)"?/i,
      /title\s*[:：]\s*"?([A-Z][A-Za-z\s]+)"?/i,
      /selling points?\s*[:：]/i,
      /卖点\s*[:：]/i,
      /标题\s*[:：]/i,
    ];
    const looksExplicit = explicitLabelPatterns.some((p) => p.test(trimmed));
    if (looksExplicit) return "user_exact";
  }

  const hasChinese = /[\u4e00-\u9fff]/.test(trimmed);
  if (hasChinese) return "ai_rewritten";

  return "ai_suggested";
}

// ==================== Layout Overlay Builder ====================

function buildLayoutOverlay(
  headline: string,
  subtitle: string | undefined,
  sellingPoints: string[],
  layoutDirection: string,
  imageType: string
): LayoutOverlay {
  let layoutType: LayoutOverlay["layoutType"] = "center_product_surrounding_points";

  const lowerDir = layoutDirection.toLowerCase();
  const lowerType = imageType.toLowerCase();

  if (lowerType.includes("comparison") || lowerDir.includes("comparison") || lowerDir.includes("对比")) {
    layoutType = "comparison_split";
  } else if (lowerType.includes("detail") || lowerDir.includes("detail") || lowerDir.includes("magnifier") || lowerDir.includes("放大")) {
    layoutType = "detail_magnifier";
  } else if (lowerType.includes("promo") || lowerType.includes("banner") || lowerDir.includes("promo") || lowerDir.includes("促销")) {
    layoutType = "promo_banner";
  } else if (lowerType.includes("spec") || lowerDir.includes("spec") || lowerDir.includes("规格")) {
    layoutType = "clean_spec_card";
  } else if (lowerDir.includes("top") && lowerDir.includes("right")) {
    layoutType = "top_headline_right_points";
  } else if (lowerDir.includes("left") && lowerDir.includes("bottom")) {
    layoutType = "left_headline_bottom_points";
  }

  const textBlocks: LayoutOverlay["textBlocks"] = [];
  let priority = 1;

  textBlocks.push({
    id: `tb-headline`,
    text: headline,
    role: "headline",
    position: "top-left",
    priority: priority++,
  });

  if (subtitle) {
    textBlocks.push({
      id: `tb-subtitle`,
      text: subtitle,
      role: "subtitle",
      position: "top-left",
      priority: priority++,
    });
  }

  sellingPoints.forEach((sp, i) => {
    const positions: TextBlockPosition[] = ["right", "left", "bottom", "top-right"];
    textBlocks.push({
      id: `tb-sp-${i}`,
      text: sp,
      role: "selling_point",
      position: positions[i % positions.length],
      priority: priority++,
    });
  });

  const wantsDark = lowerDir.includes("dark") || lowerDir.includes("黑底") || lowerDir.includes("charcoal");
  const wantsWhite = lowerDir.includes("white") || lowerDir.includes("白底") || lowerDir.includes("pure white");

  let colorTheme: ColorTheme;
  if (wantsDark) {
    colorTheme = {
      primary: "#1a1a2e",
      secondary: "#16213e",
      background: "#0f0f1a",
      text: "#ffffff",
      accent: "#ff6b35",
    };
  } else if (wantsWhite) {
    colorTheme = {
      primary: "#2563eb",
      secondary: "#64748b",
      background: "#ffffff",
      text: "#1e293b",
      accent: "#f59e0b",
    };
  } else {
    colorTheme = {
      primary: "#1e40af",
      secondary: "#64748b",
      background: "#f8fafc",
      text: "#1e293b",
      accent: "#dc2626",
    };
  }

  let visualDensity: VisualDensity = "balanced";
  if (lowerType.includes("hero") || lowerType.includes("主图")) {
    visualDensity = "clean";
  } else if (lowerType.includes("spec") || lowerType.includes("comparison")) {
    visualDensity = "high_information";
  }

  return {
    layoutType,
    headline,
    subtitle,
    sellingPoints,
    textLanguage: "English",
    textBlocks,
    colorTheme,
    visualDensity,
  };
}

// ==================== Prompt Builders ====================

function buildPlanSummaryPrompt(plan: CreativePlan): string {
  const analysis = plan.productAnalysis || {
    productName: plan.productName,
    productType: "General",
    productSubjectDescription: "Product subject",
    visibleFeatures: ["Main body"],
    structureRisks: ["Preserve original structure"],
    detectedNonProductElements: [],
    isolationInstruction: "Isolate product from background",
  };

  const parts = [
    `=== Creative Plan Summary ===`,
    ``,
    `Plan Name: ${plan.planName}`,
    `Image Type: ${plan.imageType}`,
    `Template ID: ${plan.templateId}`,
    ``,
    `--- Product Analysis ---`,
    `Product Name: ${analysis.productName}`,
    `Product Type: ${analysis.productType}`,
    `Subject Description: ${analysis.productSubjectDescription}`,
    `Visible Features: ${analysis.visibleFeatures.join(", ")}`,
  ];

  if (analysis.materialGuess) {
    parts.push(`Material Guess: ${analysis.materialGuess}`);
  }

  parts.push(
    `Detected Non-Product Elements: ${analysis.detectedNonProductElements.join(", ") || "None"}`,
    `Isolation Instruction: ${analysis.isolationInstruction}`,
    ``,
    `--- Copy ---`,
    `Copy Source: ${plan.copySource}`,
    `Headline: "${plan.headline}"`,
  );

  if (plan.subtitle) parts.push(`Subtitle: "${plan.subtitle}"`);
  parts.push(`Selling Points: ${plan.sellingPoints.map((s) => `"${s}"`).join(", ")}`);

  if (plan.copyNotes && plan.copyNotes.length > 0) {
    parts.push(`Copy Notes: ${plan.copyNotes.join("; ")}`);
  }

  parts.push(
    ``,
    `--- Layout & Visual ---`,
    `Layout Direction: ${plan.layoutDirection}`,
    `Visual Direction: ${plan.visualDirection}`,
    `Color Direction: ${plan.colorDirection}`,
  );

  if (plan.layoutOverlay) {
    parts.push(
      ``,
      `--- Layout Overlay ---`,
      `Layout Type: ${plan.layoutOverlay.layoutType}`,
      `Visual Density: ${plan.layoutOverlay.visualDensity}`,
      `Color Theme:`,
      `  Primary: ${plan.layoutOverlay.colorTheme.primary}`,
      `  Secondary: ${plan.layoutOverlay.colorTheme.secondary}`,
      `  Background: ${plan.layoutOverlay.colorTheme.background}`,
      `  Text: ${plan.layoutOverlay.colorTheme.text}`,
      `  Accent: ${plan.layoutOverlay.colorTheme.accent}`,
      `Text Blocks:`,
      ...plan.layoutOverlay.textBlocks.map(
        (tb) => `  [${tb.role}] "${tb.text}" → ${tb.position} (P${tb.priority})`
      ),
    );
  }

  parts.push(
    ``,
    `--- Structure Preservation ---`,
    ...analysis.structureRisks.map((r) => `- ${r}`),
    ``,
    `--- Risk Warnings ---`,
    ...plan.riskWarnings.map((w) => `- ${w}`),
  );

  return parts.join("\n");
}

function buildImageGenerationPrompt(plan: CreativePlan): string {
  const analysis = plan.productAnalysis;
  const overlay = plan.layoutOverlay;

  const parts = [
    `A high-quality e-commerce product visual for "${plan.productName}".`,
    ``,
    `=== COMMERCIAL COPY (render as decorative e-commerce text blocks) ===`,
    `Headline: "${plan.headline}"`,
  ];

  if (plan.subtitle) parts.push(`Subtitle: "${plan.subtitle}"`);
  parts.push(`Selling Points: ${plan.sellingPoints.map((s) => `"${s}"`).join(", ")}`);
  parts.push(
    ``,
    `TEXT RENDERING STRATEGY:`,
    `- Render ALL text as stylized English words integrated into the image design`,
    `- Text should look like authentic e-commerce commercial typography — bold, clean, and professionally typeset`,
    `- Headline must appear as a large, prominent text element in the composition`,
    `- Selling points must appear as visual badge blocks, tags, or callout cards with text inside`,
    `- Text must be ENGLISH only, short words/phrases, visually confident and commercial`,
    `- Do NOT generate garbled, unreadable, or nonsense text — render real English words that match the copy above`,
    `- Text style should match the image's commercial aesthetic (bold sans-serif for modern, elegant serif for luxury, etc.)`,
    ``,
    `=== VISUAL DIRECTION ===`,
    `${plan.visualDirection}`,
    ``,
    `=== COLOR PALETTE ===`,
    `${plan.colorDirection}`,
    ``,
    `=== COMPOSITION & LAYOUT ===`,
    `${plan.layoutDirection}`,
    ``,
  );

  if (overlay) {
    parts.push(
      `=== LAYOUT OVERLAY INSTRUCTIONS ===`,
      `Layout Type: ${overlay.layoutType}`,
      `Visual Density: ${overlay.visualDensity}`,
      `Color Theme:`,
      `  Primary: ${overlay.colorTheme.primary}`,
      `  Secondary: ${overlay.colorTheme.secondary}`,
      `  Background: ${overlay.colorTheme.background}`,
      `  Text: ${overlay.colorTheme.text}`,
      `  Accent: ${overlay.colorTheme.accent}`,
    );
    if (overlay.textBlocks.length > 0) {
      parts.push(
        `Text Blocks to render ON the image:`,
        ...overlay.textBlocks.map(
          (tb) => `  [${tb.role}] "${tb.text}" → position: ${tb.position}, priority: ${tb.priority}`
        ),
      );
    }
    parts.push(
      ``,
      `DESIGN RULES:`,
      `- Each text block must be rendered as an actual visual element ON the image, not just empty space`,
      `- Use the color theme for text colors, background panels, accent bars, and badge fills`,
      `- Create visual hierarchy: headline largest, subtitle medium, selling points as badge/tag size`,
      `- Add subtle background panels, color blocks, or geometric shapes behind text for readability`,
      `- Match the overall commercial photography style — text should feel like part of the design, not an afterthought`,
      ``,
    );
  }

  if (analysis) {
    parts.push(
      `=== PRODUCT PRESERVATION ===`,
      `Product Type: ${analysis.productType}`,
      `Subject: ${analysis.productSubjectDescription}`,
      `Key Features: ${analysis.visibleFeatures.join(", ")}`,
    );
    if (analysis.materialGuess) {
      parts.push(`Material: ${analysis.materialGuess}`);
    }
    parts.push(
      `Isolation Instruction: ${analysis.isolationInstruction}`,
      ``,
      `=== STRUCTURAL INTEGRITY ===`,
      ...analysis.structureRisks.map((r) => `- ${r}`),
      ``,
    );
  }

  parts.push(
    `=== CONTENT SAFETY ===`,
    ...plan.riskWarnings.filter((w) => !(analysis?.structureRisks || []).includes(w)).map((w) => `- ${w}`),
    ``,
    `=== OUTPUT REQUIREMENTS ===`,
    `- Photorealistic commercial product photography style with STRONG e-commerce visual impact`,
    `- ALL text must be rendered ON the image as integrated design elements (headline, badges, tags, callouts)`,
    `- English text only, real words matching the provided copy, no garbled or nonsense characters`,
    `- No fake logos, fake prices, fake numbers, or fake certification marks`,
    `- No platform logos (Amazon, Temu, etc.)`,
    `- Professional studio quality with crisp edges and accurate product structure`,
    `- Must look like a real e-commerce product listing image, not a plain product photo`,
  );

  return parts.join("\n");
}

// ==================== Kimi System Prompt ====================

function buildSystemPrompt(mode: "single" | "set", templatePrompt?: string): string {
  const baseRules = `
You are an expert AI product image planning assistant for e-commerce. Your job is to analyze a product image and user requirements, then generate structured creative plans for commercial product photography.

CRITICAL RULES:
1. NEVER invent specifications, sizes, material grades, hardness ratings, torque ratings, load capacity, weight, dimensions, warranty details, lifespan, prices, or certifications NOT provided by the user.
2. NEVER generate fake logos, fake prices, fake parameters, or fake certification marks.
3. ALL on-image text must be ENGLISH. Headlines and selling points should be impactful English commercial copy.
4. PRESERVE the product structure: do NOT alter holes, slots, cutting edges, threads, spiral angles, or unique contours visible in the image.
5. If the user writes in Chinese, translate their intent into appropriate English commercial copy. Do NOT translate word-for-word; instead, capture the commercial intent.
6. The uploaded photo may contain hands, fingers, arms, table background, packaging, shadows, and unrelated objects. These are NOT part of the product. The product subject must be isolated.
7. Do NOT treat hands, fingers, arms, table, background clutter, or packaging as product parts.
8. ALL text (headline, subtitle, selling points) MUST be rendered as REAL, READABLE English text ON the generated image — this is an e-commerce visual, not a plain product photo.
9. Text must be clearly legible, professionally typeset, and integrated into the overall design with appropriate background panels, color blocks, or geometric accents.
10. Do NOT generate garbled, nonsense, or unreadable characters — every word must be a real English word.
`;

  const copyRules = `
## COPY GUIDELINES

### Headline Rules
- 3-6 impactful English words, specific to product type and user intent
- AVOID generic phrases like "PREMIUM QUALITY", "BEST CHOICE"
- Each of the 3 plans must have a DISTINCTLY different headline style
- Headline MUST be rendered as large, visible text ON the generated image

### Subtitle Rules
- 6-15 words, creating context and emotional connection
- STRONGLY RECOMMENDED
- Must appear as readable text ON the generated image

### Selling Points Rules
- 3-4 items, 2-5 words each, SPECIFIC and DISTINCT
- Include a MIX of: functional, material/quality, emotional/trust benefits
- Each selling point MUST be rendered as a visual badge/tag/block ON the generated image

### Copy Diversity Requirement
The 3 plans must have fundamentally DIFFERENT copy personalities:
- Plan 1: Bold, direct, action-oriented
- Plan 2: Sophisticated, trust-building, premium feel
- Plan 3: Problem-solving, feature-focused, technical credibility

### On-Image Text Rules (CRITICAL)
- ALL copy (headline, subtitle, selling points) must be rendered as REAL English text ON the image
- Text must be clearly readable, professionally typeset, and integrated into the design
- Use bold sans-serif for modern/energetic styles, elegant serif for premium styles
- Add background panels, color blocks, or geometric shapes behind text for visual impact
- Do NOT leave text areas blank — every text block must be a visible design element
- Do NOT generate garbled, nonsense, or unreadable characters
`;

  const visualRules = `
## VISUAL GUIDELINES

### visualDirection Requirements
Write 2-4 sentences covering: photography style, lighting setup, depth of field, material rendering, atmosphere/mood, camera angle.

### colorDirection Requirements
Write 2-3 sentences covering: primary palette, accent colors, background treatment, color transitions.

### layoutDirection Requirements
Write 2-3 sentences covering: product placement/scale, text zone positions, negative space, visual flow.
- MUST describe where headline text appears (e.g., "large headline arcs above the product")
- MUST describe where selling point badges/tags appear (e.g., "three selling point badges stack vertically on the left")
- MUST include text background treatment (e.g., "text sits on bold color blocks" or "headline on a clean gradient panel")
`;

  const singleFormat = `
You must generate EXACTLY 3 different CreativePlan objects as a JSON array under the key "plans".

Each CreativePlan must have these exact fields:
- id: string (unique, use "plan-{timestamp}-{n}")
- planName: string (Chinese name like "强销售卖点图", "高级质感图", "优势功能图")
- templateId: string (one of: tpl-white-bg-hero, tpl-temu-single-sales, tpl-feature-explanation, tpl-detail-magnifier, tpl-advantage-comparison, tpl-compatible-tools, tpl-spec-info, tpl-usage-scene, tpl-promo-sales)
- imageType: string (one of: ecommerce_hero, feature_showcase, product_detail, lifestyle_scene, comparison_chart, product_showcase, ecommerce_banner, spec_info, promo_sales, compatible_tools)
- productAnalysis: object with:
  - productName: string (what is this product, in English)
  - productType: string (category like "Cutting Tool", "Fastener", "Hand Tool")
  - productSubjectDescription: string (brief description of the product subject)
  - visibleFeatures: string[] (list visible structural features)
  - materialGuess: string (estimated material, optional)
  - structureRisks: string[] (what must NOT be altered)
  - detectedNonProductElements: string[] (hands, fingers, table, packaging, shadows, etc.)
  - isolationInstruction: string (how to isolate the product from non-product elements)
- productName: string (same as productAnalysis.productName)
- headline: string (IMPACTFUL ENGLISH, 3-6 words, specific and product-relevant. See COPY GUIDELINES)
- subtitle: string (RECOMMENDED, 6-15 words, adds context and story. See COPY GUIDELINES)
- sellingPoints: string[] (3-4 items, ENGLISH, 2-5 words each, specific and diverse. See COPY GUIDELINES)
- copySource: string (one of: "user_exact", "ai_rewritten", "ai_suggested")
- copyNotes: string[] (optional, notes about copy decisions)
- layoutDirection: string (detailed composition, 2-3 sentences. See VISUAL GUIDELINES)
- visualDirection: string (detailed photography style, 2-4 sentences. See VISUAL GUIDELINES)
- colorDirection: string (detailed palette, 2-3 sentences. See VISUAL GUIDELINES)
- layoutOverlay: object with:
  - layoutType: string (one of: top_headline_right_points, left_headline_bottom_points, center_product_surrounding_points, comparison_split, detail_magnifier, promo_banner, clean_spec_card)
  - headline: string (must be rendered as large visible text ON the image)
  - subtitle: string (optional, must be rendered as visible text ON the image)
  - sellingPoints: string[] (each must be rendered as a visual badge/tag/block ON the image)
  - textLanguage: always "English"
  - textBlocks: array of { id, text, role, position, priority } — EACH textBlock must be rendered as an actual visual text element ON the image, not empty space
  - colorTheme: { primary, secondary, background, text, accent }
  - visualDensity: string (one of: clean, balanced, high_information)
- textLanguage: always "English"
- riskWarnings: string[] (include structure risks + content constraints)
- planSummaryPrompt: string (structured summary for user review)
- imageGenerationPrompt: string (prompt for image generation API)

The 3 plans must have DISTINCT directions:
1. Plan 1 — Sales-Focused / Bold Impact: High-contrast, energetic, action-oriented copy, dramatic lighting, strong color saturation.
2. Plan 2 — Premium/Luxury: Refined, elegant, trust-building copy, sophisticated lighting with controlled reflections, muted or rich jewel-tone palette.
3. Plan 3 — Feature/Technical: Problem-solving, credibility-building copy, clean technical composition, clear lighting that reveals surface detail and structure.

RESPONSE FORMAT (strict JSON):
{
  "mode": "single",
  "plans": [ ... ]
}
`;

  const setFormat = `
You must generate EXACTLY 1 ImageSetPlan object containing 5 CreativePlan objects.

The ImageSetPlan must have these exact fields:
- id: string ("set-{timestamp}")
- setName: string ("五张详情组图")
- productAnalysis: object (same structure as single mode)
- overallDirection: string (cohesive visual direction for the entire 5-image set in English, 3-4 sentences)
- platform: string ("E-commerce Detail Page")
- imageCount: number (5)
- plans: array of 5 CreativePlan objects
- riskWarnings: string[] (set-level consistency rules + base rules)

The 5 CreativePlan objects must be:
1. planName: "主图 / Hero Image", imageType: "ecommerce_hero", templateId: "tpl-white-bg-hero"
2. planName: "功能卖点图 / Feature Explanation", imageType: "feature_showcase", templateId: "tpl-feature-explanation"
3. planName: "局部细节图 / Detail Magnifier", imageType: "product_detail", templateId: "tpl-detail-magnifier"
4. planName: "应用场景图 / Usage Scene", imageType: "lifestyle_scene", templateId: "tpl-usage-scene"
5. planName: "优势对比图 / Advantage Comparison", imageType: "comparison_chart", templateId: "tpl-advantage-comparison"

Each CreativePlan has the same fields as single mode, but tailored to its specific role.
Apply the COPY GUIDELINES and VISUAL GUIDELINES for ALL 5 plans.

RESPONSE FORMAT (strict JSON):
{
  "mode": "set",
  "sets": [ { "id": "...", "setName": "五张详情组图", "productAnalysis": { ... }, "overallDirection": "...", "platform": "E-commerce Detail Page", "imageCount": 5, "plans": [ ...5 plans... ], "riskWarnings": [ ... ] } ]
}
`;

  if (templatePrompt) {
    return `${baseRules}\n${copyRules}\n${visualRules}\n\n## TEMPLATE INSTRUCTIONS (OVERRIDE DEFAULTS BELOW)\n\n${templatePrompt}\n\n## OUTPUT FORMAT (MUST FOLLOW)\n\n${mode === "single" ? singleFormat : setFormat}\n\nCRITICAL: Your response MUST be valid JSON. Do not include markdown formatting.`;
  }

  if (mode === "single") {
    return `${baseRules}\n${copyRules}\n${visualRules}\n${singleFormat}`;
  }

  return `${baseRules}\n${copyRules}\n${visualRules}\n${setFormat}`;
}

// ==================== Call Kimi API ====================

async function tryCallLLM(
  base64Image: string,
  userGoal: string,
  mode: "single" | "set",
  templatePrompt: string | undefined,
  model: string
): Promise<{ plans?: CreativePlan[]; sets?: ImageSetPlan[] }> {
  const apiKey = process.env.VOLCANO_API_KEY || process.env.KIMI_API_KEY;
  if (!apiKey) {
    throw new Error("LLM API key not configured (set VOLCANO_API_KEY or KIMI_API_KEY)");
  }

  const systemPrompt = buildSystemPrompt(mode, templatePrompt);

  const res = await fetch(LLM_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: base64Image },
            },
            {
              type: "text",
              text: `用户需求：${userGoal}\n制图模式：${mode === "single" ? "单张图（生成3个不同风格的单图方案）" : "五张详情组图（生成1套包含5张图的详情页组图方案）"}\n\n请严格按照 system prompt 中的 JSON 格式返回。`,
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
      thinking: { type: "disabled" },
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(`LLM API error ${res.status}: ${JSON.stringify(errorData)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM returned empty content");
  }

  return JSON.parse(content) as {
    mode?: string;
    plans?: CreativePlan[];
    sets?: ImageSetPlan[];
  };
}

async function callLLM(
  base64Image: string,
  userGoal: string,
  mode: "single" | "set",
  templatePrompt?: string
): Promise<CreativePlan[] | ImageSetPlan[]> {
  const modelsToTry = [LLM_MODEL, ...FALLBACK_VISION_MODELS.filter((m) => m !== LLM_MODEL)];
  let lastError: Error | undefined;

  for (const model of modelsToTry) {
    try {
      console.log(`[LLM] trying model: ${model}`);
      const parsed = await tryCallLLM(base64Image, userGoal, mode, templatePrompt, model);

      if (mode === "single") {
        if (!parsed.plans || !Array.isArray(parsed.plans)) {
          throw new Error("LLM response missing 'plans' array");
        }
        console.log(`[LLM] success with model: ${model}`);
        return parsed.plans;
      } else {
        if (!parsed.sets || !Array.isArray(parsed.sets) || parsed.sets.length === 0) {
          throw new Error("LLM response missing 'sets' array");
        }
        console.log(`[LLM] success with model: ${model}`);
        return parsed.sets;
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error(`[LLM] model ${model} failed:`, err.message);
      lastError = err;
      // 继续尝试下一个模型
    }
  }

  throw lastError || new Error("All LLM models failed");
}

// ==================== Post-process Plans ====================

function normalizeProductAnalysis(raw: unknown): ProductAnalysis {
  const r = raw as Record<string, unknown>;
  return {
    productName: String(r?.productName || "Product"),
    productType: String(r?.productType || "General"),
    productSubjectDescription: String(r?.productSubjectDescription || "Product subject"),
    visibleFeatures: Array.isArray(r?.visibleFeatures) ? r.visibleFeatures.map(String) : ["Main body"],
    materialGuess: r?.materialGuess ? String(r.materialGuess) : undefined,
    structureRisks: Array.isArray(r?.structureRisks) ? r.structureRisks.map(String) : ["Preserve original structure"],
    detectedNonProductElements: Array.isArray(r?.detectedNonProductElements)
      ? r.detectedNonProductElements.map(String)
      : [],
    isolationInstruction: String(r?.isolationInstruction || "Isolate product from background"),
  };
}

function normalizeCreativePlan(raw: unknown, fallbackAnalysis?: ProductAnalysis): CreativePlan {
  const p = raw as Record<string, unknown>;
  const analysis = p?.productAnalysis
    ? normalizeProductAnalysis(p.productAnalysis)
    : fallbackAnalysis;

  const headline = String(p?.headline || "PREMIUM QUALITY");
  const subtitle = p?.subtitle ? String(p.subtitle) : undefined;
  const sellingPoints = Array.isArray(p?.sellingPoints)
    ? p.sellingPoints.map(String)
    : ["QUALITY", "DURABLE"];

  const layoutDirection = String(p?.layoutDirection || "Centered product on clean background");
  const visualDirection = String(p?.visualDirection || "Professional studio lighting");
  const colorDirection = String(p?.colorDirection || "Neutral background");
  const imageType = String(p?.imageType || "product_showcase");

  let layoutOverlay = p?.layoutOverlay as LayoutOverlay | undefined;
  if (!layoutOverlay) {
    layoutOverlay = buildLayoutOverlay(headline, subtitle, sellingPoints, layoutDirection, imageType);
  }

  const copySource = (p?.copySource as CopySource) || "ai_suggested";

  const plan: CreativePlan = {
    id: String(p?.id || `plan-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`),
    planName: String(p?.planName || "方案"),
    templateId: String(p?.templateId || "tpl-feature-explanation"),
    imageType,
    productAnalysis: analysis,
    productName: String(p?.productName || analysis?.productName || "Product"),
    headline,
    subtitle,
    sellingPoints,
    copySource,
    copyNotes: Array.isArray(p?.copyNotes) ? p.copyNotes.map(String) : undefined,
    layoutDirection,
    visualDirection,
    colorDirection,
    layoutOverlay,
    textLanguage: "English",
    riskWarnings: Array.isArray(p?.riskWarnings) ? p.riskWarnings.map(String) : ["Keep text short English"],
  };

  plan.planSummaryPrompt = buildPlanSummaryPrompt(plan);
  plan.imageGenerationPrompt = buildImageGenerationPrompt(plan);
  plan.finalPrompt = plan.imageGenerationPrompt;

  return plan;
}

function normalizeImageSetPlan(raw: unknown): ImageSetPlan {
  const s = raw as Record<string, unknown>;
  const analysis = normalizeProductAnalysis(s?.productAnalysis);

  const rawPlans = Array.isArray(s?.plans) ? s.plans : [];
  const plans = rawPlans.map((p) => normalizeCreativePlan(p, analysis));

  return {
    id: String(s?.id || `set-${Date.now()}`),
    setName: String(s?.setName || "五张详情组图"),
    templateId: String(s?.templateId || "tpl-image-set-5"),
    productAnalysis: analysis,
    overallDirection: String(s?.overallDirection || "Clean e-commerce product photography suite"),
    platform: s?.platform ? String(s.platform) : undefined,
    imageCount: Number(s?.imageCount || plans.length || 5),
    plans,
    riskWarnings: Array.isArray(s?.riskWarnings) ? s.riskWarnings.map(String) : ["Keep text short English"],
  };
}

// ==================== Mock Fallback ====================

function analyzeProductImage(_imageUrl: string, userGoal: string): ProductAnalysis {
  const lower = userGoal.toLowerCase();
  let productName = "Product";
  let productType = "Industrial Hardware";
  let productSubjectDescription = "Metal hardware component";
  let visibleFeatures: string[] = ["Main body", "Surface texture", "Overall shape"];
  let materialGuess = "Metal alloy";
  let structureRisks: string[] = [
    "Do not alter the overall outer contour",
    "Preserve visible holes, slots, and openings",
  ];
  let detectedNonProductElements: string[] = ["hands", "fingers", "table background", "shadows"];
  let isolationInstruction = "Isolate only the product, remove hands, fingers, arms, table background, packaging, shadows and unrelated objects.";

  if (lower.includes("drill") || lower.includes("钻头")) {
    productName = "Drill Bit";
    productType = "Cutting Tool";
    productSubjectDescription = "Cylindrical cutting tool with spiral flutes and pointed tip";
    visibleFeatures = ["Spiral flutes", "Pointed tip", "Cylindrical shank", "Cutting edges"];
    materialGuess = "High-speed steel or carbide";
    structureRisks = [
      "Do not alter flute geometry or spiral angle",
      "Preserve cutting edge shape and tip angle",
      "Keep shank diameter and length proportions",
      "Do not add or remove holes or slots",
    ];
  } else if (lower.includes("blade") || lower.includes("刀") || lower.includes("刃")) {
    productName = "Cutting Blade";
    productType = "Blade Tool";
    productSubjectDescription = "Flat blade tool with sharp cutting edge";
    visibleFeatures = ["Sharp edge", "Beveled surface", "Mounting holes", "Body profile"];
    materialGuess = "Hardened steel or ceramic";
    structureRisks = [
      "Do not alter the cutting edge line or bevel angle",
      "Preserve mounting hole positions and sizes",
      "Keep overall blade profile and curvature",
    ];
  } else if (lower.includes("screw") || lower.includes("thread") || lower.includes("螺栓") || lower.includes("螺纹")) {
    productName = "Threaded Fastener";
    productType = "Fastener";
    productSubjectDescription = "Cylindrical fastener with external threads and head";
    visibleFeatures = ["External threads", "Hex head", "Tapered tip", "Shank body"];
    materialGuess = "Zinc-plated steel or stainless steel";
    structureRisks = [
      "Do not alter thread pitch or profile",
      "Preserve head shape and drive type",
      "Keep overall length and diameter proportions",
    ];
  } else if (lower.includes("key") || lower.includes("钥匙")) {
    productName = "Classic Key";
    productType = "Lock Hardware";
    productSubjectDescription = "Metal key with blade, bitting, and bow";
    visibleFeatures = ["Blade with bitting", "Bow/head", "Shoulder stop", "Keyway profile"];
    materialGuess = "Brass or nickel alloy";
    structureRisks = [
      "Do not alter bitting pattern or keyway shape",
      "Preserve shoulder stop position",
      "Keep blade thickness and overall proportions",
    ];
  } else if (lower.includes("tool") || lower.includes("工具")) {
    productName = "Hand Tool";
    productType = "Tool";
    productSubjectDescription = "Hand tool with grip and working head";
    visibleFeatures = ["Handle/grip", "Working head", "Body shaft", "Connection joint"];
    materialGuess = "Chrome vanadium steel with rubber grip";
    structureRisks = [
      "Do not alter handle shape or grip texture",
      "Preserve working head geometry",
      "Keep overall proportions and joint positions",
    ];
  }

  return {
    productName,
    productType,
    productSubjectDescription,
    visibleFeatures,
    materialGuess,
    structureRisks,
    detectedNonProductElements,
    isolationInstruction,
  };
}

function generateSinglePlans(analysis: ProductAnalysis, userGoal: string): CreativePlan[] {
  const lower = userGoal.toLowerCase();
  const baseName = analysis.productName;
  const wantsWhite = lower.includes("white") || lower.includes("白底");
  const wantsDark = lower.includes("dark") || lower.includes("黑底");
  const wantsBanner = lower.includes("banner") || lower.includes("海报") || lower.includes("主图");
  const wantsDetail = lower.includes("detail") || lower.includes("close") || lower.includes("特写");

  const copySource = detectCopySource(userGoal);
  const copyNotes = copySource === "ai_suggested"
    ? ["AI generated selling points based on product type. User can edit before generation."]
    : copySource === "ai_rewritten"
      ? ["User provided Chinese requirements; AI translated intent into English e-commerce copy."]
      : undefined;

  const commonRisks = [
    "Do not invent specifications, sizes, or material grades not provided by user",
    "Do not include fake logos, prices, or certification marks",
    "Keep all text in English only",
    "Hands, fingers, arms, table, background clutter, and packaging are NOT product parts",
  ];

  const now = Date.now();

  const p1: CreativePlan = {
    id: `plan-${now}-s1`,
    planName: "强销售卖点图",
    templateId: wantsBanner ? "tpl-promo-sales" : "tpl-temu-single-sales",
    imageType: wantsBanner ? "ecommerce_banner" : "product_showcase",
    productAnalysis: analysis,
    productName: baseName,
    headline: "Engineered to Outperform",
    subtitle: "Professional-grade power that tackles the toughest jobs without compromise",
    sellingPoints: ["Ultra-Durable Construction", "Precision-Machined Core", "Rapid Performance Delivery", "Industrial-Grade Reliability"],
    copySource,
    copyNotes,
    layoutDirection: wantsBanner
      ? "Product dominates the right 55% of frame at a dynamic 12-degree upward tilt, creating forward momentum. Bold headline occupies the upper-left quadrant with commanding scale. Three selling points stack vertically on the left edge, each aligned to a subtle accent bar. A clean negative space band across the bottom provides breathing room. The eye flows headline → product → selling points in a decisive diagonal sweep."
      : "Product centered at 60% frame scale with confident frontal orientation. Large headline arcs above the product with generous negative space. Three selling points appear as horizontal badges beneath the product, evenly spaced with connecting accent lines. Clean background with subtle radial gradient keeping focus locked on the merchandise.",
    visualDirection: wantsBanner
      ? "Dramatic commercial photography with a low 3/4 camera angle looking slightly upward at the product, conveying dominance and power. Strong key light from upper-left creates crisp specular highlights on metallic surfaces with deep sculpted shadows defining every contour. A subtle warm rim light traces the product's right edge for separation from the dark ground. Shallow depth of field with background elements softly dissolved. Crisp edges and high-resolution surface detail visible on all primary faces."
      : "Professional studio commercial photography with even, soft key lighting from above and slightly forward. Gentle fill light eliminates harsh shadows while preserving dimension. A subtle cool rim light from behind creates a thin luminous edge separating the product from background. Medium depth of field keeping the entire product razor-sharp. Surface textures and material finishes rendered with photorealistic accuracy.",
    colorDirection: wantsDark
      ? "Deep charcoal background (#1a1a2e) with a subtle radial vignette darkening toward edges, creating a theatrical stage. Bright electric orange (#ff6b35) accents appear as thin glowing bars behind selling points and as a soft bloom around the product silhouette. Cool silver and steel blue tones on the product create an energizing warm-cool contrast. White text zones sit cleanly against the dark ground."
      : "Clean pure white background (#FFFFFF) with a barely perceptible cool-gray radial gradient at the outer edges to prevent floating. Deep navy blue (#1e3a5f) anchors the headline and primary text zones. Bold crimson red (#dc2626) appears sparingly as accent marks and badge highlights, creating urgency. Metallic silver and brushed aluminum tones on the product provide neutral sophistication.",
    layoutOverlay: buildLayoutOverlay(
      "Engineered to Outperform",
      "Professional-grade power that tackles the toughest jobs without compromise",
      ["Ultra-Durable Construction", "Precision-Machined Core", "Rapid Performance Delivery", "Industrial-Grade Reliability"],
      wantsBanner ? "banner" : "center",
      wantsBanner ? "ecommerce_banner" : "product_showcase"
    ),
    textLanguage: "English",
    riskWarnings: [...analysis.structureRisks, ...commonRisks],
  };

  const p2: CreativePlan = {
    id: `plan-${now}-s2`,
    planName: "高级质感图",
    templateId: wantsBanner ? "tpl-promo-sales" : wantsDetail ? "tpl-detail-magnifier" : "tpl-feature-explanation",
    imageType: wantsBanner ? "ecommerce_banner" : wantsDetail ? "product_detail" : "product_showcase",
    productAnalysis: analysis,
    productName: baseName,
    headline: "Crafted for Excellence",
    subtitle: "Where meticulous engineering meets timeless quality and lasting value",
    sellingPoints: ["Hand-Finished Surfaces", "Premium Alloy Core", "Legacy-Grade Durability", "Refined Precision Fit"],
    copySource,
    copyNotes,
    layoutDirection: wantsBanner
      ? "Elegant asymmetrical composition: product rests on the left third of frame at a refined 8-degree angle, casting a soft directional shadow. Headline floats in the right half with luxurious letter-spacing and generous vertical breathing room. Single selling point appears as an understated tagline beneath the headline. Ample negative space whispers premium confidence."
      : wantsDetail
        ? "Product fills 75% of frame at an intimate 20-degree angle revealing critical surface detail. Headline nestles in the top-right corner at modest scale, deliberately understated. Minimal text overlay — a single selling point label positioned unobtrusively. Dark gradient vignette at corners draws the eye inward toward the product's finest surface details."
        : "Product elevated on a subtle mirrored reflection surface, creating a sense of weight and permanence. Headline hovers centered above with classical proportions. Two selling points sit symmetrically below the reflection line like foundation stones. Background is a seamless gradient from warm pearl to soft ivory.",
    visualDirection: wantsBanner
      ? "High-end luxury product photography reminiscent of premium watch or automotive campaigns. Controlled softbox lighting from the upper-right creates satin-smooth gradients across curved surfaces with a single elegant catchlight. Deep but velvety shadows add dimension without harshness. A subtle warm fill from below brings out rich material tones. Shallow depth of field dissolves the background into a creamy bokeh. Every surface rendered with a tactile, almost touchable quality."
      : wantsDetail
        ? "Macro photography at extreme magnification with razor-sharp focus locked on the product's most critical working surface. Dramatic side-raking light at a low angle reveals micro-texture, machining marks, and surface topography with scientific clarity. Deep shadow pockets emphasize edge geometry. Cool key light balanced with a whisper of warm fill. Background falls to near-black, creating an intimate, museum-exhibit quality."
        : "Refined commercial photography with a classic beauty-dish key light creating a single perfect highlight on the product's crown. Soft fill from a large white panel eliminates all but the most graceful shadows. Controlled reflections on the mirrored surface beneath echo the product form with elegant symmetry. Background rendered as a seamless warm ivory sweep. The overall mood is calm, confident, and quietly authoritative.",
    colorDirection: wantsDark
      ? "Deep matte black background (#0a0a0f) with a subtle warm spotlight pool centered on the product. Champagne gold (#c9a96e) accents appear in thin refined lines and typography details, suggesting heritage and prestige. Warm bronze and cognac tones emerge in the product's metallic surfaces under the warm light. The palette speaks of exclusivity and master craftsmanship."
      : "Warm ivory background (#f5f0e8) with a delicate gradient to soft pearl at the edges. Brushed gold (#b8956a) appears sparingly in accent lines and highlight zones. Deep espresso brown (#3d2b1f) provides grounding contrast for text. The palette evokes aged paper, fine leather, and polished brass — timeless materials that promise lasting quality.",
    layoutOverlay: buildLayoutOverlay(
      "Crafted for Excellence",
      "Where meticulous engineering meets timeless quality and lasting value",
      ["Hand-Finished Surfaces", "Premium Alloy Core", "Legacy-Grade Durability", "Refined Precision Fit"],
      wantsBanner ? "banner" : wantsDetail ? "detail" : "center",
      wantsBanner ? "ecommerce_banner" : wantsDetail ? "product_detail" : "product_showcase"
    ),
    textLanguage: "English",
    riskWarnings: [
      ...analysis.structureRisks,
      "Do not invent hardness ratings, alloy specifications, or coating details",
      "Do not generate fake brand marks or serial numbers",
      "Keep all text in English only",
      "Hands, fingers, arms, table, background clutter, and packaging are NOT product parts",
    ],
  };

  const p3: CreativePlan = {
    id: `plan-${now}-s3`,
    planName: "优势功能图",
    templateId: wantsBanner ? "tpl-promo-sales" : "tpl-advantage-comparison",
    imageType: wantsBanner ? "ecommerce_banner" : "comparison_chart",
    productAnalysis: analysis,
    productName: baseName,
    headline: "Precision You Can Trust",
    subtitle: "Designed for professionals who refuse to compromise on accuracy and consistency",
    sellingPoints: ["Exact Tolerance Control", "Corrosion-Resistant Build", "Versatile Multi-Use Design", "Consistent Repeatable Results"],
    copySource,
    copyNotes,
    layoutDirection: wantsBanner
      ? "Dynamic diagonal composition: product sweeps across the center at a bold 25-degree angle, creating visual energy and forward motion. Headline anchors the top-right with strong horizontal weight. Three feature callouts with subtle geometric icons align along the bottom edge in a staggered rhythm. A subtle grid-line texture in the background suggests engineering precision without distraction."
      : "Product sits slightly left of center in a natural working orientation, surrounded by a softly blurred context of relevant tools and materials that suggest authentic use. Headline commands the top edge with clean authority. Selling points form a clean vertical list on the right side, each preceded by a minimal geometric marker. The overall composition feels like a technical document elevated to art.",
    visualDirection: wantsBanner
      ? "Dynamic commercial photography with a dramatic low-angle perspective looking up at the product, conveying capability and dependability. Strong directional key light from upper-left sculpts the form with confidence. A cool blue accent light from the right adds a technical, modern edge. Background features a subtle grid texture at 15% opacity, evoking technical drawings and CAD precision. Crisp focus across the entire product with visible surface detail that proves quality."
      : "Environmental commercial photography shot on location with natural ambient light supplemented by a soft key light on the product. Background workshop elements (tools, bench surface, material samples) rendered in shallow depth of field, creating context without competition. Warm tungsten tones in the environment contrast with cool daylight on the product. Realistic shadows and reflections on surrounding surfaces ground the scene in authenticity. The product remains unmistakably sharp, the hero of its own working story.",
    colorDirection: wantsDark
      ? "Dark slate background (#1e293b) with a subtle radial gradient suggesting depth and focus. Steel blue (#60a5fa) serves as the primary accent, appearing in highlight zones, connector lines, and text markers. Electric teal (#14b8a6) provides secondary energy points. The product's metallic surfaces read as authentic steel and alloy under the cool lighting. The palette communicates precision, technology, and engineering credibility."
      : "Light concrete gray background (#e2e8f0) with a barely-there texture suggesting an industrial workbench or technical surface. Bold cobalt blue (#2563eb) anchors headlines and primary callouts with authority. Bright white text zones sit cleanly against the neutral ground. A whisper of safety green (#22c55e) appears in subtle check-mark or indicator accents. The overall impression is clean, honest, and technically trustworthy.",
    layoutOverlay: buildLayoutOverlay(
      "Precision You Can Trust",
      "Designed for professionals who refuse to compromise on accuracy and consistency",
      ["Exact Tolerance Control", "Corrosion-Resistant Build", "Versatile Multi-Use Design", "Consistent Repeatable Results"],
      wantsBanner ? "banner" : "context",
      wantsBanner ? "ecommerce_banner" : "comparison_chart"
    ),
    textLanguage: "English",
    riskWarnings: [
      ...analysis.structureRisks,
      "Do not invent torque ratings, load capacity, or performance metrics",
      "Do not generate fake comparison data or competitor references",
      "Keep all text in English only",
      "Hands, fingers, arms, table, background clutter, and packaging are NOT product parts",
    ],
  };

  [p1, p2, p3].forEach((p) => {
    p.planSummaryPrompt = buildPlanSummaryPrompt(p);
    p.imageGenerationPrompt = buildImageGenerationPrompt(p);
    p.finalPrompt = p.imageGenerationPrompt;
  });

  return [p1, p2, p3];
}

function generateSetPlans(analysis: ProductAnalysis, userGoal: string): ImageSetPlan[] {
  const lower = userGoal.toLowerCase();
  const baseName = analysis.productName;
  const wantsWhite = lower.includes("white") || lower.includes("白底");
  const wantsDark = lower.includes("dark") || lower.includes("黑底");

  const copySource = detectCopySource(userGoal);
  const copyNotes = copySource === "ai_suggested"
    ? ["AI generated selling points based on product type. User can edit before generation."]
    : copySource === "ai_rewritten"
      ? ["User provided Chinese requirements; AI translated intent into English e-commerce copy."]
      : undefined;

  const commonRisks = [
    "Do not invent specifications, sizes, or material grades not provided by user",
    "Do not include fake logos, prices, or certification marks",
    "Keep all text in English only",
    "Hands, fingers, arms, table, background clutter, and packaging are NOT product parts",
  ];

  const now = Date.now();

  const hero: CreativePlan = {
    id: `plan-${now}-h`,
    planName: "主图 / Hero Image",
    templateId: "tpl-white-bg-hero",
    imageType: "ecommerce_hero",
    productAnalysis: analysis,
    productName: baseName,
    headline: "Engineered for Excellence",
    subtitle: "Professional-grade performance trusted by craftsmen worldwide",
    sellingPoints: ["Premium Build Quality", "Factory-Tested Durability", "Precision Guaranteed"],
    copySource,
    copyNotes,
    layoutDirection: "Product commands the center of frame at 65% scale, grounded by a soft natural drop shadow that anchors it to the surface. Headline floats gracefully above with generous top padding. Three selling points appear as clean horizontal badges below the product, evenly distributed with subtle separator lines. Ample negative space on all four sides creates an open, breathable composition that feels premium and uncluttered.",
    visualDirection: "Impeccable commercial studio photography with a large, diffused key light positioned above and slightly forward, producing even, flattering illumination across all product surfaces. A soft fill light from below-front eliminates unwanted shadows while preserving gentle dimension. Crisp edges with zero color cast on the background. High-resolution surface detail is visible on every primary face, communicating quality without words. The overall impression is one of clinical precision and absolute confidence.",
    colorDirection: wantsDark
      ? "Rich near-black background (#0f0f1a) with a subtle radial gradient lightening toward the center where the product sits. Warm amber (#f59e0b) accents in headline zones and badge highlights create a premium warmth against the cool darkness. Metallic surfaces on the product reflect cool steel blue undertones. White text sits with perfect contrast and readability."
      : "Pure clean white background (#FFFFFF) with an imperceptible cool tint at the extreme edges to prevent the product from appearing to float. Deep navy (#1e3a5f) anchors all text and badge elements with corporate authority. Metallic silver and brushed aluminum tones on the product provide neutral sophistication. A whisper of soft blue (#60a5fa) in the product shadow adds subtle depth.",
    layoutOverlay: buildLayoutOverlay(
      "Engineered for Excellence",
      "Professional-grade performance trusted by craftsmen worldwide",
      ["Premium Build Quality", "Factory-Tested Durability", "Precision Guaranteed"],
      "hero",
      "ecommerce_hero"
    ),
    textLanguage: "English",
    riskWarnings: [...analysis.structureRisks, ...commonRisks],
  };

  const feature: CreativePlan = {
    id: `plan-${now}-f`,
    planName: "功能卖点图 / Feature Explanation",
    templateId: "tpl-feature-explanation",
    imageType: "feature_showcase",
    productAnalysis: analysis,
    productName: baseName,
    headline: "Built to Perform",
    subtitle: "Three innovations that set a new standard for reliability and precision",
    sellingPoints: ["Reinforced Core Structure", "Optimized Load Distribution", "Extended Service Life"],
    copySource,
    copyNotes,
    layoutDirection: "Product occupies the left 40% of frame in a clear three-quarter view that reveals key functional surfaces. Three feature callout zones occupy the right side, each aligned vertically with subtle connector lines tracing back to corresponding product areas. Headline sits confidently at top-center. The composition creates a natural left-to-right reading flow: product → features → benefits. Generous spacing between callout zones prevents information overload.",
    visualDirection: "Clean technical-commercial hybrid photography with clinical precision. A large softbox from the upper-left creates smooth gradients across the product while a secondary accent light from the lower-right adds dimension to edge details. Subtle highlight circles or thin connector lines emerge from the callout zones, pointing to real functional areas on the product — no invented features. The background is a seamless gradient sweep that transitions from light to slightly darker, creating subtle depth without distraction. Crisp edges and photorealistic material rendering throughout.",
    colorDirection: wantsDark
      ? "Deep navy background (#0f172a) with a subtle gradient to slate (#1e293b) at the bottom. Bright electric blue (#3b82f6) serves as the primary accent in callout circles, connector lines, and highlight markers. Cool white text maintains excellent readability. The product's metallic surfaces reflect the blue environment, creating visual cohesion. A thin gold (#c9a96e) accent line traces the connector paths, adding a touch of premium refinement."
      : "Clean bright white background with a barely-there pale blue tint (#f0f7ff) suggesting technical precision. Deep navy (#1e3a5f) anchors all headlines and primary text. Vibrant orange (#f97316) appears in callout highlights and connector endpoints, drawing the eye to each feature area. The product's natural metallic tones stand out crisply against the light ground. Subtle gray (#e2e8f0) panels behind each callout zone create information hierarchy without heaviness.",
    layoutOverlay: buildLayoutOverlay(
      "Built to Perform",
      "Three innovations that set a new standard for reliability and precision",
      ["Reinforced Core Structure", "Optimized Load Distribution", "Extended Service Life"],
      "feature",
      "feature_showcase"
    ),
    textLanguage: "English",
    riskWarnings: [
      ...analysis.structureRisks,
      "Do not invent performance metrics or durability claims not verified by user",
      "Do not generate fake test result icons or certification badges",
    ],
  };

  const detail: CreativePlan = {
    id: `plan-${now}-d`,
    planName: "局部细节图 / Detail Magnifier",
    templateId: "tpl-detail-magnifier",
    imageType: "product_detail",
    productAnalysis: analysis,
    productName: baseName,
    headline: "Crafted With Precision",
    subtitle: "Every surface, every edge, every detail speaks to uncompromising quality",
    sellingPoints: ["Micro-Polished Surfaces", "Tight Tolerance Control", "Superior Edge Retention"],
    copySource,
    copyNotes,
    layoutDirection: "An extreme close-up of the product's most critical working surface fills 70% of the frame, revealing texture and finish in extraordinary detail. A magnified inset circle at the top-right corner shows an even closer view of surface micro-structure. Headline sits in the upper-left with restrained scale. Minimal text labels point to specific, real features only — no fabricated annotations. A dark gradient vignette at the frame edges intensifies focus on the center detail area.",
    visualDirection: "Macro photography at extreme magnification with a razor-thin plane of focus locked precisely on the most critical edge or surface. Dramatic side-raking light from a low angle creates deep relief, revealing every machining mark, grain structure, and surface texture with scientific clarity. Cool key light is balanced by the faintest whisper of warm fill from the opposite side. Background dissolves to deep shadow, creating an intimate, almost microscopic examination feel. The inset magnified view uses identical lighting for visual consistency. Every surface reads as authentically physical and meticulously finished.",
    colorDirection: wantsDark
      ? "Near-black background (#050508) with a subtle warm spotlight pool centered on the detail area. Cool silver (#94a3b8) and steel blue (#64748b) tones dominate the product surfaces under the raking light. Bright cyan (#06b6d4) appears sparingly as an accent in the inset circle border and feature markers. White text zones float cleanly against the darkness. The overall palette feels like a high-end technical microscope image — precise, clinical, and awe-inspiring."
      : "Soft dove-gray background (#e8e8ec) with a gentle radial gradient to lighter tones at center. Warm white key light brings out rich metallic silver and brushed steel tones in the product. Deep charcoal (#334155) text anchors the headline with authority. A subtle warm gold (#d4a574) accent traces the inset circle border, suggesting handcrafted quality. The palette evokes fine jewelry photography — every detail is precious and worthy of close inspection.",
    layoutOverlay: buildLayoutOverlay(
      "Crafted With Precision",
      "Every surface, every edge, every detail speaks to uncompromising quality",
      ["Micro-Polished Surfaces", "Tight Tolerance Control", "Superior Edge Retention"],
      "detail",
      "product_detail"
    ),
    textLanguage: "English",
    riskWarnings: [
      ...analysis.structureRisks,
      "Do not alter the geometry of visible edges, threads, holes, or cutting surfaces",
      "Do not invent surface treatment names or coating specifications",
      "Keep magnification view accurate to actual product proportions",
    ],
  };

  const scene: CreativePlan = {
    id: `plan-${now}-sc`,
    planName: "应用场景图 / Usage Scene",
    templateId: "tpl-usage-scene",
    imageType: "lifestyle_scene",
    productAnalysis: analysis,
    productName: baseName,
    headline: "Real Results, Real Work",
    subtitle: "Trusted by professionals who demand consistent performance day after day",
    sellingPoints: ["Workshop-Tested Toughness", "Consistent Output Quality", "All-Day Reliability"],
    copySource,
    copyNotes,
    layoutDirection: "Product sits naturally in a working position slightly right of center, as if paused mid-task. The surrounding environment — a workbench with tools, materials, and authentic workshop details — fills the background in soft, painterly blur. Headline occupies the upper-left with generous letter spacing, creating breathing room. Selling points form a clean vertical list along the right edge, each with a minimal geometric marker. The composition tells a story: this product belongs in the hands of someone who knows quality.",
    visualDirection: "Authentic environmental photography shot on location in a real workshop or industrial space. Warm tungsten ambient light from overhead fixtures creates a natural, lived-in atmosphere. A soft key light on the product keeps it hero-sharp while the environment recedes into creamy bokeh. Realistic shadows cast by the product onto the workbench surface ground the scene in physical reality. Background elements — wood grain, steel tools, raw materials — are unbranded and genuinely industrial. The overall mood is one of quiet competence and earned expertise.",
    colorDirection: "Warm earthy workshop palette dominated by natural wood browns (#8b6914), oxidized steel grays (#6b7280), and warm tungsten amber (#fbbf24) light casts. The product's metallic surfaces catch both the warm ambient light and a cooler fill, creating dimensional color complexity. Text zones in clean white with subtle drop shadows for readability against the varied background. The palette feels honest, grounded, and unmistakably real — like stepping into a craftsman's workshop at golden hour.",
    layoutOverlay: buildLayoutOverlay(
      "Real Results, Real Work",
      "Trusted by professionals who demand consistent performance day after day",
      ["Workshop-Tested Toughness", "Consistent Output Quality", "All-Day Reliability"],
      "scene",
      "lifestyle_scene"
    ),
    textLanguage: "English",
    riskWarnings: [
      ...analysis.structureRisks,
      "Do not invent usage scenarios beyond what is reasonable for this product type",
      "Do not show product performing impossible or exaggerated tasks",
      "Environment should suggest but not distract from the product",
    ],
  };

  const comparison: CreativePlan = {
    id: `plan-${now}-c`,
    planName: "优势对比图 / Advantage Comparison",
    templateId: "tpl-advantage-comparison",
    imageType: "comparison_chart",
    productAnalysis: analysis,
    productName: baseName,
    headline: "The Quality Difference",
    subtitle: "See why professionals consistently choose our engineering over ordinary alternatives",
    sellingPoints: ["Advanced Material Selection", "Superior Build Integrity", "Proven Longevity"],
    copySource,
    copyNotes,
    layoutDirection: "A powerful implied comparison: the featured product dominates the left 55% of frame at a commanding scale with a subtle luminous glow treatment suggesting quality radiance. An abstract, generic alternative occupies the right side at smaller scale with reduced saturation and softer focus — clearly secondary. A subtle diagonal dividing line or gradient transition runs between them. Headline sits centered at top with strong visual weight. Three advantage points appear as bold vertical bars or clean text blocks in the middle zone. No competitor branding, no fake data — pure visual persuasion.",
    visualDirection: "Dramatic comparative studio photography with two distinct lighting treatments. The featured product basks in full, rich key lighting with a warm accent rim that makes it feel alive and desirable. The generic side receives flat, cool lighting that renders it flat and uninspiring. A subtle diagonal light falloff creates the transition zone between the two sides. Background is a clean gradient that supports the narrative: richer and deeper on the featured side, fading to near-neutral on the comparison side. Professional studio quality throughout with crisp focus on the featured product and intentional softness on the alternative.",
    colorDirection: wantsDark
      ? "Dramatic dark background (#0f172a) with the featured product rendered in full, rich natural color with warm gold (#fbbf24) rim highlights that make it feel premium and alive. The comparison side fades into cool desaturated blue-gray (#475569) tones, visually communicating 'ordinary.' Clean white text for headlines. A thin emerald green (#10b981) accent appears in subtle check-mark or advantage indicators. The palette creates an immediate emotional response: one side is desirable, the other is forgettable."
      : "Clean bright white background with the featured product in rich, saturated natural color — every metallic reflection and surface detail vibrant and compelling. The comparison side dissolves into pale, desaturated gray (#d1d5db), visually suggesting weakness and compromise. Deep navy (#1e3a5f) anchors all text elements with authority. A confident blue (#2563eb) appears in advantage markers and dividing accents. The palette makes the choice feel obvious: one side is clearly superior without a single word of explanation needed.",
    layoutOverlay: buildLayoutOverlay(
      "The Quality Difference",
      "See why professionals consistently choose our engineering over ordinary alternatives",
      ["Advanced Material Selection", "Superior Build Integrity", "Proven Longevity"],
      "comparison",
      "comparison_chart"
    ),
    textLanguage: "English",
    riskWarnings: [
      ...analysis.structureRisks,
      "Do not generate fake performance data, test scores, or comparison numbers",
      "Do not reference specific competitor brands or products",
      "Do not invent warranty periods, lifespan claims, or durability statistics",
      "Visual comparison only — no fabricated charts, graphs, or statistics",
    ],
  };

  const plans = [hero, feature, detail, scene, comparison];
  plans.forEach((p) => {
    p.planSummaryPrompt = buildPlanSummaryPrompt(p);
    p.imageGenerationPrompt = buildImageGenerationPrompt(p);
    p.finalPrompt = p.imageGenerationPrompt;
  });

  const setPlan: ImageSetPlan = {
    id: `set-${now}`,
    setName: "五张详情组图",
    templateId: "tpl-image-set-5",
    productAnalysis: analysis,
    overallDirection: `A cohesive ${baseName.toLowerCase()} product visual suite engineered for maximum ecommerce conversion. The set follows a unified ${wantsWhite ? "clean white studio" : wantsDark ? "dramatic dark stage" : "neutral professional"} aesthetic family across all five images while deliberately varying composition, lighting intensity, and information density per image role. Lighting direction remains consistent — primarily from upper-left — creating a natural visual rhythm as shoppers scroll through the detail page. Color temperature is controlled and unified: ${wantsDark ? "warm metallic accents against deep cool backgrounds create premium drama" : wantsWhite ? "cool metallic tones against pure white convey clinical precision and trust" : "balanced warm-cool neutrality suggests honest professionalism"}. Each image has a distinct copy personality while maintaining typographic consistency, ensuring the set feels like a single, professional campaign rather than five separate images.`,
    platform: "E-commerce Detail Page",
    imageCount: 5,
    plans,
    riskWarnings: [
      "All 5 images must maintain consistent product proportions and structure",
      "Do not vary material appearance across images in the same set",
      "Text style and typography must be consistent across the set",
      ...commonRisks,
    ],
  };

  return [setPlan];
}

// ==================== API Handler ====================

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PlanRequest;

    const userGoal = body.userGoal || body.goal || "";
    if (!userGoal || userGoal.trim().length < 3) {
      return NextResponse.json(
        { error: "请输入有效的制图目标描述" },
        { status: 400 }
      );
    }

    const mode = body.mode || "single";
    const rawProductImageUrl = body.rawProductImageUrl || body.productImageUrl || "";

    // Get template if selected
    let templatePrompt: string | undefined;
    if (body.selectedTemplateId) {
      const template = getTemplateById(body.selectedTemplateId);
      if (template) {
        templatePrompt = template.templatePrompt;
      }
    }

    // Try LLM (Volcano Engine / Kimi)
    const apiKey = process.env.VOLCANO_API_KEY || process.env.KIMI_API_KEY;
    if (apiKey && apiKey !== "sk-your-kimi-key-here") {
      try {
        const base64Image = await imageUrlToBase64(rawProductImageUrl);
        if (base64Image) {
          const result = await callLLM(base64Image, userGoal, mode, templatePrompt);

          if (mode === "set") {
            const sets = (result as ImageSetPlan[]).map((s) => normalizeImageSetPlan(s));
            return NextResponse.json({ data: sets, mode: "set" });
          } else {
            const plans = (result as CreativePlan[]).map((p) => normalizeCreativePlan(p));
            return NextResponse.json({ data: plans, mode: "single" });
          }
        }
      } catch (e) {
        console.error("[LLM] failed, fallback to mock:", e);
      }
    }

    // Fallback: mock generation
    await new Promise((resolve) => setTimeout(resolve, mode === "set" ? 800 : 500));

    const analysis = analyzeProductImage(rawProductImageUrl, userGoal);

    if (mode === "set") {
      const sets = generateSetPlans(analysis, userGoal);
      return NextResponse.json({ data: sets, mode: "set" });
    } else {
      const plans = generateSinglePlans(analysis, userGoal);
      return NextResponse.json({ data: plans, mode: "single" });
    }
  } catch (error) {
    console.error("Plan generation failed:", error);
    return NextResponse.json(
      { error: "生成方案失败，请稍后重试" },
      { status: 500 }
    );
  }
}
