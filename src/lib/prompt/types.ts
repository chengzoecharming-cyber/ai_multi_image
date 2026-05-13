/**
 * Prompt Fragment & Builder Types
 *
 * Defines the type system for:
 * - Prompt fragments (atomic prompt pieces)
 * - Prompt builder inputs and outputs
 * - User template saving
 * - Prompt tags (inline tags in contentEditable editor)
 */

/** Tag types for inline prompt editor */
export type PromptTagType = "fragment" | "template" | "product";

/** A selectable inline tag shown in the prompt editor */
export interface PromptTag {
  id: string;
  type: PromptTagType;
  name: string;
  prompt: string;
}

/** A single selectable prompt fragment */
export interface PromptFragment {
  id: string;
  group: PromptFragmentGroup;
  name: string;
  description: string;
  promptFragment: string;
  previewImageUrl?: string;
  tags: string[];
  sortOrder: number;
  enabled: boolean;
}

/** Fragment group keys */
export type PromptFragmentGroup =
  | "product_category"
  | "image_type"
  | "visual_style"
  | "background"
  | "angle"
  | "material"
  | "negative";

/** Display definition for each fragment group tab */
export interface FragmentGroupDef {
  key: PromptFragmentGroup | "my_templates";
  label: string;
  icon?: string;
  description?: string;
}

/** Input to the new Fragment-based Prompt Builder */
export interface PromptBuilderInput {
  /** Selected prompt fragments */
  selectedFragments: PromptFragment[];
  /** User's handwritten additional prompt */
  userPrompt: string;
  /** User's handwritten negative prompt */
  userNegativePrompt?: string;
  /** Whether to preserve reference image structure */
  preserveStructure?: boolean;
}

/** Legacy input to the field-based Prompt Builder (kept for backward compat) */
export interface LegacyPromptBuilderInput {
  /** Structured field selections */
  fields: PromptFieldSelections;
  /** User's handwritten additional prompt */
  userPrompt: string;
  /** User's negative prompt */
  negativePrompt?: string;
  /** Whether to preserve reference image structure */
  preserveStructure?: boolean;
}

/** Output from the Prompt Builder */
export interface PromptBuilderOutput {
  /** Final assembled positive prompt */
  positivePrompt: string;
  /** Final assembled negative prompt */
  negativePrompt: string;
  /** Sections that contributed to the prompt (for debugging/display) */
  sections: PromptSection[];
}

/** A single section in the built prompt */
export interface PromptSection {
  key: string;
  label: string;
  content: string;
  source: "system" | "field" | "user";
}

/** Legacy: user's field selections for prompt generation (kept for backward compat) */
export interface PromptFieldSelections {
  platform?: string;
  productCategory?: string;
  imageType?: string;
  visualTags?: string[];
  background?: string;
  angle?: string;
  negativeTags?: string[];
}

/** Legacy: rule option (kept for backward compat with rules.ts) */
export interface PromptRuleOption {
  id: string;
  label: string;
  promptFragment: string;
  sortOrder: number;
  enabled: boolean;
}

/** Legacy: rule category (kept for backward compat with rules.ts) */
export interface PromptRuleCategory {
  key: string;
  label: string;
  description?: string;
  allowMultiple: boolean;
  options: PromptRuleOption[];
}

/** Legacy: extended config (kept for backward compat) */
export interface ExtendedPromptConfig {
  ratio?: string;
  width?: number;
  height?: number;
  model?: string;
  quality?: string;
  outputCount?: number;
  /** Legacy structured field selections */
  promptFields?: PromptFieldSelections;
  /** Selected fragment ids (new) */
  selectedFragmentIds?: string[];
  /** Selected tags (newer) */
  selectedTags?: PromptTag[];
  /** Provider-specific config (reserved for future ComfyUI integration) */
  providerConfig?: {
    workflowId?: string | null;
    model?: string;
    steps?: number;
    cfg?: number;
    sampler?: string;
    positivePromptNodeId?: string;
    negativePromptNodeId?: string;
    referenceImageNodeId?: string;
  };
}
