/**
 * Legacy Prompt Builder (kept for backward compatibility)
 *
 * This is the old field-based builder used by existing templates
 * that still use `promptFields` instead of `selectedFragmentIds`.
 */

import {
  LegacyPromptBuilderInput,
  PromptBuilderOutput,
  PromptSection,
  PromptFieldSelections,
} from "./types";
import {
  getOptionById,
  getOptionsByIds,
  NEGATIVE_TAG_RULES,
} from "./rules";

/** Default base instruction for product image generation */
const BASE_INSTRUCTION =
  "Generate a professional e-commerce product image based on the reference image.";

/** Default structure preservation instruction */
const STRUCTURE_PRESERVATION =
  "Preserve the original product shape, proportions, structure and key details from the reference image.";

/**
 * Build the final prompt from field selections and user input.
 * @deprecated Use the new fragment-based `buildPrompt` from builder.ts instead.
 */
export function buildPromptFromFields(input: LegacyPromptBuilderInput): PromptBuilderOutput {
  const sections: PromptSection[] = [];

  // 1. Base instruction
  sections.push({
    key: "base",
    label: "基础目标",
    content: BASE_INSTRUCTION,
    source: "system",
  });

  // 2. Platform requirement
  const platformSection = buildFieldSection("platform", "平台要求", input.fields.platform);
  if (platformSection) sections.push(platformSection);

  // 3. Product category
  const categorySection = buildFieldSection("productCategory", "产品类目", input.fields.productCategory);
  if (categorySection) sections.push(categorySection);

  // 4. Image type
  const imageTypeSection = buildFieldSection("imageType", "图片类型", input.fields.imageType);
  if (imageTypeSection) sections.push(imageTypeSection);

  // 5. Background
  const backgroundSection = buildFieldSection("background", "背景", input.fields.background);
  if (backgroundSection) sections.push(backgroundSection);

  // 6. Angle
  const angleSection = buildFieldSection("angle", "拍摄角度", input.fields.angle);
  if (angleSection) sections.push(angleSection);

  // 7. Visual tags (multiple)
  const visualTagSection = buildMultiFieldSection("visualTags", "视觉标签", input.fields.visualTags);
  if (visualTagSection) sections.push(visualTagSection);

  // 8. User's handwritten prompt
  if (input.userPrompt?.trim()) {
    sections.push({
      key: "userPrompt",
      label: "用户补充",
      content: input.userPrompt.trim(),
      source: "user",
    });
  }

  // 9. Structure preservation (if reference images are provided)
  if (input.preserveStructure !== false) {
    sections.push({
      key: "structure",
      label: "结构保持",
      content: STRUCTURE_PRESERVATION,
      source: "system",
    });
  }

  // Assemble positive prompt
  const positivePrompt = sections
    .map((s) => s.content)
    .filter(Boolean)
    .join(". ");

  // Build negative prompt
  const negativeSections = buildNegativeSections(input);
  const negativePrompt = negativeSections
    .map((s) => s.content)
    .filter(Boolean)
    .join(", ");

  return {
    positivePrompt: positivePrompt + (positivePrompt.endsWith(".") ? "" : "."),
    negativePrompt,
    sections: [...sections, ...negativeSections],
  };
}

function buildFieldSection(
  categoryKey: string,
  label: string,
  optionId: string | undefined
): PromptSection | null {
  if (!optionId) return null;
  const option = getOptionById(categoryKey, optionId);
  if (!option) return null;
  return {
    key: categoryKey,
    label,
    content: option.promptFragment,
    source: "field",
  };
}

function buildMultiFieldSection(
  categoryKey: string,
  label: string,
  optionIds: string[] | undefined
): PromptSection | null {
  if (!optionIds || optionIds.length === 0) return null;
  const options = getOptionsByIds(categoryKey, optionIds);
  if (options.length === 0) return null;
  const content = options.map((o) => o.promptFragment).join(". ");
  return {
    key: categoryKey,
    label,
    content,
    source: "field",
  };
}

function buildNegativeSections(input: LegacyPromptBuilderInput): PromptSection[] {
  const sections: PromptSection[] = [];

  const negativeTagIds = (input.fields as PromptFieldSelections & { negativeTags?: string[] }).negativeTags;
  if (negativeTagIds && negativeTagIds.length > 0) {
    const options = getOptionsByIds("negativeTags", negativeTagIds);
    if (options.length > 0) {
      sections.push({
        key: "negativeTags",
        label: "排除标签",
        content: options.map((o) => o.promptFragment).join(", "),
        source: "field",
      });
    }
  }

  if (input.negativePrompt?.trim()) {
    sections.push({
      key: "userNegative",
      label: "用户负向补充",
      content: input.negativePrompt.trim(),
      source: "user",
    });
  }

  return sections;
}
