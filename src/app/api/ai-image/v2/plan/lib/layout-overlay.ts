import type {
  LayoutOverlay,
  LayoutType,
  LayoutRegion,
  LayoutRegionRole,
  LayoutRegionPosition,
  TextBlock,
  TextBlockRole,
  TextBlockPosition,
  ColorTheme,
  VisualDensity,
  IconHint,
  IconType,
  CopyBlock,
} from "@/app/ai-image/v2/types";

function inferLayoutTypeFromDirection(layoutDirection: string, imageType: string): LayoutType {
  const ld = layoutDirection.toLowerCase();
  const it = imageType.toLowerCase();

  if (ld.includes("hero_left_text_right_product")) return "hero_left_text_right_product";
  if (ld.includes("hero_right_product_left_features")) return "hero_right_product_left_features";
  if (ld.includes("top_headline_bottom_feature_bar")) return "top_headline_bottom_feature_bar";
  if (ld.includes("comparison_two_columns")) return "comparison_two_columns";
  if (ld.includes("technical_callout_with_insets")) return "technical_callout_with_insets";
  if (ld.includes("exploded_layer_explanation")) return "exploded_layer_explanation";
  if (ld.includes("four_panel_application_grid")) return "four_panel_application_grid";
  if (ld.includes("large_headline_with_bottom_info_bar")) return "large_headline_with_bottom_info_bar";
  if (ld.includes("diagonal_product_with_side_features")) return "diagonal_product_with_side_features";
  if (ld.includes("premium_center_product_minimal_text")) return "premium_center_product_minimal_text";

  if (it.includes("comparison") || ld.includes("comparison") || ld.includes("vs") || ld.includes("ordinary")) {
    return "comparison_two_columns";
  }
  if (it.includes("detail") || ld.includes("detail") || ld.includes("magnifier") || ld.includes("callout") || ld.includes("inset")) {
    return "technical_callout_with_insets";
  }
  if (it.includes("technical") || ld.includes("technical") || ld.includes("annotation") || ld.includes("exploded")) {
    return "exploded_layer_explanation";
  }
  if (it.includes("scene") || ld.includes("scene") || ld.includes("application") || ld.includes("grid")) {
    return "four_panel_application_grid";
  }
  if (it.includes("promo") || ld.includes("promo") || ld.includes("banner") || ld.includes("sales")) {
    return "top_headline_bottom_feature_bar";
  }
  if (ld.includes("premium") || ld.includes("minimal") || ld.includes("center") || ld.includes("showcase")) {
    return "premium_center_product_minimal_text";
  }
  if (ld.includes("diagonal") || ld.includes("dynamic")) {
    return "diagonal_product_with_side_features";
  }
  if (ld.includes("left") && ld.includes("right product")) {
    return "hero_left_text_right_product";
  }
  if (ld.includes("right product") && ld.includes("left features")) {
    return "hero_right_product_left_features";
  }
  if (ld.includes("bottom info") || ld.includes("bottom bar")) {
    return "large_headline_with_bottom_info_bar";
  }
  return "hero_right_product_left_features";
}

function buildRegions(layoutType: LayoutType, hasBottomInfoBar: boolean, hasDetailInsets: boolean): LayoutRegion[] {
  const regions: LayoutRegion[] = [];
  let priority = 1;

  const add = (role: LayoutRegionRole, position: LayoutRegionPosition, size: "small" | "medium" | "large") => {
    regions.push({ id: `region-${role}-${priority}`, role, position, size, priority: priority++ });
  };

  switch (layoutType) {
    case "hero_left_text_right_product":
      add("headline_area", "top-left", "large");
      add("feature_stack", "left", "medium");
      add("hero_product", "right", "large");
      if (hasBottomInfoBar) add("bottom_info_bar", "bottom", "medium");
      break;
    case "hero_right_product_left_features":
      add("headline_area", "top-left", "large");
      add("feature_stack", "left", "medium");
      add("hero_product", "right", "large");
      if (hasBottomInfoBar) add("bottom_info_bar", "bottom", "medium");
      break;
    case "top_headline_bottom_feature_bar":
      add("headline_area", "top", "large");
      add("hero_product", "center", "large");
      add("feature_stack", "bottom", "medium");
      break;
    case "comparison_two_columns":
      add("headline_area", "top", "large");
      add("comparison_left", "left", "large");
      add("comparison_right", "right", "large");
      if (hasBottomInfoBar) add("bottom_info_bar", "bottom", "medium");
      break;
    case "technical_callout_with_insets":
      add("headline_area", "top-left", "large");
      add("hero_product", "center", "large");
      add("feature_stack", "right", "medium");
      if (hasDetailInsets) add("detail_inset", "bottom-right", "small");
      if (hasBottomInfoBar) add("bottom_info_bar", "bottom", "medium");
      break;
    case "exploded_layer_explanation":
      add("headline_area", "top-left", "large");
      add("hero_product", "center", "large");
      add("feature_stack", "right", "medium");
      if (hasDetailInsets) add("detail_inset", "bottom", "small");
      break;
    case "four_panel_application_grid":
      add("headline_area", "top", "large");
      add("application_grid", "center", "large");
      if (hasBottomInfoBar) add("bottom_info_bar", "bottom", "medium");
      break;
    case "large_headline_with_bottom_info_bar":
      add("headline_area", "top-left", "large");
      add("hero_product", "right", "large");
      add("feature_stack", "left", "medium");
      add("bottom_info_bar", "bottom", "large");
      break;
    case "diagonal_product_with_side_features":
      add("headline_area", "top-left", "large");
      add("hero_product", "center", "large");
      add("feature_stack", "left", "medium");
      if (hasBottomInfoBar) add("bottom_info_bar", "bottom", "medium");
      break;
    case "premium_center_product_minimal_text":
      add("hero_product", "center", "large");
      add("headline_area", "top", "medium");
      add("subheadline_area", "bottom", "small");
      break;
    default:
      add("headline_area", "top-left", "large");
      add("hero_product", "right", "large");
      add("feature_stack", "left", "medium");
      if (hasBottomInfoBar) add("bottom_info_bar", "bottom", "medium");
  }

  return regions;
}

