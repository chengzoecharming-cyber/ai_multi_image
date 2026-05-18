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
  | "generation_mode"
  | "platform"
  | "product_category"
  | "image_type"
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

/** Input to the Fragment-based Prompt Builder */
export interface PromptBuilderInput {
  /** Selected prompt fragments */
  selectedFragments: PromptFragment[];
  /** User's handwritten additional prompt */
  userPrompt: string;
  /** User's handwritten negative prompt */
  userNegativePrompt?: string;
  /** Whether a product reference image is provided */
  hasProductImage?: boolean;
  /** Whether style reference images are provided */
  hasStyleReferences?: boolean;
  /** Generation mode fragment id (defaults to conservative_enhancement) */
  generationModeId?: string;
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

/** Extended prompt generation config */
export interface ExtendedPromptConfig {
  ratio?: string;
  width?: number;
  height?: number;
  model?: string;
  quality?: string;
  outputCount?: number;
  /** Selected fragment ids */
  selectedFragmentIds?: string[];
  /** Generation mode fragment id */
  generationModeId?: string;
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
