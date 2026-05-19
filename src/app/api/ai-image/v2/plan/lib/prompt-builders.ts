import type { CreativePlan, LayoutOverlay, CopyBlock } from "@/app/ai-image/v2/types";

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

  // Rich copyBlocks summary
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
  );

  if (plan.layoutOverlay) {
    parts.push(
      ``,
      `--- Layout Overlay ---`,
      `Layout Type: ${plan.layoutOverlay.layoutType}`,
      `Visual Density: ${plan.layoutOverlay.visualDensity}`,
    );

    if (plan.layoutOverlay.regions && plan.layoutOverlay.regions.length > 0) {
      parts.push(`Regions:`);
      plan.layoutOverlay.regions.forEach((r) => {
        parts.push(`  [${r.role}] ${r.position} / ${r.size} (P${r.priority})`);
      });
    }

    if (plan.layoutOverlay.iconHints && plan.layoutOverlay.iconHints.length > 0) {
      parts.push(`Icon Hints:`);
      plan.layoutOverlay.iconHints.forEach((ih) => {
        parts.push(`  ${ih.iconType} → ${ih.meaning}`);
      });
    }

    parts.push(
      `Color Theme:`,
      `  Primary: ${plan.layoutOverlay.colorTheme.primary}`,
      `  Secondary: ${plan.layoutOverlay.colorTheme.secondary}`,
      `  Background: ${plan.layoutOverlay.colorTheme.background}`,
      `  Text: ${plan.layoutOverlay.colorTheme.text}`,
      `  Accent: ${plan.layoutOverlay.colorTheme.accent}`,
      `Text Blocks:`,
      ...plan.layoutOverlay.textBlocks.map(
        (tb: { role: string; text: string; position: string; priority: number }) =>
          `  [${tb.role}] "${tb.text}" → ${tb.position} (P${tb.priority})`
      ),
    );
  }

  parts.push(
    ``,
    `--- Structure Preservation ---`,
    ...analysis.structureRisks.map((r: string) => `- ${r}`),
    ``,
    `--- Risk Warnings ---`,
    ...plan.riskWarnings.map((w: string) => `- ${w}`),
  );

  return parts.join("\n");
}

