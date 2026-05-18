export interface PromptGroupConfig {
  ratio?: string;
  width?: number;
  height?: number;
  model?: string;
  quality?: string;
  outputCount?: number;
  /**
   * When true (default), forbid providers from silently normalizing to a nearby size.
   * If a provider doesn't support the exact size, the request should fail with a clear error.
   */
  strictSize?: boolean;
  /**
   * Optional deterministic seed. If omitted, backend may auto-derive a stable seed
   * in conservative modes to reduce randomness.
   */
  seed?: number;
  /** Selected fragment ids */
  selectedFragmentIds?: string[];
  /** Generation mode fragment id */
  generationModeId?: string;
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

/** Snapshot of reference images with roles for tasks */
export interface ReferenceImagesSnapshot {
  productImageUrl: string | null;
  styleReferenceUrls: string[];
}

// 我的模板（AiPromptGroup）
export interface PromptGroup {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  // 用户输入的原始 prompt
  promptContent: string;
  // 最终拼接后的 prompt
  finalPrompt?: string;
  negativePrompt?: string;
  // 选中的片段 ID 列表
  selectedFragmentIds?: string[];
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
}

// 生成任务（AiImageTask）
export interface ImageTask {
  id: string;
  tenantId: string;
  userId: string;
  // 关联的模板 ID（如果是从模板生成的）
  promptGroupId?: string;
  // 选中的片段 ID 列表（JSON 字符串或已解析数组）
  selectedFragmentIds?: string[] | string;
  // 最终用于生成的 prompt
  promptSnapshot: string;
  // 用户输入的原始 prompt
  userPrompt?: string;
  // 负向 prompt
  negativePromptSnapshot?: string;
  // API 返回原始 JSON 字符串，前端解析后可以是对象
  configSnapshot: PromptGroupConfig | string;
  referenceImagesSnapshot: ReferenceImagesSnapshot | ReferenceImage[] | string;
  status: "pending" | "processing" | "completed" | "failed";
  resultImageUrl?: string;
  errorMessage?: string;
  // 原始 provider 响应（调试用）
  rawResponse?: string;
  // 使用的 provider 名称
  provider?: string;
  createdAt: string;
  updatedAt: string;
  promptGroup?: PromptGroup;
}

export interface GenerateRequest {
  promptGroupId?: string;
  /** Template-based generation */
  templateId?: string;
  variableValues?: Record<string, string>;
  userDescription?: string;
  /** Legacy: fragment-based generation */
  promptContent?: string;
  negativePrompt?: string;
  productImageUrl: string | null;
  styleReferenceUrls: string[];
  config: PromptGroupConfig;
}
