import type {
  CopyBlock,
  CreativePlan,
  InformationDensity,
  LayoutType,
  PlanArchetype,
  VisualComplexity,
} from "@/app/ai-image/v2/types";
import type { VisualStyleId } from "@/app/ai-image/v2/plan-taxonomy";
import { DEFAULT_THREE_PLAN_STYLE_IDS, getVisualStyleProfile } from "@/app/ai-image/v2/plan-taxonomy";
import { buildLayoutOverlay } from "./layout-overlay";
import { buildImageGenerationPrompt, buildPlanSummaryPrompt } from "./prompt-builders";

type CopyProfile =
  | "headline_only"
  | "headline_labels"
  | "feature_medium"
  | "technical_medium"
  | "comparison_medium"
  | "application_medium"
  | "bundle_medium"
  | "promo_rich";

interface TemplateVariant {
  name: string;
  layoutType: LayoutType;
  layoutDirection: string;
}

interface TemplateRule {
  id: string;
  archetype: PlanArchetype;
  imageType: string;
  visualComplexity: VisualComplexity;
  informationDensity: InformationDensity;
  copyProfile: CopyProfile;
  visualIdentity: string;
  colorDirection: string;
  layoutNonNegotiables: string;
  styleIds: VisualStyleId[];
  variants: TemplateVariant[];
  riskRules?: string[];
}