export function buildImageGenerationPrompt(plan: CreativePlan): string {
  const analysis = plan.productAnalysis;
  const lo = plan.layoutOverlay;

  const parts: string[] = [
    `Create a professional e-commerce product listing image for "${plan.productName}".`,
    ``,
    `=== MANDATORY ON-IMAGE TEXT ===`,
    `ALL of the following English text MUST be rendered ON the image as real, readable typography.`,
    `Text must be professional commercial typesetting — NOT placeholder space, NOT blurry, NOT garbled.`,
    ``,
    `HEADLINE (largest, boldest, most prominent element on the image):`,
    `"${plan.headline}"`,
  ];

  if (plan.subtitle) {
    parts.push(
      ``,
      `SUBTITLE (clearly readable beneath the headline):`,
      `"${plan.subtitle}"`,
    );
  }

  // Rich copyBlocks-based text instructions
  if (plan.copyBlocks && plan.copyBlocks.length > 0) {
    const headlineBlocks = plan.copyBlocks.filter(b => b.role === "headline");
    const subheadlineBlocks = plan.copyBlocks.filter(b => b.role === "subheadline");
    const coreClaimBlocks = plan.copyBlocks.filter(b => b.role === "core_claim");
    const featureBlocks = plan.copyBlocks.filter(b => b.role === "feature_point");
    const technicalBlocks = plan.copyBlocks.filter(b => b.role === "technical_point");
    const bottomBlocks = plan.copyBlocks.filter(b => b.role === "bottom_info");
    const comparisonBlocks = plan.copyBlocks.filter(b => b.role === "comparison_label");
    const applicationBlocks = plan.copyBlocks.filter(b => b.role === "application_label");

    // Headlines
    if (headlineBlocks.length > 0) {
      parts.push(
        ``,
        `HEADLINES (render as largest, boldest text — choose the highest-priority headline as the main visual anchor):`,
      );
      headlineBlocks.forEach((b) => {
        parts.push(`  • "${b.title}" (P${b.priority})${b.body ? ` — ${b.body}` : ""}`);
      });
    }

    // Subheadlines
    if (subheadlineBlocks.length > 0) {
      parts.push(
        ``,
        `SUBHEADLINES (render directly beneath or beside the main headline, slightly smaller but still prominent):`,
      );
      subheadlineBlocks.forEach((b) => {
        parts.push(`  • "${b.title}"${b.body ? ` — ${b.body}` : ""}`);
      });
    }

    // Core claims
    if (coreClaimBlocks.length > 0) {
      parts.push(
        ``,
        `CORE CLAIMS (render as bold trust statements — large bold text blocks or badge-style callouts):`,
      );
      coreClaimBlocks.forEach((b) => {
        parts.push(`  • "${b.title}"${b.body ? ` — ${b.body}` : ""}`);
      });
    }

    // Feature points — title + subtitle + body
    if (featureBlocks.length > 0) {
      parts.push(
        ``,
        `FEATURE POINTS (render EACH as a self-contained visual card/panel with title + description):`,
        `  - Title: bold, slightly larger, dark or accent-colored text`,
        `  - Description (body): clean readable weight, 1-2 lines beneath the title, explaining the benefit`,
        `  - Style: dark semi-transparent panel, gradient card, or left-accent-border block`,
        `  - If an iconHint is provided, place a simple geometric icon to the LEFT of the title`,
      );
      featureBlocks.forEach((b) => {
        const icon = b.iconHint ? ` [icon: ${b.iconHint}]` : "";
        parts.push(`  • "${b.title}"${b.subtitle ? ` — "${b.subtitle}"` : ""}${b.body ? ` | ${b.body}` : ""}${icon}`);
      });
    }

    // Technical points — title + subtitle + body
    if (technicalBlocks.length > 0) {
      parts.push(
        ``,
        `TECHNICAL POINTS (render as precision/specification blocks — monospaced or engineering-style typography):`,
        `  - Title: bold label (e.g. "Material", "Tolerance", "Surface Finish")`,
        `  - Description: technical detail explaining the specification`,
        `  - Style: clean rectangular panels with subtle borders, callout boxes, or inset badges`,
      );
      technicalBlocks.forEach((b) => {
        const icon = b.iconHint ? ` [icon: ${b.iconHint}]` : "";
        parts.push(`  • "${b.title}"${b.subtitle ? ` — "${b.subtitle}"` : ""}${b.body ? ` | ${b.body}` : ""}${icon}`);
      });
    }

    // Comparison labels
    if (comparisonBlocks.length > 0) {
      parts.push(
        ``,
        `COMPARISON LABELS (render as side-by-side column headers or contrast badges):`,
        `  - Style: bold uppercase or bold weight, placed above or within comparison panels`,
        `  - Use contrasting accent colors for each side (e.g. blue vs orange)`,
      );
      comparisonBlocks.forEach((b) => {
        parts.push(`  • "${b.title}"${b.body ? ` — ${b.body}` : ""}`);
      });
    }

    // Application labels
    if (applicationBlocks.length > 0) {
      parts.push(
        ``,
        `APPLICATION LABELS (render as scene tags, use-case badges, or grid item titles):`,
        `  - Style: pill-shaped badges, small cards, or labels overlaying scene imagery`,
        `  - Use-case imagery should visually depict the application context`,
      );
      applicationBlocks.forEach((b) => {
        parts.push(`  • "${b.title}"${b.subtitle ? ` — "${b.subtitle}"` : ""}${b.body ? ` | ${b.body}` : ""}`);
      });
    }

    // Bottom info bar
    if (bottomBlocks.length > 0) {
      parts.push(
        ``,
        `BOTTOM INFO BAR (render as a horizontal dark panel at the bottom edge of the image):`,
        `  - Layout: evenly-spaced labels separated by thin vertical dividers`,
        `  - Typography: clean sans-serif, medium weight, white or light-colored text`,
        `  - Background: solid dark band (dark gray, navy, or black at ~80-90% opacity)`,
        `  - Each label should be a concise value or specification (NOT a CTA button)`,
      );
      bottomBlocks.forEach((b) => {
        parts.push(`  • "${b.title}"${b.body ? ` — ${b.body}` : ""}`);
      });
    }
  }

  // Fallback to sellingPoints if no copyBlocks
  if (!plan.copyBlocks || plan.copyBlocks.length === 0) {
    parts.push(
      ``,
      `SELLING POINTS (each as a distinct visual badge, tag, or info block with the exact words):`,
      ...plan.sellingPoints.map((s: string) => `  • "${s}"`),
    );
  }

  parts.push(
    ``,
    `=== TEXT RENDERING REQUIREMENTS ===`,
    ``,
    `## HEADLINE RENDERING`,
    `• ALL CAPS, bold sans-serif, largest text on the image`,
    `• Positioned as the dominant visual anchor — upper third or center-left`,
    `• Must have maximum contrast against background — use solid text, never outline-only`,
    `• If multiple headlines exist, the highest-priority one is primary; others become secondary headlines at ~60% size`,
    ``,
    `## SUBHEADLINE RENDERING`,
    `• Clean readable weight (medium, not bold), ~40-50% of headline size`,
    `• Positioned directly under or beside the main headline with consistent vertical rhythm`,
    `• Use a slightly muted color (e.g. secondary text color, not pure black/white)`,
    ``,
    `## CORE CLAIM RENDERING`,
    `• Render as bold trust statements — large bold text blocks, certification-style badges, or guarantee callouts`,
    `• Use accent color backgrounds or left-border accent strips for visual weight`,
    `• These are persuasion elements, so make them visually distinct from neutral feature blocks`,
    ``,
    `## FEATURE POINT RENDERING`,
    `• EACH feature point is a self-contained visual card/panel`,
    `• Title: bold, slightly larger than description, positioned at top of the card`,
    `• Description (body): clean readable weight, 1-2 lines beneath the title, explaining the BENEFIT (not just the feature name)`,
    `• Style options: dark semi-transparent panel, gradient card, left-accent-border block, or icon+text layout`,
    `• If an iconHint is provided, place a simple geometric icon to the LEFT of the title`,
    `• Cards should have consistent spacing, padding, and rounded corners`,
    `• Cards can slightly overlap the product image for depth, or sit in clean negative space`,
    ``,
    `## TECHNICAL POINT RENDERING`,
    `• Render as precision/specification blocks — engineering-style typography`,
    `• Use monospaced or clean sans-serif with tight letter-spacing`,
    `• Style: clean rectangular panels with subtle borders, callout boxes, or inset specification badges`,
    `• Place near the product or in a technical sidebar — avoid cluttering the main visual focus`,
    ``,
    `## COMPARISON LABEL RENDERING`,
    `• Render as side-by-side column headers or contrast badges`,
    `• Use contrasting accent colors for each side (e.g. blue vs orange, green vs red)`,
    `• Bold uppercase or bold weight, placed above or within comparison panels`,
    `• Visual separation: thin dividing line, different background tints, or side-by-side columns`,
    ``,
    `## APPLICATION LABEL RENDERING`,
    `• Render as scene tags, use-case badges, or grid item titles`,
    `• Pill-shaped badges, small cards, or labels overlaying scene imagery`,
    `• Use-case imagery should visually depict the application context (e.g. factory floor, workshop, machinery)`,
    ``,
    `## BOTTOM INFO BAR RENDERING`,
    `• Horizontal dark panel spanning the full width at the bottom edge`,
    `• Evenly-spaced labels separated by thin vertical dividers`,
    `• Typography: clean sans-serif, medium weight, white or light-colored text`,
    `• Background: solid dark band (dark gray, navy, or black at ~80-90% opacity)`,
    `• Each label is a concise value or specification — NOT a CTA button`,
    ``,
    `## GENERAL TYPOGRAPHY RULES`,
    `• Text must NEVER float on empty background — every text block must have a designed background treatment`,
    `• Background treatments: solid color blocks, gradient panels, geometric shapes, subtle dark overlays, frosted glass`,
    `• Typography must look like professional commercial graphic design, not simple captions`,
    `• Layer text with visual depth: headline overlaps nothing or sits on top, subtitles on panels, selling points in cards`,
    `• Maintain consistent font family across all text — use 1-2 complementary typefaces maximum`,
    `• Ensure ALL text is fully legible at intended viewing size — test contrast ratios`,
  );

  if (lo) {
    parts.push(
      ``,
      `=== LAYOUT ===`,
      `Layout Type: ${lo.layoutType}`,
      `Visual Density: ${lo.visualDensity}`,
    );

    if (lo.regions && lo.regions.length > 0) {
      parts.push(`Regions:`);
      lo.regions.forEach((r) => {
        parts.push(`  [${r.role}] ${r.position} / ${r.size} (priority ${r.priority})`);
      });
    }

    if (lo.textBlocks && lo.textBlocks.length > 0) {
      parts.push(`Text Elements:`);
      lo.textBlocks.forEach((tb: { role: string; text: string; position: string; priority: number }) => {
        parts.push(`  [${tb.role}] "${tb.text}" → position: ${tb.position} (priority ${tb.priority})`);
      });
    }

    if (lo.iconHints && lo.iconHints.length > 0) {
      parts.push(`Icon System:`);
      lo.iconHints.forEach((ih) => {
        parts.push(`  ${ih.iconType}: "${ih.meaning}"`);
      });
    }

    parts.push(
      `Color Theme:`,
      `  Primary: ${lo.colorTheme.primary}`,
      `  Secondary: ${lo.colorTheme.secondary}`,
      `  Background: ${lo.colorTheme.background}`,
      `  Text: ${lo.colorTheme.text}`,
      `  Accent: ${lo.colorTheme.accent}`,
    );
  }

  parts.push(
    ``,
    `=== VISUAL DIRECTION ===`,
    `${plan.visualDirection}`,
    ``,
    `=== COLOR & BACKGROUND ===`,
    `${plan.colorDirection}`,
    ``,
    `=== COMPOSITION ===`,
    `${plan.layoutDirection}`,
    ``,
  );

  if (analysis) {
    parts.push(
      `=== PRODUCT PRESERVATION ===`,
      `Preserve product structure: ${analysis.visibleFeatures.join(", ")}.`,
      `${analysis.isolationInstruction}`,
      ``,
    );
  }

  parts.push(
    `=== STYLE & QUALITY ===`,
    `Photorealistic commercial product photography, professional studio quality, crisp edges, high resolution.`,
    `Background must have depth — gradients, light beams, subtle textures, or atmospheric effects. NO flat solid-color backgrounds.`,
    `Overall design must feel like a premium commercial advertisement, not a simple product photo with text.`,
    `NO fake logos, prices, certification marks, or platform branding.`,
    `NO CTA buttons, Buy Now, Shop Now, price badges, discount badges, or shipping labels.`,
    `NO watermark, NO "AI generated" mark, NO logo mark, NO signature, NO text overlay in any corner or edge of the image.`,
    `The image must be completely clean — no corner badges, no small text labels, no generated-by marks, no copyright stamps.`,
  );

  return parts.join("\n");
}