function buildTextBlocks(
  headline: string | undefined,
  subtitle: string | undefined,
  sellingPoints: string[] | undefined,
  layoutType: LayoutType
): TextBlock[] {
  const blocks: TextBlock[] = [];
  let p = 1;

  const add = (text: string, role: TextBlockRole, position: TextBlockPosition) => {
    blocks.push({ id: `tb-${role}-${p}`, text, role, position, priority: p++ });
  };

  if (headline) {
    const headlinePos: TextBlockPosition =
      layoutType === "premium_center_product_minimal_text" ? "top" :
      layoutType === "top_headline_bottom_feature_bar" ? "top" :
      layoutType === "four_panel_application_grid" ? "top" :
      "top-left";
    add(headline, "headline", headlinePos);
  }

  if (subtitle) {
    const subPos: TextBlockPosition =
      layoutType === "premium_center_product_minimal_text" ? "bottom" :
      layoutType === "top_headline_bottom_feature_bar" ? "top" :
      layoutType === "four_panel_application_grid" ? "top" :
      "top-left";
    add(subtitle, "subtitle", subPos);
  }

  // Distribute selling points
  const spRoles: TextBlockRole[] = (sellingPoints || []).map((_, i) => {
    if (layoutType === "technical_callout_with_insets" && i < 2) return "callout";
    if (layoutType === "exploded_layer_explanation" && i < 2) return "feature_title";
    if (layoutType === "comparison_two_columns") return i % 2 === 0 ? "feature_title" : "feature_description";
    return i < 2 ? "feature_title" : "selling_point";
  });

  const spPositions: TextBlockPosition[] = (() => {
    switch (layoutType) {
      case "hero_left_text_right_product":
      case "hero_right_product_left_features":
        return ["left", "left", "left", "bottom", "right"];
      case "top_headline_bottom_feature_bar":
        return ["bottom", "bottom", "bottom", "bottom"];
      case "comparison_two_columns":
        return ["left", "right", "left", "right"];
      case "technical_callout_with_insets":
        return ["left", "left", "right", "right", "bottom"];
      case "exploded_layer_explanation":
        return ["right", "right", "bottom", "bottom"];
      case "four_panel_application_grid":
        return ["center", "center", "center", "center"];
      case "large_headline_with_bottom_info_bar":
        return ["left", "left", "left", "bottom"];
      case "diagonal_product_with_side_features":
        return ["left", "left", "bottom", "bottom"];
      case "premium_center_product_minimal_text":
        return ["top", "bottom"];
      default:
        return ["left", "right", "bottom", "top-right"];
    }
  })();

  (sellingPoints || []).forEach((sp, i) => {
    add(sp, spRoles[i], spPositions[i % spPositions.length]);
  });

  return blocks;
}

