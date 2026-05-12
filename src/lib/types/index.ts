export interface PromptFieldSelections {
  platform?: string;
  productCategory?: string;
  imageType?: string;
  visualTags?: string[];
  background?: string;
  angle?: string;
  negativeTags?: string[];
}

export interface PromptGroupConfig {
  ratio?: string;
  width?: number;
  height?: number;
  model?: string;
  quality?: string;
  outputCount?: number;
  /** Structured field selections for prompt generation */
  promptFields?: PromptFieldSelections;
  /** Provider config reserved for future ComfyUI integration */
  providerConfig?: {
    workflowId?: string | null;
    model?: string;
    steps?: number;
    cfg?: number;
    sampler?: string;
  };
}

export interface ReferenceImage {
  id?: string;
  imageUrl: string;
  imageName?: string;
  sortOrder: number;
  referenceType?: string;
}

export interface PromptGroup {
  id: string;
  tenantId: string;
  userId: string;
  categoryId: string;
  name: string;
  promptContent: string;
  negativePrompt?: string;
  // From API, configJson is a raw string; after parsing, config is the object
  configJson?: string;
  config?: PromptGroupConfig;
  remark?: string;
  coverImageUrl?: string;
  useCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
  references: ReferenceImage[];
  category?: PromptCategory;
}

export interface PromptCategory {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ImageTask {
  id: string;
  tenantId: string;
  userId: string;
  promptGroupId?: string;
  promptSnapshot: string;
  configSnapshot: PromptGroupConfig;
  referenceImagesSnapshot: ReferenceImage[];
  status: "pending" | "processing" | "completed" | "failed";
  resultImageUrl?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  promptGroup?: PromptGroup;
}

export interface GenerateRequest {
  promptGroupId?: string;
  promptContent: string;
  negativePrompt?: string;
  referenceImageUrls: string[];
  config: PromptGroupConfig;
}
