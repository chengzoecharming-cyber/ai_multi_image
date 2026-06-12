import type { CreativePlan, CopyBlock } from "@/app/ai-image/v2/types";
import { buildImageGenerationPrompt, buildPlanSummaryPrompt } from "@/app/api/ai-image/v2/plan/lib/prompt-builders";
import { buildLayoutOverlay } from "@/app/api/ai-image/v2/plan/lib/layout-overlay";

function toUpperWords(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9\s\-&]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function sanitizeRiskyCopy(text: string): string {
  return text
    .replace(/\bheavy loads?\b/gi, "demanding use")
    .replace(/\bload[-\s]?bearing\b/gi, "reliable fit")
    .replace(/\btorque\b/gi, "performance")
    .replace(/\bhardness\b/gi, "durability")
    .replace(/\bhigh[-\s]?grade\b/gi, "premium");
}

/**
 * 当用户修改 headline / subtitle / sellingPoints 后，
 * 同步更新 copyBlocks 中对应的 block，并重建所有派生 prompt。
 *
 * 注意：只更新 headline / subheadline / feature_point 中与用户修改
 * 对应的 block，保留其他 block（如 core_claim, technical_point 等）不变。
 */
export function refreshPlanPrompts(plan: CreativePlan): CreativePlan {
  const blocks: CopyBlock[] = Array.isArray(plan.copyBlocks) ? [...plan.copyBlocks] : [];
  const headline = String(plan.headline || "").trim();
  const subtitle = plan.subtitle ? String(plan.subtitle).trim() : "";

  // 1. 同步 headline block
  const headlineIdx = blocks.findIndex((b) => b.role === "headline");
  if (headline) {
    if (headlineIdx >= 0) {
      blocks[headlineIdx] = { ...blocks[headlineIdx], title: toUpperWords(headline) };
    } else {
      blocks.unshift({
        id: "cb-headline",
        title: toUpperWords(headline),
        role: "headline",
        priority: 1,
      });
    }
  } else if (headlineIdx >= 0) {
    // headline 被清空时删除对应 block
    blocks.splice(headlineIdx, 1);
  }

  // 2. 同步 subheadline block
  const subheadlineIdx = blocks.findIndex((b) => b.role === "subheadline");
  if (subtitle) {
    if (subheadlineIdx >= 0) {
      blocks[subheadlineIdx] = { ...blocks[subheadlineIdx], title: sanitizeRiskyCopy(subtitle) };
    } else {
      const hlIdx = blocks.findIndex((b) => b.role === "headline");
      const insertIdx = hlIdx >= 0 ? hlIdx + 1 : 0;
      blocks.splice(insertIdx, 0, {
        id: "cb-subheadline",
        title: sanitizeRiskyCopy(subtitle),
        role: "subheadline",
        priority: 2,
      });
    }
  } else if (subheadlineIdx >= 0) {
    // subtitle 被清空时删除对应 block
    blocks.splice(subheadlineIdx, 1);
  }

  // 3. 同步 sellingPoints → feature_point blocks
  // 策略：保留已有的 feature_point（body/iconHint 等元数据），只更新 title。
  // 如果 sellingPoints 数量变化，增删 block。
  const existingFeatureBlocks = blocks.filter((b) => b.role === "feature_point");
  const sellingPoints = (plan.sellingPoints || []).filter((s) => String(s).trim().length > 0);

  // 收集需要保留/更新的 feature blocks（按 sellingPoints 顺序）
  const newFeatureBlocks: CopyBlock[] = [];
  const existingFeatureTitleSet = new Set(
    existingFeatureBlocks.map((b) => toUpperWords(b.title || ""))
  );

  sellingPoints.forEach((sp, index) => {
    const upperTitle = toUpperWords(sanitizeRiskyCopy(String(sp)));
    if (!upperTitle) return;

    // 尝试找已有相同 title 的 block，保留其 body/iconHint
    const matched = existingFeatureBlocks.find(
      (b) => toUpperWords(b.title || "") === upperTitle
    );

    if (matched) {
      newFeatureBlocks.push({
        ...matched,
        title: upperTitle,
        priority: 10 + index,
      });
    } else {
      // 新建 block，尽量复用已有 block 的 body/iconHint（按索引对齐）
      const fallback = existingFeatureBlocks[index];
      newFeatureBlocks.push({
        id: fallback?.id || `cb-auto-feature-${index + 1}`,
        title: upperTitle,
        role: "feature_point",
        body: fallback?.body || (index === 0 ? "Clear visible advantage for ecommerce shoppers" : undefined),
        iconHint: fallback?.iconHint || (index === 0 ? "target" : index === 1 ? "shield" : "spark"),
        priority: 10 + index,
      });
    }
  });

  // 4. 重建 blocks 数组：保留 headline + subheadline + 新 feature_points + 其他 role
  const otherBlocks = blocks.filter(
    (b) => b.role !== "headline" && b.role !== "subheadline" && b.role !== "feature_point"
  );

  const finalBlocks: CopyBlock[] = [
    ...blocks.filter((b) => b.role === "headline"),
    ...blocks.filter((b) => b.role === "subheadline"),
    ...newFeatureBlocks,
    ...otherBlocks,
  ];

  // 5. 重建 sellingPoints（从 feature_point blocks 提取）
  const finalSellingPoints = finalBlocks
    .filter((b) => b.role === "feature_point")
    .map((b) => (b.body ? `${b.title} / ${b.body}` : b.title))
    .slice(0, 5);

  // 6. 重建 layoutOverlay 和 prompts
  const layoutOverlay = buildLayoutOverlay(
    headline || undefined,
    subtitle || undefined,
    finalSellingPoints,
    plan.layoutDirection,
    plan.imageType,
    finalBlocks
  );

  const planSummaryPrompt = buildPlanSummaryPrompt({
    ...plan,
    copyBlocks: finalBlocks,
    sellingPoints: finalSellingPoints,
    layoutOverlay,
  });

  const imageGenerationPrompt = buildImageGenerationPrompt({
    ...plan,
    copyBlocks: finalBlocks,
    sellingPoints: finalSellingPoints,
    layoutOverlay,
  });

  return {
    ...plan,
    copyBlocks: finalBlocks,
    sellingPoints: finalSellingPoints,
    layoutOverlay,
    planSummaryPrompt,
    imageGenerationPrompt,
    finalPrompt: imageGenerationPrompt,
  };
}