const TEMPLATE_RULES: Record<string, TemplateRule> = {
  "tpl-white-bg-hero": {
    id: "tpl-white-bg-hero",
    archetype: "hero_feature",
    imageType: "platform_main_image",
    visualComplexity: "simple",
    informationDensity: "low",
    copyProfile: "headline_labels",
    visualIdentity:
      "Pure white or very light neutral gray Amazon/Temu main-image photography. Full product only, centered or slightly offset, 70-85% of the frame, deep focus, soft diffused overhead light, gentle natural shadow, subtle low-opacity ground reflection, no accent colors, no texture, no environment.",
    colorDirection:
      "Background #FFFFFF or #F7F7F7 only; text #111111; product uses natural material colors only; no accent color, no color blocks, no gradients.",
    layoutNonNegotiables:
      "Full product must remain visible with no cropped edges. One concise headline plus 2-3 short labels only. No panels, bottom bars, grids, decorative frames, badges, or environment.",
    styleIds: ["clean_catalog", "light_technical", "premium_black"],
    variants: [
      {
        name: "Centered Catalog",
        layoutType: "premium_center_product_minimal_text",
        layoutDirection:
          "Center the full product at 80% frame scale with headline in the upper third and 2-3 small labels in a tidy row beneath the product.",
      },
      {
        name: "Offset Thumbnail",
        layoutType: "hero_left_text_right_product",
        layoutDirection:
          "Place the full product slightly right of center at 75% scale, headline in the upper-left negative space, and 2-3 short labels stacked vertically along the left edge.",
      },
      {
        name: "Low Reflection",
        layoutType: "premium_center_product_minimal_text",
        layoutDirection:
          "Place the full product slightly below center at 72% scale with a soft reflection underneath; headline in lower third and 2-3 compact labels aligned above the reflection.",
      },
    ],
  },
  "tpl-temu-promo": {
    id: "tpl-temu-promo",
    archetype: "promo_sales",
    imageType: "promo_sales",
    visualComplexity: "complex",
    informationDensity: "high",
    copyProfile: "promo_rich",
    visualIdentity:
      "High-energy Temu promo style: deep matte black base, hard-edged geometric color blocks, dramatic upper-left key light, subtle colored rim light, crisp shadow, sharp product, bold commercial impact.",
    colorDirection:
      "Background #0A0A0A to #1A1A1A; choose one dominant accent per plan from #007BFF, #FF6B00, #FF2D55, or #39FF14; text #FFFFFF; panels #111111; product natural colors.",
    layoutNonNegotiables:
      "Asymmetric high-impact promo layout with oversized headline, subheadline, 3-4 feature blocks, and bottom info. No fake prices, discounts, countdowns, CTA buttons, or platform marks.",
    styleIds: ["high_contrast_promo", "dark_technical", "bundle_pop"],
    variants: [
      {
        name: "Diagonal Attack",
        layoutType: "top_headline_bottom_feature_bar",
        layoutDirection:
          "Oversized headline spans top-left 25%; product sits center-right at 60% scale; angular diagonal accent slices run behind it; three feature badges stagger down the right side with a bottom info strip.",
      },
      {
        name: "Center Burst",
        layoutType: "large_headline_with_bottom_info_bar",
        layoutDirection:
          "Product anchors the center at 62% scale with hard-edged color blocks radiating behind it; headline is top-center; feature cards form a compact lower-left cluster and bottom info spans the width.",
      },
      {
        name: "Side Poster",
        layoutType: "hero_left_text_right_product",
        layoutDirection:
          "Product occupies the right 55%; headline and core claim stack aggressively on the left; feature blocks form a vertical rhythm between headline and bottom bar.",
      },
    ],
  },
  "tpl-feature-explanation": {
    id: "tpl-feature-explanation",
    archetype: "multi_panel_info",
    imageType: "feature_explanation",
    visualComplexity: "medium",
    informationDensity: "medium",
    copyProfile: "feature_medium",
    visualIdentity:
      "Clean feature-explanation image on cool light gray whiteboard background, deep focus, even upper-front studio light, slight ground reflection, structured white information panels, restrained technical clarity.",
    colorDirection:
      "Background #E8ECF0 to #F0F2F5; panels #FFFFFF; primary text #111827; secondary text #475569; one restrained accent #0066CC, #008080, or #4682B4.",
    layoutNonNegotiables:
      "Product full and sharp at 40-50% frame. Use headline, subheadline, 3-4 feature panels with body copy, and optional bottom info. No dark backgrounds, warm accents, comparison labels, or fake specs.",
    styleIds: ["light_technical", "dark_technical", "clean_catalog"],
    variants: [
      {
        name: "Right Panel Stack",
        layoutType: "hero_left_text_right_product",
        layoutDirection:
          "Product sits left-center at 48% scale; headline top-left; 3-4 feature panels stack in a precise right column with thin dividers.",
      },
      {
        name: "Bottom Grid",
        layoutType: "large_headline_with_bottom_info_bar",
        layoutDirection:
          "Product is centered at 45% scale; headline spans the top; feature panels form a clean 2x2 grid across the bottom half without overlapping the product.",
      },
      {
        name: "Split Explainer",
        layoutType: "hero_right_product_left_features",
        layoutDirection:
          "Product occupies right 45%; headline and subheadline align top-left; feature blocks stack on the left with icon circles and subtle blue dividers.",
      },
    ],
  },
  "tpl-macro-detail": {
    id: "tpl-macro-detail",
    archetype: "technical_breakdown",
    imageType: "macro_detail",
    visualComplexity: "medium",
    informationDensity: "low",
    copyProfile: "headline_only",
    visualIdentity:
      "Macro detail photography on near-pure black, single hard warm side light from camera-left at 45 degrees, no fill, strong specular edge highlights, shallow razor-thin focal plane, dramatic cropped product texture.",
    colorDirection:
      "Background RGB 5-15 / #050505 to #0F0F0F; product natural metal tones only; optional warm copper or amber edge highlight #B87333 or #D97706; text #F5F5F0.",
    layoutNonNegotiables:
      "Show only 40-60% of the product, cropped dramatically. Headline only. Optional 1-2 optical magnified insets with hairline borders. No body text, fake dimensions, gradients, color blocks, or full-product catalog view.",
    styleIds: ["macro_chiaroscuro", "dark_technical", "premium_black"],
    variants: [
      {
        name: "Edge Slice",
        layoutType: "technical_callout_with_insets",
        layoutDirection:
          "Crop the product diagonally through the frame so the key edge crosses center; headline sits in black negative space; one small circular detail inset floats in the opposite corner.",
      },
      {
        name: "Surface Window",
        layoutType: "technical_callout_with_insets",
        layoutDirection:
          "Product texture fills 75% of the frame from lower-left to upper-right; headline is tiny in upper-left; two rectangular optical insets compare adjacent visible surface zones.",
      },
      {
        name: "Shadow Reveal",
        layoutType: "premium_center_product_minimal_text",
        layoutDirection:
          "Product detail emerges from darkness at center-right with 60% cropped visibility; headline sits lower-left with generous black space and no other text.",
      },
    ],
  },
  "tpl-advantage-comparison": {
    id: "tpl-advantage-comparison",
    archetype: "comparison_story",
    imageType: "comparison_chart",
    visualComplexity: "complex",
    informationDensity: "high",
    copyProfile: "comparison_medium",
    visualIdentity:
      "Strict split-screen advantage comparison on one unified deep dark background: left same product category desaturated and dim with red X, right reference product full color and warm sharp with green check, clear VS divider, bottom advantage bar.",
    colorDirection:
      "Unified background #151515 to #1E1E1E; left desaturated blue-gray #5A6A7A with red X #DC2626; right natural product color with warm amber #FFB347 and green check #22C55E; VS #FFFFFF or #E0E0E0; bottom bar #1A1A1A.",
    layoutNonNegotiables:
      "All plans must be 50/50 vertical comparison with center VS, same product category both sides, red X left, green check right, right side slightly larger/brighter, and bottom feature bar with three cards.",
    styleIds: ["comparison_drama", "dark_technical", "high_contrast_promo"],
    variants: [
      {
        name: "Classic VS",
        layoutType: "comparison_two_columns",
        layoutDirection:
          "Strict 50/50 split with a centered VS badge; labels above both products; descriptors below; bottom 18% contains three green-accent feature cards.",
      },
      {
        name: "Diagonal Divider",
        layoutType: "comparison_two_columns",
        layoutDirection:
          "Maintain equal left-right comparison but use a subtle diagonal central divider behind the VS; products angle inward toward the center; bottom feature bar remains straight.",
      },
      {
        name: "Large Right Hero",
        layoutType: "comparison_two_columns",
        layoutDirection:
          "Left product sits at 32% of its half with dim treatment; right product grows to 45% of its half with stronger halo; VS remains centered and bottom cards stay evenly spaced.",
      },
    ],
  },
  "tpl-lifestyle-scene": {
    id: "tpl-lifestyle-scene",
    archetype: "application_scene",
    imageType: "lifestyle_scene",
    visualComplexity: "medium",
    informationDensity: "medium",
    copyProfile: "application_medium",
    visualIdentity:
      "Authentic warm industrial lifestyle scene: CNC bed, workshop bench, vise, metal shavings, worn surfaces, shallow bokeh background, product tack-sharp and brightest, warm 3000K-3500K ambient plus crisp key light.",
    colorDirection:
      "Warm amber #D4A574, workshop brown #8B6914, steel gray #708090, oxidized metal #B87333; text #FFFFFF with soft shadow; no cool blue/neon/pure black backgrounds.",
    layoutNonNegotiables:
      "Product full and sharp at 35-45% frame, off-center by rule of thirds. Use headline, 2-3 application labels, and bottom info. Environment must support product, not outshine it.",
    styleIds: ["workshop_lifestyle", "light_technical", "premium_black"],
    variants: [
      {
        name: "Workbench Pause",
        layoutType: "four_panel_application_grid",
        layoutDirection:
          "Product rests on a worn workbench in the left third; headline in upper-left negative space; application labels stack along right edge over blurred workshop details.",
      },
      {
        name: "Machine Bed",
        layoutType: "hero_left_text_right_product",
        layoutDirection:
          "Product is hero-sharp on a CNC bed at center-right; headline and compact labels sit on the left over warm blurred machinery; bottom info is subtle.",
      },
      {
        name: "Foreground Depth",
        layoutType: "diagonal_product_with_side_features",
        layoutDirection:
          "Product sits center at 42% scale with blurred foreground tools creating depth; headline top-right; application labels follow a diagonal rhythm through negative space.",
      },
    ],
  },
  "tpl-bundle-showcase": {
    id: "tpl-bundle-showcase",
    archetype: "multi_panel_info",
    imageType: "bundle_showcase",
    visualComplexity: "complex",
    informationDensity: "medium",
    copyProfile: "bundle_medium",
    visualIdentity:
      "Bundle showcase with multiple related items or variants, deep navy or charcoal base, hard geometric accent blocks, evenly lit full products, deep focus, energetic but orderly product arrangement.",
    colorDirection:
      "Primary background #1A2744 or #2D2D2D; accent blocks #007BFF, #FF6B00, or #FF2D55; text #FFFFFF; panels #111827; product natural colors.",
    layoutNonNegotiables:
      "Show 3-5 related items or deliberate variants, all fully visible and evenly lit. Copy should emphasize complete set, full range, variety, and value. No fake prices or bundle values.",
    styleIds: ["bundle_pop", "high_contrast_promo", "clean_catalog"],
    variants: [
      {
        name: "Hero Plus Arc",
        layoutType: "large_headline_with_bottom_info_bar",
        layoutDirection:
          "One hero item at center 48% scale with 2-3 smaller variants arranged in an arc; headline top-left; feature badges beneath the arc.",
      },
      {
        name: "Equal Row",
        layoutType: "top_headline_bottom_feature_bar",
        layoutDirection:
          "All items are equal 20-25% scale in a clean horizontal row; headline top-center; three value feature blocks and bottom info align below.",
      },
      {
        name: "Staggered Grid",
        layoutType: "four_panel_application_grid",
        layoutDirection:
          "Products form a staggered 2x2 or 3x2 grid with geometric color blocks separating them; headline and subheadline occupy upper-left.",
      },
    ],
  },
  "tpl-spec-technical": {
    id: "tpl-spec-technical",
    archetype: "technical_breakdown",
    imageType: "technical_spec",
    visualComplexity: "complex",
    informationDensity: "high",
    copyProfile: "technical_medium",
    visualIdentity:
      "Technical documentation style on cool slate CAD-like grid, flat even overhead lighting, infinite depth of field, product in isometric/profile/top-down technical angle, clean placeholder panels and precise leader lines.",
    colorDirection:
      "Background #4A5568 to #5A6A7A with grid #E2E8F0 at 5-8% opacity; text/lines #FFFFFF or #E2E8F0; accent #00BCD4 or #2196F3 only; product natural colors.",
    layoutNonNegotiables:
      "No real numbers or invented specifications. Use placeholder-style labels and values only. Product full and sharp at 40-50%, technical panels on right, clean annotation lines to visible structures.",
    styleIds: ["light_technical", "dark_technical", "clean_catalog"],
    variants: [
      {
        name: "Right Spec Rail",
        layoutType: "technical_callout_with_insets",
        layoutDirection:
          "Product sits left-center in isometric view; 3-4 placeholder spec panels align in a right rail; thin leader lines connect to visible product features.",
      },
      {
        name: "Blueprint Center",
        layoutType: "exploded_layer_explanation",
        layoutDirection:
          "Product sits centered over the grid; headline top-left; panels surround the product in four corners with precise non-crossing leader lines.",
      },
      {
        name: "Top-Down Sheet",
        layoutType: "technical_callout_with_insets",
        layoutDirection:
          "Product is top-down or profile at 50% scale across the middle; technical panels form a bottom row with subtle leaders upward to actual features.",
      },
    ],
  },
  "tpl-premium-luxury": {
    id: "tpl-premium-luxury",
    archetype: "premium_showcase",
    imageType: "premium_showcase",
    visualComplexity: "medium",
    informationDensity: "low",
    copyProfile: "headline_only",
    visualIdentity:
      "Premium luxury product photography in near-pure black void, sculptural full product, generous negative space, dramatic primary rim light from behind, minimal key light, satin reflection, deep focus, luxury watch-ad restraint.",
    colorDirection:
      "Background #0A0A0A to #111111; text #F7E7CE or #FFFFFF; rim light #FFF8E7, #FFFFFF, or #C0C0C0; optional champagne accent #F7E7CE only; no blue, green, red, color blocks, or gradients.",
    layoutNonNegotiables:
      "Headline only. Product full at 60-70% frame with maximum negative space. No feature labels, bottom info, panels, particles, lifestyle, gradients, or extra products.",
    styleIds: ["premium_black", "macro_chiaroscuro", "clean_catalog"],
    variants: [
      {
        name: "Gallery Center",
        layoutType: "premium_center_product_minimal_text",
        layoutDirection:
          "Product rests centered slightly below midpoint at 65% scale; headline floats in upper third with wide letter spacing and no other text.",
      },
      {
        name: "Low Reflection",
        layoutType: "premium_center_product_minimal_text",
        layoutDirection:
          "Product sits lower center at 62% scale with satin reflection fading over 20% frame height; headline is small and centered above.",
      },
      {
        name: "Edge Rim",
        layoutType: "premium_center_product_minimal_text",
        layoutDirection:
          "Product is slightly off-center to the right at 60% scale so rim light traces the silhouette; headline sits upper-left in the black void.",
      },
    ],
  },
  "tpl-dimension-annotation": {
    id: "tpl-dimension-annotation",
    archetype: "technical_breakdown",
    imageType: "dimension_annotation",
    visualComplexity: "complex",
    informationDensity: "medium",
    copyProfile: "technical_medium",
    visualIdentity:
      "Clean engineering drawing sheet style: white or very light warm gray background, full product at dimension-revealing angle, deep focus, even diffused light, thin measurement lines, arrowheads, placeholder dimension boxes.",
    colorDirection:
      "Background #FFFFFF or #F5F5F0; annotation text/lines #333333 or #666666; panel fill #F0F0F0; panel border #CCCCCC; one subtle leader-line accent #2196F3 or #F44336; product natural colors.",
    layoutNonNegotiables:
      "No real measurement numbers. Dimension values must be blanks, dashes, or generic labels. Full product visible at 50-60%; annotation lines point only to visible features and must not cross.",
    styleIds: ["light_technical", "dark_technical", "clean_catalog"],
    variants: [
      {
        name: "Radial Dimensions",
        layoutType: "technical_callout_with_insets",
        layoutDirection:
          "Product sits center-left at 55% scale; straight measurement lines radiate to empty right and top spaces; headline top-left; placeholder boxes stay aligned.",
      },
      {
        name: "Profile Sheet",
        layoutType: "exploded_layer_explanation",
        layoutDirection:
          "Product uses side/profile view across the center; horizontal length guide above and diameter/height guides below; labels use dashes or generic names only.",
      },
      {
        name: "Isometric Markup",
        layoutType: "technical_callout_with_insets",
        layoutDirection:
          "Product is isometric at 52% scale; annotation boxes form a neat perimeter around it with short non-crossing leader lines to holes, edges, slots, or threads.",
      },
    ],
  },
};

