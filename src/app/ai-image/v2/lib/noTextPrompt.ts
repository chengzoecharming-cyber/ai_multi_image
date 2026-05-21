import type { CreativePlan } from "../types";

function englishOnly(text: string) {
  return text.replace(/[^\x00-\x7F]/g, " ").replace(/\s+/g, " ").trim();
}

export function buildNoTextImagePrompt(plan: CreativePlan): string {
  const analysis = plan.productAnalysis;
  const visibleFeatures =
    analysis?.visibleFeatures?.map(englishOnly).filter(Boolean).join(", ") || "all visible product features";

  const parts: string[] = [
    `=== VISUAL STYLE AND COMPOSITION ===`,
    `Photography style, lighting, and atmosphere: ${plan.visualDirection}`,
    `Color palette and tonal direction: ${plan.colorDirection}`,
    `Composition, product placement, and layout: ${plan.layoutDirection}`,
    `Visual complexity: ${plan.visualComplexity}. Information density: ${plan.informationDensity}.`,
    ``,
    `=== PRODUCT SUBJECT (MOST IMPORTANT) ===`,
    `Product: "${plan.productName}".`,
    analysis?.productType ? `Product type: ${englishOnly(analysis.productType)}.` : "",
    `CRITICAL: Preserve the EXACT product structure, proportions, and visible features from the reference image: ${visibleFeatures}.`,
    `Do NOT alter the product shape, add/remove parts, change holes/threads/grooves/edges, or change proportions.`,
    analysis?.isolationInstruction ? `Isolation instruction: ${englishOnly(analysis.isolationInstruction)}.` : "",
    ``,
    `=== STRICT NO-TEXT RULES ===`,
    `Do NOT generate any text, letters, words, numbers, typography, logos, brand marks, watermarks, labels, stamps, QR codes, UI badges, or certification icons anywhere in the image.`,
    `The image must contain ZERO readable or unreadable text — fully clean, text-free design.`,
    ``,
    `=== QUALITY ===`,
    `Photorealistic commercial product photography, studio-quality lighting, crisp edges, high resolution.`,
    `No watermark, no "AI generated" mark, no signature.`,
  ];

  return parts.filter(Boolean).join("\n");
}

