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
import { getFragmentById, getFragmentsByIds } from "./fragments";

/** Default base instruction for product image generation */
const BASE_INSTRUCTION =
  "Generate a professional e-commerce product image based on the reference image.";

/** Default structure preservation instruction */
const STRUCTURE_PRESERVATION =
  "Preserve the original product shape, proportions, structure and key details from the reference image.";

/** Group order for building the prompt */
const GROUP_ORDER: PromptFragmentGroup[] = [
  "platform",
  "product_category",
  "image_type",
  "visual_style",
  "background",
  "angle",
  "material",
];

/** Human-readable labels for each group */
const GROUP_LABELS: Record<PromptFragmentGroup, string> = {
  platform: "Platform",
  product_category: "Product category",
  image_type: "Image purpose",
  visual_style: "Visual style",
  background: "Background",
  angle: "Angle",
  material: "Material",
  negative: "Negative",
};

/** Regex to match all tag placeholders in prompt content (supports {{type:id|name}} and {{type:id}}) */
const TAG_PLACEHOLDER_REGEX = /\{\{(fragment|template|product):([^}|]+)(?:\|[^}]*)?\}\}/g;

/**
 * Extract tag placeholders from content using {{type:id}} syntax.
 */
export function extractTagIds(content: string): { type: string; id: string }[] {
  const ids: { type: string; id: string }[] = [];
  let match;
  TAG_PLACEHOLDER_REGEX.lastIndex = 0;
  while ((match = TAG_PLACEHOLDER_REGEX.exec(content)) !== null) {
    ids.push({ type: match[1], id: match[2] });
  }
  return ids;
}

/**
 * Resolve prompt content by replacing {{type:id}} placeholders
 * with actual prompts. Supports custom resolver for template/product tags.
 */
export function resolvePromptContent(
  content: string,
  tagResolver?: (type: string, id: string) => string | undefined
): string {
  return content.replace(TAG_PLACEHOLDER_REGEX, (match, type, id) => {
    if (tagResolver) {
      const resolved = tagResolver(type, id);
      if (resolved !== undefined) return resolved;
    }
    if (type === "fragment") {
      const fragment = getFragmentById(id);
      if (fragment) return fragment.promptFragment;
    }
    return match;
  });
}

/**
 * Resolve negative prompt content by replacing tag placeholders.
 */
export function resolveNegativePromptContent(
  content: string,
  tagResolver?: (type: string, id: string) => string | undefined
): string {
  return resolvePromptContent(content, tagResolver);
}

/**
 * Build the final prompt from selected fragments and user input.
 *
 * Legacy path: when selectedFragments are explicitly provided.
 * New path: promptContent already contains {{type:id}} tags,
 *           and selectedFragments may be auto-derived or empty.
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

  // 2. Group fragments by group (legacy path with explicit selections)
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

  // 5. User's handwritten prompt (resolve any fragment placeholders)
  if (input.userPrompt?.trim()) {
    const resolved = resolvePromptContent(input.userPrompt.trim());
    sections.push({
      key: "userPrompt",
      label: "User additional",
      content: resolved,
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

  // Negative fragments (legacy path)
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

  // User's handwritten negative prompt (resolve placeholders)
  if (input.userNegativePrompt?.trim()) {
    const resolved = resolveNegativePromptContent(input.userNegativePrompt.trim());
    sections.push({
      key: "userNegative",
      label: "User negative",
      content: resolved,
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

/**
 * Build prompt from contentEditable text that may contain tag placeholders.
 * This is the new primary API for the workbench page.
 *
 * Extracts fragment tags from content, resolves them, and builds the final prompt.
 */
export function buildPromptFromContent(
  promptContent: string,
  negativePromptContent: string,
  referencesLength: number
): { positivePrompt: string; negativePrompt: string } {
  // Extract fragment tags from content
  const tagIds = extractTagIds(promptContent);
  const fragmentIds = tagIds.filter((t) => t.type === "fragment").map((t) => t.id);
  const fragments = getFragmentsByIds(fragmentIds);

  // Clean prompt content: remove all tag placeholders
  const cleanPrompt = promptContent.replace(TAG_PLACEHOLDER_REGEX, "").trim();

  // Build using the standard builder
  const result = buildPrompt({
    selectedFragments: fragments,
    userPrompt: cleanPrompt,
    userNegativePrompt: negativePromptContent,
    preserveStructure: referencesLength > 0,
  });

  return {
    positivePrompt: result.positivePrompt,
    negativePrompt: result.negativePrompt,
  };
}

// ─── Tag utilities (moved here to avoid circular deps) ──────────────

import type { PromptTag } from "./types";

/** Encode a PromptTag into placeholder string: {{type:id|name}} */
export function encodeTag(tag: PromptTag): string {
  return `{{${tag.type}:${tag.id}|${tag.name}}}`;
}

/** Encode just the id part (stored in editor content) */
export function encodeTagId(tag: PromptTag): string {
  return `{{${tag.type}:${tag.id}}}`;
}

/** Extract all tags from raw content */
export function extractTags(content: string): PromptTag[] {
  const tags: PromptTag[] = [];
  const seen = new Set<string>();
  // Match full format: {{type:id|name}}
  content.replace(/\{\{(fragment|template|product):([^}|]+)\|([^}]+)\}\}/g, (_, type, id, name) => {
    const key = `${type}:${id}`;
    if (!seen.has(key)) {
      seen.add(key);
      tags.push({ id, type, name, prompt: "" });
    }
    return "";
  });
  // Match short format: {{type:id}}
  content.replace(/\{\{(fragment|template|product):([^}]+)\}\}/g, (match, type, id) => {
    // Skip if already matched by full format
    if (match.includes("|")) return "";
    const key = `${type}:${id}`;
    if (!seen.has(key)) {
      seen.add(key);
      tags.push({ id, type, name: id, prompt: "" });
    }
    return "";
  });
  return tags;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Remove tag by id from content */
export function removeTag(content: string, tagId: string): string {
  return content.replace(
    new RegExp(`\\{\\{(fragment|template|product):${escapeRegExp(tagId)}\\|[^}]+\\}\\}`, "g"),
    ""
  ).replace(
    new RegExp(`\\{\\{(fragment|template|product):${escapeRegExp(tagId)}\\}\\}`, "g"),
    ""
  ).replace(/\s+/g, " ").trim();
}
