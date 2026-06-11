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
    parts.push(`Selling Points: ${(plan.sellingPoints || []).map((s: string) => `"${s}"`).join(", ")}`);
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
  const visibleFeatures = analysis?.visibleFeatures?.join(", ") || "all visible product features from the reference image";
  const productDescription = analysis?.productSubjectDescription || analysis?.productType || plan.productName || "the reference product";

  const parts: string[] = [
    `=== VISUAL STYLE AND COMPOSITION (MANDATORY — OVERRIDE ALL DEFAULT STYLES) ===`,
    `Photography style, lighting, and atmosphere: ${plan.visualDirection}`,
    `Color palette and tonal direction: ${plan.colorDirection}`,
    `Composition, product placement, and layout: ${plan.layoutDirection}`,
    `Visual complexity: ${plan.visualComplexity}. Information density: ${plan.informationDensity}.`,
    ``,
    `=== PRODUCT FIDELITY LOCK (MANDATORY) ===`,
    `The uploaded reference image is authoritative for the featured product's structure, apparent size/scale, component count, kit composition, and relative size relationships.`,
    `Unless the user explicitly requested a product-level change, preserve the featured product exactly: ${productDescription}. Visible features: ${visibleFeatures}.`,
    `Do NOT create visual impact by changing product count, product size, product proportions, product geometry, repeated-item lengths, or kit/component lineup.`,
    `Do NOT add extra copies, remove instances, split a product set, create variants, resize identical items into a size progression, or duplicate parts into the background.`,
    `Visual design, text, layout, lighting, and background may change, but they must never require changing the product body or product inventory.`,
    ``,
    `=== COMMERCIAL VISUAL ENERGY ===`,
    `Avoid flat catalog snapshots. Create premium commercial tension through camera angle, lighting contrast, depth, shadows, reflections, material highlights, background layering, and disciplined negative space.`,
    `Visual drama must come from non-product dimensions only: lens choice, perspective, crop, scene depth, surface texture, atmosphere, typography hierarchy, callout layout, and background treatment.`,
    `Match the product category: industrial tools can use CNC/workshop/metal textures; pet products can use home/pet interaction context; baby products can use nursery/parenting context; beauty/home/electronics should use category-appropriate premium environments.`,
    ``,
    `=== PRODUCT SUBJECT ===`,
    `Product: "${plan.productName}".`,
    analysis ? `Product type: ${analysis.productType}. Key visible features: ${visibleFeatures}.` : "",
    ``,
  ];

  // Comparison-story specific mandatory structure
  if (plan.planArchetype === "comparison_story") {
    parts.push(
      `=== COMPARISON STRUCTURE (MANDATORY — DO NOT OMIT ANY ELEMENT) ===`,
      `This is a SPLIT-SCREEN COMPARISON image: the right side is the featured reference product, the left side is a generic lower-quality comparison product from the same category.`,
      ``,
      `CRITICAL PRODUCT IDENTITY RULE:`,
      `The right/featured side MUST match the uploaded reference product exactly in shape, proportions, visible features, component count, and relative size relationships.`,
      `The left/comparison side may look generic, lower-quality, simplified, duller, or less complete to communicate contrast, but it must not cause the featured product to change.`,
      analysis ? `Product description: ${productDescription}. Visible features: ${visibleFeatures}.` : "",
      ``,
      `1. VERTICAL SPLIT: Strict 50/50 left-right split. Unified deep dark background across BOTH halves.`,
      `2. CENTER "VS" DIVIDER: Large bold "VS" text centered vertically on the dividing line. White or silver, heavy weight, readable at thumbnail size. May sit in a subtle circular badge.`,
      `3. LEFT SIDE ("ORDINARY" / "STANDARD"):`,
      `   - A GENERIC, LOWER-QUALITY comparison product from the same category`,
      `   - VISUAL TREATMENT ONLY: DESATURATED (20-30% saturation), dimmer lighting, cool blue-gray cast`,
      `   - Large RED "X" mark beside the product (signals problem/inferior)`,
      `   - Label: "ORDINARY" or "STANDARD" in ALL CAPS, cool gray`,
      `   - Short negative descriptor (e.g., "Chip Welding / Poor Finish")`,
      `4. RIGHT SIDE ("OUR" / "UPGRADED"):`,
      `   - The EXACT featured product from the reference image, in FULL COLOR, bright warm light, tack-sharp`,
      `   - Must preserve all visible features, component count, kit lineup, and relative size relationships from the reference: ${visibleFeatures}`,
      `   - Make it visually superior through lighting, color, sharpness, placement, labels, and badges — NOT by changing its size, count, proportions, or structure`,
      `   - Large GREEN CHECKMARK beside the product (signals superior/solution)`,
      `   - Label: "OUR PRODUCT" or "UPGRADED" in ALL CAPS, warm accent color`,
      `   - Short positive descriptor (e.g., "Smooth Finish / No Chip Welding")`,
      `5. BOTTOM FEATURE BAR (spans full width):`,
      `   - Horizontal dark panel at bottom 15-20% of image`,
      `   - 3 feature advantage cards evenly spaced`,
      `   - Each card: icon + bold title (2-4 words, ALL CAPS) + 1-line description`,
      `   - Green left-border accent on each card`,
      ``,
    );
  }

  parts.push(
    `=== MANDATORY ON-IMAGE TEXT ===`,
    `ALL of the following English text MUST be rendered ON the image as real, readable typography.`,
    `Text must be professional commercial typesetting — NOT placeholder space, NOT blurry, NOT garbled.`,
    ``,
    `HEADLINE (largest, boldest, most prominent element on the image):`,
    `"${plan.headline}"`,
  );

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
      ...(plan.sellingPoints || []).map((s: string) => `  • "${s}"`),
    );
  }

  // ── Dynamic TEXT RENDERING REQUIREMENTS ──
  // Only emit rendering rules for copyBlock roles that actually exist.
  // This prevents 8k-10k prompts when only a headline is present.
  const cbRoles = new Set(plan.copyBlocks?.map((b) => b.role) || []);
  const hasHeadline = cbRoles.has("headline");
  const hasSubheadline = cbRoles.has("subheadline");
  const hasCoreClaim = cbRoles.has("core_claim");
  const hasFeature = cbRoles.has("feature_point");
  const hasTechnical = cbRoles.has("technical_point");
  const hasComparison = cbRoles.has("comparison_label");
  const hasApplication = cbRoles.has("application_label");
  const hasBottom = cbRoles.has("bottom_info");
  const hasAnyBlocks = plan.copyBlocks && plan.copyBlocks.length > 0;

  const renderingParts: string[] = [
    ``,
    `=== TEXT RENDERING REQUIREMENTS ===`,
    ``,
  ];

  if (plan.planArchetype === "comparison_story") {
    renderingParts.push(
      `## COMPARISON-SPECIFIC RENDERING (MANDATORY for split-screen comparison)`,
      ``,
      `### VS DIVIDER`,
      `• Large bold 'VS' text centered vertically on the dividing line between left and right halves`,
      `• White (#FFFFFF) or silver (#E0E0E0), heavy sans-serif weight, substantial size`,
      `• Must be readable at thumbnail scale`,
      ``,
      `### RED X MARK (LEFT SIDE)`,
      `• Large red 'X' mark beside the left-side product. Color: #DC2626. Size: ~8-12% of half-frame height.`,
      ``,
      `### GREEN CHECKMARK (RIGHT SIDE)`,
      `• Large green checkmark beside the right-side product. Color: #22C55E. Size: ~8-12% of half-frame height.`,
      ``,
      `### BOTTOM FEATURE BAR`,
      `• Horizontal dark panel at bottom 15-20%. 3 evenly-spaced cards with icon + bold title (ALL CAPS) + 1-line description. Green left-border accent.`,
      ``,
    );
  }

  if (hasHeadline || !hasAnyBlocks) {
    renderingParts.push(
      `## HEADLINE RENDERING`,
      `• ALL CAPS, bold sans-serif, largest text on the image`,
      `• Dominant visual anchor — upper third or center-left`,
      `• Maximum contrast against background — solid text, never outline-only`,
      hasAnyBlocks && plan.copyBlocks!.filter((b) => b.role === "headline").length > 1
        ? `• Multiple headlines: highest-priority is primary; others become secondary at ~60% size`
        : ``,
      ``,
    );
  }

  if (hasSubheadline) {
    renderingParts.push(
      `## SUBHEADLINE RENDERING`,
      `• Medium weight, ~40-50% of headline size`,
      `• Positioned directly under or beside the main headline`,
      `• Use slightly muted color (secondary text color)`,
      ``,
    );
  }

  if (hasCoreClaim) {
    renderingParts.push(
      `## CORE CLAIM RENDERING`,
      `• Bold trust statements — large bold text blocks, certification badges, or guarantee callouts`,
      `• Accent color backgrounds or left-border accent strips for visual weight`,
      ``,
    );
  }

  if (hasFeature) {
    renderingParts.push(
      `## FEATURE POINT RENDERING`,
      `• EACH feature point is a self-contained visual card/panel`,
      `• Title: bold, slightly larger, at top of card`,
      `• Description: clean readable weight, 1-2 lines, explaining the BENEFIT`,
      `• Style: dark semi-transparent panel, gradient card, left-accent-border block, or icon+text layout`,
      `• If iconHint provided, place simple geometric icon to the LEFT of the title`,
      `• Consistent spacing, padding, rounded corners`,
      ``,
    );
  }

  if (hasTechnical) {
    renderingParts.push(
      `## TECHNICAL POINT RENDERING`,
      `• Precision/specification blocks — engineering-style typography`,
      `• Monospaced or clean sans-serif with tight letter-spacing`,
      `• Clean rectangular panels with subtle borders or inset badges`,
      `• Place near the product or in a technical sidebar`,
      ``,
    );
  }

  if (hasComparison) {
    renderingParts.push(
      `## COMPARISON LABEL RENDERING`,
      `• Side-by-side column headers or contrast badges`,
      `• Contrasting accent colors per side (e.g. blue vs orange)`,
      `• Bold uppercase, placed above or within comparison panels`,
      ``,
    );
  }

  if (hasApplication) {
    renderingParts.push(
      `## APPLICATION LABEL RENDERING`,
      `• Scene tags, use-case badges, or grid item titles`,
      `• Pill-shaped badges or small cards overlaying scene imagery`,
      ``,
    );
  }

  if (hasBottom) {
    renderingParts.push(
      `## BOTTOM INFO BAR RENDERING`,
      `• Horizontal dark panel at bottom edge, full width`,
      `• Evenly-spaced labels separated by thin vertical dividers`,
      `• Clean sans-serif, medium weight, white or light-colored text`,
      `• Background: solid dark band at ~80-90% opacity`,
      `• Each label is a concise value/spec — NOT a CTA button`,
      ``,
    );
  }

  // Fallback selling points rendering (when no copyBlocks)
  if (!hasAnyBlocks && (plan.sellingPoints || []).length > 0) {
    renderingParts.push(
      `## SELLING POINT RENDERING`,
      `• Each selling point as a distinct visual badge, tag, or info block`,
      `• Use consistent card style or badge style across all points`,
      ``,
    );
  }

  renderingParts.push(
    `## GENERAL TYPOGRAPHY RULES`,
    `• Text must NEVER float on empty background — every text block must have a designed background treatment`,
    `• Background treatments: solid color blocks, gradient panels, geometric shapes, subtle dark overlays, frosted glass`,
    `• Typography must look like professional commercial graphic design, not simple captions`,
    `• Layer text with visual depth: headline overlaps nothing or sits on top, subtitles on panels, selling points in cards`,
    `• Maintain consistent font family across all text — use 1-2 complementary typefaces maximum`,
    `• Ensure ALL text is fully legible at intended viewing size — test contrast ratios`,
  );

  parts.push(...renderingParts.filter((s) => s !== ""));

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

  // visualDirection, colorDirection, layoutDirection already included at the top of the prompt
  // in the === VISUAL STYLE AND COMPOSITION === section. No need to repeat.

  if (analysis) {
    const englishOnly = (text: string) => text.replace(/[^\x00-\x7F]/g, " ").trim();
    const visibleFeatures = analysis.visibleFeatures?.map(englishOnly).filter(Boolean).join(", ") || "industrial metal product";
    const isolationInstruction = analysis.isolationInstruction ? englishOnly(analysis.isolationInstruction) : "";
    parts.push(
      `=== PRODUCT PRESERVATION ===`,
      `CRITICAL: Preserve the EXACT product structure, proportions, apparent product size/scale, product count, and visible features from the reference image: ${visibleFeatures}.`,
      `Do NOT alter the product shape, add or remove parts, change proportions, resize the product body, duplicate the product, remove product instances, or create variants unless the user explicitly requested that exact product-level change.`,
      isolationInstruction ? `Isolation instruction: ${isolationInstruction}` : "",
      ``,
    );
  }

  parts.push(
    `=== STYLE & QUALITY ===`,
    `Photorealistic commercial product photography, professional studio quality, crisp edges, high resolution.`,
    `Follow the visual style specified in the VISUAL STYLE AND COMPOSITION section above. Do NOT override it with generic defaults.`,
    `NO fake logos, prices, certification marks, or platform branding.`,
    `NO CTA buttons, Buy Now, Shop Now, price badges, discount badges, or shipping labels.`,
    `NO watermark, NO "AI generated" mark, NO logo mark, NO signature, NO text overlay in any corner or edge of the image.`,
    `The image must be completely clean — no corner badges, no small text labels, no generated-by marks, no copyright stamps.`,
  );

  return parts.join("\n");
}
