/**
 * Prompt Builder
 *
 * Assembles the final positive and negative prompts from:
 * - Selected prompt fragments (grouped by category)
 * - User's handwritten prompt
 * - User's negative prompt
 * - Product reference image role (primary source for product structure)
 * - Style reference images role (background, lighting, atmosphere only)
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

/** Default base instruction — user-description-first, avoid conflicts with background/style fragments */
const BASE_INSTRUCTION =
  "Use the reference image as the ground truth for the product. Do not invent or add objects, parts, labels, text, logos, or any scene elements the user did not request. Only change what the user explicitly describes (including selected tags/fragments).";

/** Product reference preservation — highest priority, preserves structure */
const PRODUCT_REFERENCE_INSTRUCTION =
  "Use the product reference image as the primary source. Preserve the original product shape, proportions, geometry, structure, holes, grooves, edges, threads, cutting edges, mounting points and key mechanical details.";

/** Style reference instruction — only for visual atmosphere */
const STYLE_REFERENCE_INSTRUCTION =
  "Use style reference images only for background, lighting, color tone, material mood and visual atmosphere. Do not copy objects from style reference images. Do not change the product structure based on style reference images.";

/** Combined reference instruction when both are present */
const COMBINED_REFERENCE_INSTRUCTION =
  "Use the product reference image as the primary source. Preserve the original product shape, proportions, geometry, structure, holes, grooves, edges, threads, cutting edges, mounting points and key mechanical details. " +
  "Use style reference images only for background, lighting, color tone, material mood and visual atmosphere. Do not copy objects from style reference images. Do not change the product structure based on style reference images. " +
  "Only improve the background, lighting, material appearance and commercial presentation.";

/** Fallback reference preservation when only legacy info is available */
const REFERENCE_PRESERVATION =
  "Use the reference image as the primary source. Preserve the original product shape, proportions, geometry, holes, grooves, edges, threads, cutting edges, mounting points and key mechanical details. Do not redesign the product. Do not add or remove any parts. Only improve the background, lighting, material appearance and commercial presentation.";

/** Precision lock for mechanical parts (conservative mode) */
const PRECISION_LOCK_INSTRUCTION =
  "Mechanical accuracy is critical. Treat the product geometry as immutable: do not alter hole count/positions/diameters, slot widths, thread pitch/profile, edges, chamfers, radii, angles, clearances, or overall dimensions. Do not smooth away sharp features. Do not merge or delete small details. If the user asks for changes that would affect geometry, request explicit confirmation.";

/** Group order for building the prompt */
const GROUP_ORDER: PromptFragmentGroup[] = [
  "generation_mode",
  "platform",
  "product_category",
  "image_type",
  "angle",
  "material",
];

/** Human-readable labels for each group */
const GROUP_LABELS: Record<PromptFragmentGroup, string> = {
  generation_mode: "Generation mode",
  platform: "Platform",
  product_category: "Product category",
  image_type: "Image type",
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
 * Build reference preservation section based on what types of reference images are present.
 */
function buildReferenceSection(input: PromptBuilderInput): PromptSection {
  if (input.hasProductImage && input.hasStyleReferences) {
    return {
      key: "reference",
      label: "Reference",
      content: COMBINED_REFERENCE_INSTRUCTION,
      source: "system",
    };
  }
  if (input.hasProductImage) {
    return {
      key: "reference",
      label: "Reference",
      content: PRODUCT_REFERENCE_INSTRUCTION + " Only improve the background, lighting, material appearance and commercial presentation.",
      source: "system",
    };
  }
  if (input.hasStyleReferences) {
    return {
      key: "reference",
      label: "Reference",
      content: STYLE_REFERENCE_INSTRUCTION + " Only improve the background, lighting, material appearance and commercial presentation.",
      source: "system",
    };
  }
  return {
    key: "reference",
    label: "Reference",
    content: REFERENCE_PRESERVATION,
    source: "system",
  };
}

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
    if (!fragments || fragments.length === 0) {
      // For generation_mode, inject default if none selected
      if (group === "generation_mode") {
        const defaultMode = getFragmentById(
          input.generationModeId || "conservative_enhancement"
        );
        if (defaultMode) {
          sections.push({
            key: group,
            label: GROUP_LABELS[group],
            content: defaultMode.promptFragment,
            source: "system",
          });
        }
      }
      continue;
    }
    const content = fragments.map((f) => f.promptFragment).join(". ");
    sections.push({
      key: group,
      label: GROUP_LABELS[group],
      content,
      source: "field",
    });
  }

  // 5. Reference image preservation requirement
  sections.push(buildReferenceSection(input));

  // 5.1 Precision lock (only when conservative + product reference)
  if (input.hasProductImage && (input.generationModeId || "conservative_enhancement") === "conservative_enhancement") {
    sections.push({
      key: "precision",
      label: "Precision",
      content: PRECISION_LOCK_INSTRUCTION,
      source: "system",
    });
  }

  // 6. User's handwritten prompt (resolve any fragment placeholders)
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

  // Auto precision negatives (conservative + product reference)
  if (input.hasProductImage && (input.generationModeId || "conservative_enhancement") === "conservative_enhancement") {
    sections.push({
      key: "precision_negative",
      label: "Negative",
      content:
        "changed geometry, distorted shape, wrong dimensions, deformed part, missing holes, extra holes, altered hole positions, altered hole diameter, missing threads, wrong thread pitch, melted details, over-smoothed edges, rounded sharp edges, missing grooves, extra grooves, fused parts, incorrect count of features",
      source: "system",
    });
  }

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
  userNegativePrompt?: string,
  generationModeId?: string
): { positive: string; negative: string } {
  const result = buildPrompt({
    selectedFragments,
    userPrompt,
    userNegativePrompt,
    hasProductImage: true,
    generationModeId,
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
  userPrompt: string,
  generationModeId?: string
): string {
  return quickBuild(selectedFragments, userPrompt, undefined, generationModeId).positive;
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
  hasProductImage: boolean,
  hasStyleReferences: boolean,
  generationModeId?: string
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
    hasProductImage,
    hasStyleReferences,
    generationModeId,
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

/** Remove a tag by id from raw content */
export function removeTag(content: string, tagId: string): string {
  return content
    .replace(
      new RegExp(`\\{\\{(fragment|template|product):${escapeRegExp(tagId)}\\|[^}]+\\}\\}`, "g"),
      ""
    )
    .replace(
      new RegExp(`\\{\\{(fragment|template|product):${escapeRegExp(tagId)}\\}\\}`, "g"),
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