function chooseColorTheme(layoutType: LayoutType, layoutDirection: string): ColorTheme {
  const ld = layoutDirection.toLowerCase();

  if (ld.includes("gold") || ld.includes("premium") || ld.includes("luxury")) {
    return {
      primary: "#0a0a0f",
      secondary: "#1e1e24",
      background: "#050508",
      text: "#f5f0e8",
      accent: "#c9a96e",
    };
  }
  if (ld.includes("red") || ld.includes("dramatic") || ld.includes("crimson")) {
    return {
      primary: "#0a0a0f",
      secondary: "#1c1917",
      background: "#0a0a0f",
      text: "#ffffff",
      accent: "#dc2626",
    };
  }
  if (layoutType === "premium_center_product_minimal_text") {
    return {
      primary: "#1e293b",
      secondary: "#334155",
      background: "#0f172a",
      text: "#f8fafc",
      accent: "#94a3b8",
    };
  }
  if (layoutType === "four_panel_application_grid" || ld.includes("warm") || ld.includes("workshop")) {
    return {
      primary: "#1c1917",
      secondary: "#292524",
      background: "#0c0a09",
      text: "#fafaf9",
      accent: "#f59e0b",
    };
  }
  if (layoutType === "comparison_two_columns") {
    return {
      primary: "#0f172a",
      secondary: "#1e293b",
      background: "#0a0a14",
      text: "#ffffff",
      accent: "#3b82f6",
    };
  }
  // Default industrial blue-dark
  return {
    primary: "#0f172a",
    secondary: "#1e293b",
    background: "#0a0a14",
    text: "#f8fafc",
    accent: "#3b82f6",
  };
}

function chooseVisualDensity(layoutType: LayoutType): VisualDensity {
  if (layoutType === "premium_center_product_minimal_text" || layoutType === "hero_left_text_right_product") {
    return "clean";
  }
  if (layoutType === "technical_callout_with_insets" || layoutType === "exploded_layer_explanation" || layoutType === "comparison_two_columns") {
    return "high_information";
  }
  return "balanced";
}

function buildIconHints(copyBlocks: CopyBlock[]): IconHint[] {
  const iconMap: Record<string, IconType> = {
    "chip": "wind",
    "heat": "temperature",
    "cool": "temperature",
    "feed": "chart",
    "efficiency": "chart",
    "wear": "shield",
    "stable": "target",
    "cut": "target",
    "clean": "spark",
    "lock": "shield",
    "secure": "shield",
    "smooth": "wind",
    "rotation": "wind",
    "friction": "wind",
    "precision": "target",
    "fit": "target",
    "connection": "gear",
    "thread": "gear",
    "install": "tool",
    "clamp": "shield",
    "position": "target",
    "adjust": "tool",
    "cnc": "gear",
    "machine": "gear",
    "edge": "spark",
    "surface": "spark",
    "speed": "speed",
    "time": "clock",
    "life": "clock",
    "check": "check",
    "cross": "cross",
    "quiet": "leaf",
    "motion": "wind",
  };

  const hints: IconHint[] = [];
  const seen = new Set<string>();

  for (const block of copyBlocks) {
    if (!block.iconHint && block.title) {
      const lower = block.title.toLowerCase();
      for (const [key, icon] of Object.entries(iconMap)) {
        if (lower.includes(key) && !seen.has(block.id)) {
          hints.push({ blockId: block.id, iconType: icon, meaning: block.title });
          seen.add(block.id);
          break;
        }
      }
    } else if (block.iconHint) {
      hints.push({ blockId: block.id, iconType: block.iconHint as IconType, meaning: block.title });
    }
  }

  return hints;
}

export function buildLayoutOverlay(
  headline: string | undefined,
  subtitle: string | undefined,
  sellingPoints: string[] | undefined,
  layoutDirection: string,
  imageType: string,
  copyBlocks?: CopyBlock[]
): LayoutOverlay {
  const layoutType = inferLayoutTypeFromDirection(layoutDirection, imageType);

  const hasBottomInfoBar =
    layoutType === "large_headline_with_bottom_info_bar" ||
    layoutType === "top_headline_bottom_feature_bar" ||
    layoutDirection.toLowerCase().includes("bottom info");

  const hasDetailInsets =
    layoutType === "technical_callout_with_insets" ||
    layoutType === "exploded_layer_explanation" ||
    layoutDirection.toLowerCase().includes("detail") ||
    layoutDirection.toLowerCase().includes("inset");

  const hasComparisonPanels = layoutType === "comparison_two_columns";
  const hasApplicationGrid = layoutType === "four_panel_application_grid";
  const hasIconSystem = !!(copyBlocks && copyBlocks.length > 0);

  const regions = buildRegions(layoutType, hasBottomInfoBar, hasDetailInsets);
  const textBlocks = buildTextBlocks(headline, subtitle, sellingPoints, layoutType);
  const colorTheme = chooseColorTheme(layoutType, layoutDirection);
  const visualDensity = chooseVisualDensity(layoutType);
  const iconHints = copyBlocks ? buildIconHints(copyBlocks) : undefined;

  return {
    layoutType,
    headline: headline || "",
    subtitle,
    sellingPoints: sellingPoints || [],
    textLanguage: "English",
    textBlocks,
    colorTheme,
    visualDensity,
    regions,
    hasIconSystem,
    hasBottomInfoBar,
    hasDetailInsets,
    hasComparisonPanels,
    hasApplicationGrid,
    iconHints,
  };
}