export function getTemplateRule(templateId?: string): TemplateRule | undefined {
  return templateId ? TEMPLATE_RULES[templateId] : undefined;
}

export function getTemplateRulePrompt(templateId?: string): string {
  const rule = getTemplateRule(templateId);
  if (!rule) return "";
  const variants = rule.variants
    .map((variant, index) => `${index + 1}. ${variant.name}: ${variant.layoutDirection}`)
    .join("\n");
  const styles = rule.styleIds
    .map((styleId, index) => {
      const style = getVisualStyleProfile(styleId);
      return `${index + 1}. ${style.label}: ${style.visualDirection} Color: ${style.colorDirection}`;
    })
    .join("\n");

  return `
STRUCTURED TEMPLATE RULES — MUST FOLLOW:
- templateId: ${rule.id}
- template purpose / structure archetype: ${rule.archetype}
- imageType: ${rule.imageType}
- visualComplexity: ${rule.visualComplexity}
- informationDensity: ${rule.informationDensity}
- copyProfile: ${rule.copyProfile}
- shared template constraints: ${rule.visualIdentity}
- non-negotiable layout rules: ${rule.layoutNonNegotiables}
- style rule: the 3 plans must use DIFFERENT visual styles from this allowed style set.
${styles}
- variation rule: each plan must use a different layout/composition variant below.
${variants}
`.trim();
}

