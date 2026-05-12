export interface GenerateImageParams {
  prompt: string;
  negativePrompt?: string;
  referenceImageUrls: string[];
  width: number;
  height: number;
  model?: string;
  quality?: string;
}

export interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface ImageProvider {
  generate(params: GenerateImageParams): Promise<GenerateImageResult>;
}
