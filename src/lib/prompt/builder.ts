/**
 * Prompt Builder
 *
 * Assembles the final positive and negative prompts from:
 * - Selected prompt fragments (grouped by category)
 * - User's handwritten prompt
 * - User's negative prompt
 *
 * Output is structured into readable sections.
 */

import {
  PromptBuilderInput,
  PromptBuilderOutput,
  PromptSection,
  PromptFragment,
  PromptFragmentGroup,
} from "./types";

/** Default base instruction for product image generation */
const BASE_INSTRUCTION =
  "Generate a professional e-commerce product image based on the reference image.";

/** Default structure preservation instruction */
const STRUCTURE_PRESERVATION =
  "Preserve the original product shape, proportions, structure and key details from the reference image.";

/** Group order for building the prompt */
const GROUP_ORDER: PromptFragmentGroup[] = [
  "product_category",
  "image_type",
  "visual_style",
  "background",
  "angle",
  "material",
];

/** Human-readable labels for each group */
const GROUP_LABELS: Record<PromptFragmentGroup, string> = {
  product_category: "Product category",
  image_type: "Image purpose",
  visual_style: "Visual style",
  background: "Background",
  angle: "Angle",
  material: "Material",
  negative: "Negative",
};

/**
 * Build the final prompt from selected fragments and user input.
 */
export function buildPrompt(input: PromptBuilderInput): PromptBuilderOutput {
  const sections: PromptSection[] = [];

  // 1. Base instruction
  sections.push({
    key: "base",
    label: "Base",
    content: BASE_INSTRUCTION,
    source: "system",
  });

  // 2. Group fragments by group
  const byGroup = new Map<PromptFragmentGroup, PromptFragment[]>();
  for (const frag of input.selectedFragments) {
    const list = byGroup.get(frag.group) || [];
    list.push(frag);
    byGroup.set(frag.group, list);
  }

  // 3. Add each group section in defined order
  for (const group of GROUP_ORDER) {
    const fragments = byGroup.get(group);
    if (!fragments || fragments.length === 0) continue;
    const content = fragments.map((f) => f.promptFragment).join(". ");
    sections.push({
      key: group,
      label: GROUP_LABELS[group],
      content,
      source: "field",
    });
  }

  // 4. Structure preservation (if reference images are present)
  if (input.preserveStructure !== false) {
    sections.push({
      key: "structure",
      label: "Reference",
      content: STRUCTURE_PRESERVATION,
      source: "system",
    });
  }

  // 5. User's handwritten prompt
  if (input.userPrompt?.trim()) {
    sections.push({
      key: "userPrompt",
      label: "User additional",
      content: input.userPrompt.trim(),
      source: "user",
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

/**
 * Build negative prompt sections from selected negative fragments + user input.
 */
function buildNegativeSections(
  input: PromptBuilderInput
): PromptSection[] {
  const sections: PromptSection[] = [];

  // Negative fragments
  const negativeFrags = input.selectedFragments.filter(
    (f) => f.group === "negative"
  );
  if (negativeFrags.length > 0) {
    sections.push({
      key: "negative",
      label: "Negative",
      content: negativeFrags.map((f) => f.promptFragment).join(", "),
      source: "field",
    });
  }

  // User's handwritten negative prompt
  if (input.userNegativePrompt?.trim()) {
    sections.push({
      key: "userNegative",
      label: "User negative",
      content: input.userNegativePrompt.trim(),
      source: "user",
    });
  }

  return sections;
}

/**
 * Quick build function for simple use cases.
 */
export function quickBuild(
  selectedFragments: PromptFragment[],
  userPrompt: string,
  userNegativePrompt?: string
): { positive: string; negative: string } {
  const result = buildPrompt({
    selectedFragments,
    userPrompt,
    userNegativePrompt,
    preserveStructure: true,
  });
  return {
    positive: result.positivePrompt,
    negative: result.negativePrompt,
  };
}

/**
 * Get a preview of what the prompt will look like based on current selections.
 */
export function previewPrompt(
  selectedFragments: PromptFragment[],
  userPrompt: string
): string {
  return quickBuild(selectedFragments, userPrompt).positive;
}
