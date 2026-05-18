/**
 * Template-based Prompt Builder
 *
 * Replaces the old fragment-based builder.
 * Flow: Select template → Fill variables → Generate final prompt.
 *
 * Variables are replaced using {{key}} syntax in templatePrompt and negativePrompt.
 */

import { PromptTemplate, TemplateVariable, getTemplateById } from "./templates";

export interface TemplateBuilderInput {
  /** Selected template id */
  templateId: string;
  /** Variable values: key → user input */
  variableValues: Record<string, string>;
  /** User's free-form additional description */
  userDescription?: string;
  /** Whether a product reference image is provided */
  hasProductImage?: boolean;
  /** Whether style reference images are provided */
  hasStyleReferences?: boolean;
}

export interface TemplateBuilderOutput {
  /** Final assembled positive prompt */
  positivePrompt: string;
  /** Final assembled negative prompt */
  negativePrompt: string;
  /** The template used */
  template: PromptTemplate;
  /** Resolved variable values (with defaults applied) */
  resolvedVariables: Record<string, string>;
  /** Sections for display/debugging */
  sections: TemplatePromptSection[];
}

export interface TemplatePromptSection {
  key: string;
  label: string;
  content: string;
  source: "system" | "field" | "user";
}

/** Product reference preservation instruction */
const PRODUCT_REFERENCE_INSTRUCTION =
  "Use the product reference image as the primary source. Preserve the original product shape, proportions, geometry, structure, holes, grooves, edges, threads, cutting edges, mounting points and key mechanical details.";

/** Style reference instruction */
const STYLE_REFERENCE_INSTRUCTION =
  "Use style reference images only for background, lighting, color tone, material mood and visual atmosphere. Do not copy objects from style reference images. Do not change the product structure based on style reference images.";

/** Combined reference instruction */
const COMBINED_REFERENCE_INSTRUCTION =
  "Use the product reference image as the primary source. Preserve the original product shape, proportions, geometry, structure, holes, grooves, edges, threads, cutting edges, mounting points and key mechanical details. " +
  "Use style reference images only for background, lighting, color tone, material mood and visual atmosphere. Do not copy objects from style reference images. Do not change the product structure based on style reference images. " +
  "Only improve the background, lighting, material appearance and commercial presentation.";

/** Fallback when no specific references */
const REFERENCE_PRESERVATION =
  "Use the reference image as the primary source. Preserve the original product shape, proportions, geometry, holes, grooves, edges, threads, cutting edges, mounting points and key mechanical details. Do not redesign the product. Do not add or remove any parts. Only improve the background, lighting, material appearance and commercial presentation.";

/**
 * Resolve variable values by applying defaults for missing values.
 */
function resolveVariables(
  template: PromptTemplate,
  inputValues: Record<string, string>
): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const v of template.variables) {
    const userValue = inputValues[v.key];
    if (userValue !== undefined && userValue.trim() !== "") {
      resolved[v.key] = userValue.trim();
    } else if (v.defaultValue !== undefined) {
      resolved[v.key] = v.defaultValue;
    } else {
      resolved[v.key] = "";
    }
  }
  return resolved;
}

/**
 * Replace all {{key}} placeholders in content with resolved values.
 * Also handles {{free_description}} specially — if empty, removes the line.
 */
function applyVariables(content: string, variables: Record<string, string>): string {
  let result = content;

  // Replace all {{key}} placeholders
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${escapeRegExp(key)}\\}\\}`, "g");
    result = result.replace(regex, value);
  }

  // Clean up any remaining unreplaced placeholders
  result = result.replace(/\{\{[\w_]+\}\}/g, "");

  // Special cleanup for free_description: if it was empty or just whitespace,
  // remove lines that only contained it
  result = result
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return result;
}

/**
 * Build reference section based on what reference images are present.
 */
function buildReferenceSection(input: TemplateBuilderInput): TemplatePromptSection {
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
 * Build the final prompt from a template and variable values.
 */
export function buildPromptFromTemplate(input: TemplateBuilderInput): TemplateBuilderOutput {
  const template = getTemplateById(input.templateId);
  if (!template) {
    throw new Error(`Template not found: ${input.templateId}`);
  }

  const resolvedVariables = resolveVariables(template, input.variableValues);
  const sections: TemplatePromptSection[] = [];

  // 1. Apply variables to template prompt
  const templatePromptWithVars = applyVariables(template.templatePrompt, resolvedVariables);

  // 2. Add reference preservation
  const referenceSection = buildReferenceSection(input);
  sections.push(referenceSection);

  // 3. User's free description (appended to template)
  let finalPositivePrompt = templatePromptWithVars;
  if (input.userDescription?.trim()) {
    sections.push({
      key: "userDescription",
      label: "User additional",
      content: input.userDescription.trim(),
      source: "user",
    });
    finalPositivePrompt += "\n\nAdditional user requirements:\n" + input.userDescription.trim();
  }

  // 4. Apply variables to negative prompt
  const finalNegativePrompt = applyVariables(template.negativePrompt, resolvedVariables);

  // 5. Build display sections
  sections.unshift({
    key: "template",
    label: "Template",
    content: template.name,
    source: "system",
  });

  sections.push({
    key: "positive",
    label: "Positive Prompt",
    content: finalPositivePrompt,
    source: "system",
  });

  sections.push({
    key: "negative",
    label: "Negative Prompt",
    content: finalNegativePrompt,
    source: "system",
  });

  return {
    positivePrompt: finalPositivePrompt,
    negativePrompt: finalNegativePrompt,
    template,
    resolvedVariables,
    sections,
  };
}

/**
 * Quick build for simple use cases.
 */
export function quickTemplateBuild(
  templateId: string,
  variableValues: Record<string, string>,
  userDescription?: string
): { positive: string; negative: string } {
  const result = buildPromptFromTemplate({
    templateId,
    variableValues,
    userDescription,
    hasProductImage: true,
  });
  return {
    positive: result.positivePrompt,
    negative: result.negativePrompt,
  };
}

/**
 * Validate that all required variables have values.
 * Returns array of missing required variable keys.
 */
export function validateVariableValues(
  template: PromptTemplate,
  values: Record<string, string>
): string[] {
  const missing: string[] = [];
  for (const v of template.variables) {
    if (v.required) {
      const val = values[v.key];
      if (!val || val.trim() === "") {
        missing.push(v.key);
      }
    }
  }
  return missing;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
