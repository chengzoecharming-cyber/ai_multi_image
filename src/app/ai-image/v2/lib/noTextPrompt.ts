import type { CreativePlan } from "../types";

function englishOnly(text: string) {
  return text.replace(/[^\x00-\x7F]/g, " ").replace(/\s+/g, " ").trim();
}

export function buildNoTextImagePrompt(plan: CreativePlan): string {
  const analysis = plan.productAnalysis;
  const visibleFeatures =
    analysis?.visibleFeatures?.map(englishOnly).filter(Boolean).join(", ") || "all visible product features";

  // Determine plan style from planName or colorDirection
  const planNameLower = (plan.planName || "").toLowerCase();
  const colorLower = (plan.colorDirection || "").toLowerCase();
  
  const isDarkMode = planNameLower.includes("dark") || planNameLower.includes("luxury") || 
    colorLower.includes("dark") || colorLower.includes("black") || colorLower.includes("navy");
  const isLightMode = planNameLower.includes("clean") || planNameLower.includes("light") || 
    planNameLower.includes("professional") || colorLower.includes("light") || colorLower.includes("white");
  const isBoldMode = planNameLower.includes("bold") || planNameLower.includes("creative") || 
    planNameLower.includes("dynamic") || colorLower.includes("bold") || colorLower.includes("vibrant");

  // Determine style-specific rendering instructions
  let styleInstructions = "";
  if (isDarkMode) {
    styleInstructions = `
DARK LUXURY STYLE — Specific rendering:
- Background: deep charcoal (#1a1a2e), navy (#0f1923), or pure black with subtle gradient or vignette
- Lighting: dramatic side lighting, rim light on product edges, deep shadows
- Product: large and commanding (60-70% of frame), floating or on a reflective surface
- Text headline: LARGE gradient text (gold→copper or silver→white) with subtle glow/shadow
- Feature points: circular icon badges with gold/copper rings, placed in a grid or arc around the product
- Technical specs: BIG BOLD white numbers with accent colored units, placed prominently
- Bottom bar: dark translucent bar with gold/copper divider lines
- Accent: gold, copper, or electric blue highlights on key elements
- Mood: expensive, premium, aerospace-grade quality
`;
  } else if (isLightMode) {
    styleInstructions = `
CLEAN PROFESSIONAL STYLE — Specific rendering:
- Background: soft white (#f8f9fa), pale gray, or very subtle cool gradient
- Lighting: clean even studio lighting, soft shadows, crisp highlights
- Product: 40-50% of frame, centered or slightly offset, with breathing room
- Text headline: dark charcoal or navy text, clean sans-serif, strong contrast
- Feature points: minimal icon badges with thin colored rings, aligned in clean rows or columns
- Technical specs: dark bold numbers with light gray units, clean typography
- Bottom bar: light gray or white bar with subtle separators
- Accent: a SINGLE brand color (teal, blue, or product's natural metal tone) used sparingly
- Mood: medical-grade precision, trustworthy, institutional quality
`;
  } else {
    styleInstructions = `
BOLD CREATIVE STYLE — Specific rendering:
- Background: dynamic diagonal gradient, split-color blocks, or subtle geometric pattern
- Lighting: high contrast with colored light sources (subtle colored reflections on product)
- Product: dynamic angle (15-30° tilt), partial crop showing 70-80%, overlapping with graphic shapes
- Text headline: BOLD oversized text with creative treatment (outline, drop shadow, or color block behind)
- Feature points: asymmetric placement, some with icons, some with accent bars, varying sizes
- Technical specs: large numbers integrated into the design, not just listed
- Bottom bar: integrated into background design, not a separate strip
- Accent: sophisticated color pair (teal+coral, purple+gold, or product-inspired)
- Graphic elements: subtle diagonal lines, circular accents, or geometric shapes as decoration
- Mood: innovative, forward-thinking, stands out from boring competitors
`;
  }

  // Build on-image text instructions from copyBlocks
  const textBlocks: string[] = [];
  if (plan.copyBlocks?.length) {
    textBlocks.push(`=== ON-IMAGE TEXT LAYOUT ===`);
    textBlocks.push(`Create a PROFESSIONALLY DESIGNED information layout. Do NOT simply list text blocks.`);
    textBlocks.push(`Use proper graphic design principles: hierarchy, alignment, contrast, white space.`);
    textBlocks.push(``);
    
    // Group by role
    const headlines = plan.copyBlocks.filter(b => b.role === "headline");
    const subheadlines = plan.copyBlocks.filter(b => b.role === "subheadline");
    const coreClaims = plan.copyBlocks.filter(b => b.role === "core_claim");
    const featurePoints = plan.copyBlocks.filter(b => b.role === "feature_point");
    const technicalPoints = plan.copyBlocks.filter(b => b.role === "technical_point");
    const comparisonLabels = plan.copyBlocks.filter(b => b.role === "comparison_label");
    const applicationLabels = plan.copyBlocks.filter(b => b.role === "application_label");
    const bottomInfos = plan.copyBlocks.filter(b => b.role === "bottom_info");
    const badges = plan.copyBlocks.filter(b => b.role === "badge" || b.title.toLowerCase().includes("new") || b.title.toLowerCase().includes("premium"));
    
    if (headlines.length) {
      textBlocks.push(`HEADLINE — Hero Typography:`);
      headlines.forEach(h => {
        textBlocks.push(`  "${englishOnly(h.title)}" — Render as LARGE, BOLD, ALL CAPS text.`);
      });
      textBlocks.push(`  - Size: Should be the largest text element, 20-30% of image width`);
      textBlocks.push(`  - Style: Gradient fill, metallic sheen, or strong drop shadow for depth`);
      textBlocks.push(`  - Placement: Top area, spanning 40-60% of width, commanding attention`);
      textBlocks.push(``);
    }
    
    if (subheadlines.length || coreClaims.length) {
      textBlocks.push(`SUBHEADLINE / CLAIM — Supporting Typography:`);
      [...subheadlines, ...coreClaims].forEach(s => {
        const text = s.subtitle ? `${s.title}: ${s.subtitle}` : s.body ? `${s.title}: ${s.body}` : s.title;
        textBlocks.push(`  "${englishOnly(text)}" — Medium size, clean readable font`);
      });
      textBlocks.push(`  - Placement: Directly below headline or integrated into headline block`);
      textBlocks.push(`  - Style: Can have subtle background panel or accent underline`);
      textBlocks.push(``);
    }
    
    if (featurePoints.length) {
      textBlocks.push(`FEATURE POINTS — Visual Feature Grid (${featurePoints.length} items):`);
      textBlocks.push(`  Present as a designed feature grid or card cluster, NOT a bullet list.`);
      featurePoints.forEach((f, i) => {
        const text = f.body ? `${f.title} — ${f.body}` : f.title;
        textBlocks.push(`  ${i+1}. "${englishOnly(text)}"`);
      });
      textBlocks.push(`  - Layout options: 2×2 grid, vertical stack with icon badges, or arc around product`);
      textBlocks.push(`  - Each feature: circular icon badge (with simple symbol like ✓, ⚙, ✦) + title + body`);
      textBlocks.push(`  - Badge style: colored ring border, white or light fill, icon in center`);
      textBlocks.push(`  - Title: bold, slightly colored or white with shadow`);
      textBlocks.push(`  - Body: smaller, clean, readable`);
      textBlocks.push(``);
    }
    
    if (technicalPoints.length) {
      textBlocks.push(`TECHNICAL SPECIFICATIONS — Bold Data Display:`);
      technicalPoints.forEach(t => {
        const text = t.body ? `${t.title}: ${t.body}` : t.title;
        textBlocks.push(`  "${englishOnly(text)}"`);
      });
      textBlocks.push(`  - Display: BIG BOLD numbers with units (e.g., "±0.02mm" in 3× larger font)`);
      textBlocks.push(`  - Layout: Horizontal spec bar with separators, or floating data points`);
      textBlocks.push(`  - Style: Numbers in accent color, labels in white/gray`);
      textBlocks.push(`  - NEVER use thin blue annotation lines like CAD software`);
      textBlocks.push(``);
    }
    
    if (comparisonLabels.length) {
      textBlocks.push(`COMPARISON — Visual Contrast:`);
      comparisonLabels.forEach(c => {
        textBlocks.push(`  "${englishOnly(c.title)}"`);
      });
      textBlocks.push(`  - Use checkmarks vs X marks, or color-coded panels (green vs red, or gold vs gray)`);
      textBlocks.push(`  - Style: Two distinct visual blocks with clear hierarchy`);
      textBlocks.push(``);
    }
    
    if (applicationLabels.length) {
      textBlocks.push(`APPLICATION TAGS — Small Labels:`);
      applicationLabels.forEach(a => {
        const text = a.body ? `${a.title} — ${a.body}` : a.title;
        textBlocks.push(`  "${englishOnly(text)}" as a small rounded tag`);
      });
      textBlocks.push(`  - Style: Rounded pill-shaped tags with colored borders or fills`);
      textBlocks.push(``);
    }
    
    if (bottomInfos.length) {
      textBlocks.push(`BOTTOM INFO BAR — Trust Bar:`);
      bottomInfos.forEach(b => {
        textBlocks.push(`  "${englishOnly(b.title)}"`);
      });
      textBlocks.push(`  - Layout: Horizontal bar across bottom 10-15% of image`);
      textBlocks.push(`  - Style: Short phrases separated by vertical dividers (|) or small icons`);
      textBlocks.push(`  - Font: Small but bold, all caps or title case`);
      textBlocks.push(`  - Background: Subtle bar or integrated into bottom edge`);
      textBlocks.push(``);
    }
    
    if (badges.length) {
      textBlocks.push(`BADGES — Corner Elements:`);
      badges.forEach(b => {
        textBlocks.push(`  "${englishOnly(b.title)}" — Corner badge or ribbon`);
      });
      textBlocks.push(`  - Style: Angled ribbon, rounded corner tag, or overlapping circular badge`);
      textBlocks.push(`  - Colors: Gold for premium, red/orange for urgency, blue for tech`);
      textBlocks.push(`  - Placement: Top-right or top-left corner, overlapping edge`);
      textBlocks.push(``);
    }
    
    textBlocks.push(`CRITICAL DESIGN RULES:`);
    textBlocks.push(`- NEVER use thin blue CAD-style annotation lines or measurement arrows`);
    textBlocks.push(`- NEVER place all text in a single column on one side — distribute information creatively`);
    textBlocks.push(`- NEVER use plain text on plain background — always have design elements (shapes, gradients, panels)`);
    textBlocks.push(`- Text must have proper hierarchy: headline > subheadline > features > specs > bottom bar`);
    textBlocks.push(`- Use graphic shapes: rounded rectangles, circles, diagonal lines, subtle patterns as design elements`);
    textBlocks.push(`- All text must be sharp, perfectly legible, and professionally typeset`);
    textBlocks.push(``);
  }

  const parts: string[] = [
    `=== PREMIUM E-COMMERCE PRODUCT HERO IMAGE ===`,
    `This MUST be a world-class e-commerce product detail page hero image.`
  ];

  // Add style-specific instructions at the top
  parts.push(styleInstructions.trim());
  parts.push(``);

  parts.push(`=== COMPOSITION AND PRODUCT PLACEMENT ===`);
  parts.push(`Product placement and size: ${plan.layoutDirection}`);
  parts.push(`Visual complexity: ${plan.visualComplexity}. Information density: ${plan.informationDensity}.`);
  parts.push(`CRITICAL: Product must be positioned and sized DIFFERENTLY from a standard centered catalog photo.`);
  parts.push(`- Options: large close-up (fills 60-70% of frame), asymmetric placement, dynamic angle, partial overlap with text panels`);
  parts.push(`- Product should cast a realistic shadow or have a subtle reflection`);
  parts.push(`- Background should have DEPTH: gradient, subtle texture, or environmental context`);
  parts.push(``);

  parts.push(`=== PRODUCT SUBJECT ===`);
  parts.push(`Product: "${plan.productName}".`);
  parts.push(analysis?.productType ? `Product type: ${englishOnly(analysis.productType)}.` : "");
  parts.push(`Visible features: ${visibleFeatures}.`);
  parts.push(`CRITICAL: Preserve the EXACT product structure, proportions, and visible features.`);
  parts.push(`Do NOT alter the product shape, add/remove parts, or change proportions.`);
  parts.push(analysis?.isolationInstruction ? `Isolation: ${englishOnly(analysis.isolationInstruction)}.` : "");
  parts.push(``);

  parts.push(`=== COLOR AND LIGHTING ===`);
  parts.push(`Color palette: ${plan.colorDirection}`);
  parts.push(`Lighting: Dramatic and intentional. Use lighting to create depth, highlight product edges, and separate from background.`);
  parts.push(`- Dark mode: rim lighting, dramatic shadows, subtle ambient occlusion`);
  parts.push(`- Light mode: clean studio lighting, soft gradients, crisp shadows`);
  parts.push(`- Bold mode: colored accent lighting, high contrast, graphic shadows`);
  parts.push(``);

  parts.push(...textBlocks);

  parts.push(`=== QUALITY STANDARDS ===`);
  parts.push(`Photorealistic commercial product photography, studio-quality lighting, crisp edges, high resolution.`);
  parts.push(`Typography must be PROFESSIONAL: proper kerning, balanced weights, clear hierarchy.`);
  parts.push(`Design must look like it was created by a top-tier graphic designer, not generated by AI.`);
  parts.push(`No watermark, no "AI generated" mark, no signature.`);

  return parts.filter(Boolean).join("\n");
}
