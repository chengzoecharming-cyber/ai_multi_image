import type { CreativePlan } from "@/app/ai-image/v2/types";

export function buildPlanSummaryPrompt(plan: CreativePlan): string {
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
    `Archetype: ${plan.planArchetype}`,
    `Image Type: ${plan.imageType}`,
    `Template ID: ${plan.templateId}`,
    `Visual Complexity: ${plan.visualComplexity}`,
    `Information Density: ${plan.informationDensity}`,
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

  if (plan.copyBlocks && plan.copyBlocks.length > 0) {
    parts.push(`Copy Blocks:`);
    plan.copyBlocks.forEach((cb) => {
      const icon = cb.iconHint ? ` [${cb.iconHint}]` : "";
      const sub = cb.subtitle ? ` — ${cb.subtitle}` : "";
      const body = cb.body ? ` (${cb.body})` : "";
      parts.push(`  [${cb.role}] "${cb.title}"${sub}${body}${icon} (P${cb.priority})`);
    });
  } else {
    parts.push(`Selling Points: ${plan.sellingPoints.map((s: string) => `"${s}"`).join(", ")}`);
  }

  if (plan.copyNotes && plan.copyNotes.length > 0) {
    parts.push(`Copy Notes: ${plan.copyNotes.join("; ")}`);
  }

  parts.push(
    ``,
    `--- Layout & Visual ---`,
    `Layout Direction: ${plan.layoutDirection}`,
    `Visual Direction: ${plan.visualDirection}`,
    `Color Direction: ${plan.colorDirection}`,
    ``,
    `--- Risk Warnings ---`,
    ...plan.riskWarnings.map((w: string) => `- ${w}`),
  );

  return parts.join("\n");
}

export function buildImageGenerationPrompt(plan: CreativePlan): string {
  const analysis = plan.productAnalysis;

  const parts: string[] = [
    `=== VISUAL STYLE AND COMPOSITION ===`,
    `Photography style, lighting, and atmosphere: ${plan.visualDirection}`,
    `Color palette and tonal direction: ${plan.colorDirection}`,
    `Composition, product placement, and layout: ${plan.layoutDirection}`,
    `Visual complexity: ${plan.visualComplexity}. Information density: ${plan.informationDensity}.`,
    ``,
    `=== PRODUCT SUBJECT ===`,
    `Product: "${plan.productName}".`,
    analysis ? `Product type: ${analysis.productType}. Key visible features: ${analysis.visibleFeatures?.join(", ") || "product"}.` : "",
    ``,
  ];

  // Comparison-story specific structure (kept as it's a distinct layout archetype)
  if (plan.planArchetype === "comparison_story") {
    parts.push(
      `=== COMPARISON STRUCTURE ===`,
      `This is a SPLIT-SCREEN COMPARISON image showing the SAME product category on BOTH sides — the right side is the featured product, the left side is a generic lower-quality version of the SAME product type.`,
      ``,
      `CRITICAL PRODUCT IDENTITY RULE:`,
      `Both sides must show the SAME product category with the SAME structure. The right side MUST match the uploaded reference product exactly in shape, proportions, and visible features.`,
      analysis ? `Product description: ${analysis.productSubjectDescription || analysis.productType}. Visible features: ${analysis.visibleFeatures?.join(", ") || "product features"}.` : "",
      ``,
      `1. VERTICAL SPLIT: Strict 50/50 left-right split. Unified deep dark background across BOTH halves.`,
      `2. CENTER "VS" DIVIDER: Large bold "VS" text centered vertically on the dividing line.`,
      `3. LEFT SIDE ("ORDINARY"):`,
      `   - The SAME product type as the right side, but shown as a GENERIC, LOWER-QUALITY version`,
      `   - Must have the SAME overall shape, structure, and visible features as the right side`,
      `   - VISUAL TREATMENT ONLY: desaturated, dimmer lighting`,
      `   - Large RED "X" mark beside the product`,
      `   - Label: "ORDINARY" or "STANDARD"`,
      `4. RIGHT SIDE ("OUR" / "UPGRADED"):`,
      `   - The EXACT featured product from the reference image, in FULL COLOR, bright light`,
      `   - Must preserve all visible features from the reference`,
      `   - Slightly LARGER than left side`,
      `   - Large GREEN CHECKMARK beside the product`,
      `   - Label: "OUR PRODUCT" or "UPGRADED"`,
      `5. BOTTOM FEATURE BAR (spans full width):`,
      `   - Horizontal dark panel at bottom`,
      `   - 3 feature advantage cards evenly spaced`,
      ``,
    );
  }

  // Text content: just list what text should appear, let model decide rendering
  parts.push(
    `=== ON-IMAGE TEXT ===`,
    `The following text MUST be rendered ON the image as real, readable typography.`,
    `Text must be professional commercial typesetting — NOT placeholder space, NOT blurry, NOT garbled.`,
    `The model should decide the best visual presentation (size, position, color, background treatment) based on the overall composition and visual style.`,
    ``,
  );

  if (plan.headline) {
    parts.push(`HEADLINE: "${plan.headline}"`);
  }

  if (plan.subtitle) {
    parts.push(`SUBTITLE: "${plan.subtitle}"`);
  }

  if (plan.copyBlocks && plan.copyBlocks.length > 0) {
    const sortedBlocks = [...plan.copyBlocks].sort((a, b) => a.priority - b.priority);
    sortedBlocks.forEach((b) => {
      const icon = b.iconHint ? ` [icon hint: ${b.iconHint}]` : "";
      const sub = b.subtitle ? ` — "${b.subtitle}"` : "";
      const body = b.body ? ` | ${b.body}` : "";
      parts.push(`${b.role.toUpperCase()}: "${b.title}"${sub}${body}${icon}`);
    });
  } else if (plan.sellingPoints.length > 0) {
    parts.push(`SELLING POINTS:`);
    plan.sellingPoints.forEach((s: string) => parts.push(`  • "${s}"`));
  }

  if (plan.copyNotes && plan.copyNotes.length > 0) {
    parts.push(`COPY NOTES: ${plan.copyNotes.join("; ")}`);
  }

  parts.push(``);

  if (analysis) {
    const englishOnly = (text: string) => text.replace(/[^\x00-\x7F]/g, " ").trim();
    const visibleFeatures = analysis.visibleFeatures?.map(englishOnly).filter(Boolean).join(", ") || "product";
    const isolationInstruction = analysis.isolationInstruction ? englishOnly(analysis.isolationInstruction) : "";
    parts.push(
      `=== PRODUCT PRESERVATION ===`,
      `CRITICAL: Preserve the EXACT product structure, proportions, and visible features from the reference image: ${visibleFeatures}.`,
      `Do NOT alter the product shape, add or remove parts, or change proportions.`,
      isolationInstruction ? `Isolation instruction: ${isolationInstruction}` : "",
      ``,
    );
  }

  parts.push(
    `=== STYLE & QUALITY ===`,
    `Photorealistic commercial product photography, professional studio quality, crisp edges, high resolution.`,
    `Follow the visual style specified in the VISUAL STYLE AND COMPOSITION section above.`,
    `NO fake logos, prices, certification marks, or platform branding.`,
    `NO CTA buttons, Buy Now, Shop Now, price badges, discount badges, or shipping labels.`,
    `NO watermark, NO "AI generated" mark, NO logo mark, NO signature, NO text overlay in any corner or edge of the image.`,
    `The image must be completely clean — no corner badges, no small text labels, no generated-by marks, no copyright stamps.`,
  );

  return parts.join("\n");
}