function trimText(value: string, fallback: string): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned || fallback;
}

function block(id: string, title: string, role: CopyBlock["role"], priority: number, body?: string, iconHint?: string): CopyBlock {
  return {
    id,
    title: trimText(title, "PRODUCT"),
    body: body ? trimText(body, "") : undefined,
    role,
    iconHint,
    priority,
  };
}

function chooseExisting(blocks: CopyBlock[], roles: CopyBlock["role"][], limit: number): CopyBlock[] {
  return blocks.filter((item) => roles.includes(item.role)).slice(0, limit);
}

function safeFeatureBlocks(plan: CreativePlan, limit: number): CopyBlock[] {
  const source = chooseExisting(plan.copyBlocks || [], ["feature_point", "technical_point", "application_label"], limit);
  if (source.length > 0) {
    return source.map((item, index) => ({
      ...item,
      id: item.id || `cb-feature-${index}`,
      role: "feature_point",
      priority: index + 2,
    }));
  }

  return (plan.sellingPoints || []).slice(0, limit).map((point, index) =>
    block(`cb-feature-${index}`, point.split("/")[0], "feature_point", index + 2, point.includes("/") ? point.split("/").slice(1).join("/").trim() : undefined)
  );
}

function enforceCopyProfile(plan: CreativePlan, profile: CopyProfile): CopyBlock[] {
  const headline = block("cb-headline", plan.headline, "headline", 1);
  const subtitle = plan.subtitle ? block("cb-subheadline", plan.subtitle, "subheadline", 2) : undefined;

  switch (profile) {
    case "headline_only":
      return [headline];
    case "headline_labels": {
      const labels = safeFeatureBlocks(plan, 3).map((item, index) => ({
        ...item,
        id: `cb-label-${index}`,
        title: item.title.split(/\s+/).slice(0, 2).join(" "),
        body: undefined,
        role: "feature_point" as const,
        priority: index + 2,
      }));
      return [headline, ...labels];
    }
    case "comparison_medium": {
      const features = safeFeatureBlocks(plan, 4).map((item, index) => ({ ...item, priority: index + 5 }));
      const bottom = features.slice(0, 3).map((item, index) => block(`cb-bottom-${index}`, item.title, "bottom_info", index + 9));
      return [
        headline,
        ...(subtitle ? [subtitle] : []),
        block("cb-vs-left", "ORDINARY", "comparison_label", 3),
        block("cb-vs-right", "OUR PRODUCT", "comparison_label", 4),
        ...features,
        ...bottom,
      ];
    }
    case "application_medium": {
      const apps = safeFeatureBlocks(plan, 3).map((item, index) => ({
        ...item,
        role: "application_label" as const,
        body: item.body || item.subtitle || "Built for real workshop use.",
        priority: index + 3,
      }));
      const bottom = apps.slice(0, 3).map((item, index) => block(`cb-bottom-${index}`, item.title, "bottom_info", index + 7));
      return [headline, ...apps, ...bottom];
    }
    case "technical_medium": {
      const tech = safeFeatureBlocks(plan, 4).map((item, index) => ({
        ...item,
        role: "technical_point" as const,
        body: item.body || item.subtitle || "Placeholder-style structural label only.",
        priority: index + 3,
      }));
      const bottom = tech.slice(0, 3).map((item, index) => block(`cb-bottom-${index}`, item.title, "bottom_info", index + 8));
      return [headline, ...(subtitle ? [subtitle] : []), ...tech, ...bottom];
    }
    case "bundle_medium":
    case "feature_medium": {
      const features = safeFeatureBlocks(plan, 4).map((item, index) => ({
        ...item,
        body: item.body || item.subtitle || "Clear product benefit for quick e-commerce scanning.",
        priority: index + 3,
      }));
      const bottom = features.slice(0, 3).map((item, index) => block(`cb-bottom-${index}`, item.title, "bottom_info", index + 8));
      return [headline, ...(subtitle ? [subtitle] : []), ...features, ...bottom];
    }
    case "promo_rich": {
      const features = safeFeatureBlocks(plan, 4).map((item, index) => ({
        ...item,
        body: item.body || item.subtitle || "Fast, punchy benefit copy for a high-impact sales visual.",
        priority: index + 4,
      }));
      const bottom = features.slice(0, 3).map((item, index) => block(`cb-bottom-${index}`, item.title, "bottom_info", index + 9));
      return [
        headline,
        ...(subtitle ? [subtitle] : []),
        block("cb-claim", "BUILT TO PERFORM", "core_claim", 3),
        ...features,
        ...bottom,
      ];
    }
  }
}

