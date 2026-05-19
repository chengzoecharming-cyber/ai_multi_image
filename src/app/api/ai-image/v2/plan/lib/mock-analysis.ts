import type { ProductAnalysis } from "@/app/ai-image/v2/types";

export function analyzeProductImage(_imageUrl: string, userGoal: string): ProductAnalysis {
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
