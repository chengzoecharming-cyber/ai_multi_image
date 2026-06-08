import { getTemplateRulePrompt } from "./template-rules";

// ── Template → Archetype mapping (kept for runtime compatibility) ──
const TEMPLATE_ARCHETYPE_MAP: Record<string, string> = {
  "tpl-white-bg-hero": "hero_feature",
  "tpl-temu-promo": "promo_sales",
  "tpl-feature-explanation": "multi_panel_info",
  "tpl-macro-detail": "technical_breakdown",
  "tpl-advantage-comparison": "comparison_story",
  "tpl-lifestyle-scene": "application_scene",
  "tpl-bundle-showcase": "multi_panel_info",
  "tpl-spec-technical": "technical_breakdown",
  "tpl-premium-luxury": "premium_showcase",
  "tpl-dimension-annotation": "technical_breakdown",
  "tpl-image-set-5": "hero_feature",
};

export function detectTemplateArchetype(templateId?: string): string | undefined {
  if (!templateId) return undefined;
  const archetype = TEMPLATE_ARCHETYPE_MAP[templateId];
  if (archetype) return archetype;
  const lower = templateId.toLowerCase();
  if (lower.includes("white")) return "hero_feature";
  if (lower.includes("promo") || lower.includes("temu")) return "promo_sales";
  if (lower.includes("feature") || lower.includes("explanation")) return "multi_panel_info";
  if (lower.includes("macro") || lower.includes("detail") || lower.includes("spec") || lower.includes("dimension")) return "technical_breakdown";
  if (lower.includes("comparison") || lower.includes("advantage")) return "comparison_story";
  if (lower.includes("lifestyle") || lower.includes("scene")) return "application_scene";
  if (lower.includes("bundle")) return "multi_panel_info";
  if (lower.includes("premium") || lower.includes("luxury")) return "premium_showcase";
  return undefined;
}

/**
 * Build system prompt for LLM plan generation.
 *
 * Design philosophy:
 * - Minimal constraints, maximum creative freedom
 * - Only enforce red lines: product structure, truthfulness, user intent priority
 * - Do NOT prescribe layouts, colors, density, or archetypes
 */
export function buildSystemPrompt(
  mode: "single" | "set",
  templateId?: string
): string {
  const forcedArchetype = detectTemplateArchetype(templateId);
  const structuredTemplateRules = templateId ? getTemplateRulePrompt(templateId) : "";

  const base = `
You are an AI creative director for e-commerce product images.

Goal:
- Analyze the uploaded product image(s) and generate 3 e-commerce marketing image plans.
- Each plan should be a thoughtful, commercially appealing design for the given product.
- Return ONLY valid JSON (no markdown, no code fences).

Hard rules (never break):
1. The product image is the source of truth. If user text conflicts with the image, the image wins.
2. Preserve the product's original shape, proportions, structure, holes, slots, threads, edges, and contours.
3. Do NOT add or remove product parts.
4. Do NOT fabricate unverifiable facts: exact dimensions, hardness, load capacity, torque, certified grades, warranty, model numbers, brand names.
5. If the user explicitly provides specific data (size, material, specs), present it accurately.
6. Do NOT add watermarks, logos, signatures, brand marks, price tags, certification badges, or platform branding unless the user explicitly requests them.
7. All on-image text must be concise English.
8. User intent has the highest priority. If the user says "only change X", "keep everything else", or "just adjust Y", follow strictly — do NOT expand the scope.

Creative freedom:
- You decide the best visual style, layout, color palette, and information density based on the product and user goal.
- Do NOT force the 3 plans to be visually different. Let each plan be what makes the most sense for the product and user goal.
- Do NOT force any fixed color formula (e.g., "Plan 1 dark, Plan 2 light, Plan 3 bold").
- Do NOT force any fixed density gradient (e.g., "Plan 1 minimal, Plan 3 dense").
- Copy structure is flexible: headlines, feature points, technical notes, bottom bars, or even minimal text are all acceptable. Use only what serves the user's goal best.
- Write a rich, specific visualDirection covering photography style, lighting, material rendering, atmosphere, and camera angle. Be specific, not vague.
- Write a specific colorDirection with exact color values (hex or named) for primary, secondary, background, text, and accent.
- Write a specific layoutDirection describing product placement, text positioning, and overall composition.

Output JSON shape:
{
  "plans": [
    {
      "id": string,
      "planName": string,
      "planArchetype": "hero_feature" | "technical_breakdown" | "comparison_story" | "application_scene" | "multi_panel_info" | "premium_showcase" | "promo_sales",
      "templateId": string,
      "imageType": string,
      "productName": string,
      "headline": string,
      "subtitle": string,
      "sellingPoints": string[],
      "copyBlocks": Array<{ "id": string, "title": string, "body": string, "role": string, "priority": number }>,
      "layoutDirection": string,
      "visualDirection": string,
      "colorDirection": string,
      "visualComplexity": string,
      "informationDensity": string,
      "riskWarnings": string[]
    }
  ]
}
`.trim();

  if (mode !== "single") {
    return base;
  }

  if (templateId && forcedArchetype) {
    return `
${base}

Template mode:
- The selected template provides a general direction. Use it as a reference, not a rigid blueprint.
- All 3 plans MUST keep planArchetype = "${forcedArchetype}".
- Use different visual styles and different layout variants across the 3 plans.

${structuredTemplateRules}
`.trim();
  }

  return base;
}
