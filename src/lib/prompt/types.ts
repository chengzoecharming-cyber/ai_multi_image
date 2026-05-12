/**
 * Prompt Configuration Layer Types
 *
 * Defines the type system for:
 * - Prompt rule options (platforms, categories, image types, visual tags, etc.)
 * - Prompt builder inputs and outputs
 * - Field configurations stored in prompt group config
 */

/** A single selectable option with a prompt fragment */
export interface PromptRuleOption {
  id: string;
  label: string;
  promptFragment: string;
  sortOrder: number;
  enabled: boolean;
}

/** Rule category definition */
export interface PromptRuleCategory {
  key: string;
  label: string;
  description?: string;
  allowMultiple: boolean;
  options: PromptRuleOption[];
}

/** User's field selections for prompt generation */
export interface PromptFieldSelections {
  platform?: string;
  productCategory?: string;
  imageType?: string;
  visualTags?: string[];
  background?: string;
  angle?: string;
}

/** Input to the Prompt Builder */
export interface PromptBuilderInput {
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

/** Extended config for prompt groups including field selections and provider config */
export interface ExtendedPromptConfig {
  ratio?: string;
  width?: number;
  height?: number;
  model?: string;
  quality?: string;
  outputCount?: number;
  /** Structured field selections */
  promptFields?: PromptFieldSelections;
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
