export interface GenerateImageParams {
  prompt: string;
  negativePrompt?: string;
  /** Primary product reference image — preserves product structure */
  productImageUrl?: string | null;
  /** Style reference images — only for background/lighting/atmosphere */
  styleReferenceUrls?: string[];
  width: number;
  height: number;
  /**
   * If true, do not allow provider to silently normalize the requested size.
   * Providers that only support a fixed set of sizes should fail instead.
   */
  strictSize?: boolean;
  /**
   * Optional seed for deterministic outputs (provider-dependent).
   * If omitted, providers may randomize.
   */
  seed?: number;
  /**
   * Optional img2img / edit strength (0-1). Only supported by some providers.
   * Lower values generally preserve the reference image more.
   */
  editStrength?: number;
  model?: string;
  quality?: string;
  /** AbortSignal to cancel in-flight requests */
  signal?: AbortSignal;
}

export interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface ImageProvider {
  generate(params: GenerateImageParams): Promise<GenerateImageResult>;
}