export function applyTemplateRuleToPlan(
  plan: CreativePlan,
  templateId?: string,
  variantIndex = 0,
  templatePrompt?: string
): CreativePlan {
  const rule = getTemplateRule(templateId || plan.templateId);
  if (!rule) {
    const style = getVisualStyleProfile(DEFAULT_THREE_PLAN_STYLE_IDS[variantIndex % DEFAULT_THREE_PLAN_STYLE_IDS.length]);
    const next: CreativePlan = {
      ...plan,
      templateId: templateId || plan.templateId,
      planName: plan.planName?.includes(style.label) ? plan.planName : `${plan.planName} · ${style.label}`,
      visualDirection: `${style.visualDirection}\nSaved-template constraints: ${templatePrompt || "Follow the selected saved template's saved layout, visual, and color direction without copying old product-specific content."}\nThis plan's visual style is "${style.label}", intentionally different from the other two plans in this generation record.`,
      colorDirection: style.colorDirection,
      layoutDirection: `${plan.layoutDirection}\nDiversity requirement: use a distinct composition, product angle/crop, information density, and text rhythm from the other two plans.`,
    };
    next.layoutOverlay = buildLayoutOverlay(
      next.headline,
      next.subtitle,
      next.sellingPoints,
      next.layoutDirection,
      next.imageType,
      next.copyBlocks
    );
    next.planSummaryPrompt = buildPlanSummaryPrompt(next);
    next.imageGenerationPrompt = buildImageGenerationPrompt(next);
    next.finalPrompt = next.imageGenerationPrompt;
    return next;
  }

  const variant = rule.variants[variantIndex % rule.variants.length];
  const style = getVisualStyleProfile(rule.styleIds[variantIndex % rule.styleIds.length]);
  const copyBlocks = enforceCopyProfile(plan, rule.copyProfile);
  const sellingPoints = copyBlocks
    .filter((item) => item.role !== "headline" && item.role !== "subheadline")
    .map((item) => item.body ? `${item.title} / ${item.body}` : item.title);

  const layoutDirection = `Layout type: ${variant.layoutType}. ${variant.layoutDirection}\nShared template constraints: ${rule.layoutNonNegotiables}`;
  const visualDirection = `${style.visualDirection}\nTemplate purpose constraints: ${rule.visualIdentity}\nVariant "${variant.name}": use this composition variant. This plan's visual style is "${style.label}", intentionally different from the other two plans in this generation record.`;

  const next: CreativePlan = {
    ...plan,
    planName: plan.planName?.includes(variant.name) ? plan.planName : `${plan.planName} · ${variant.name}`,
    planArchetype: rule.archetype,
    templateId: rule.id,
    imageType: rule.imageType,
    subtitle: rule.copyProfile === "headline_only" || rule.copyProfile === "headline_labels" ? undefined : plan.subtitle,
    copyBlocks,
    sellingPoints,
    visualDirection,
    colorDirection: `${style.colorDirection}\nTemplate palette guardrails: ${rule.colorDirection}`,
    layoutDirection,
    visualComplexity: rule.visualComplexity,
    informationDensity: rule.informationDensity,
    riskWarnings: Array.from(new Set([...(plan.riskWarnings || []), ...(rule.riskRules || []), rule.layoutNonNegotiables])),
  };

  next.layoutOverlay = buildLayoutOverlay(
    next.headline,
    next.subtitle,
    next.sellingPoints,
    layoutDirection,
    next.imageType,
    next.copyBlocks
  );
  next.planSummaryPrompt = buildPlanSummaryPrompt(next);
  next.imageGenerationPrompt = buildImageGenerationPrompt(next);
  next.finalPrompt = next.imageGenerationPrompt;

  return next;
}
