import { ImageProvider, GenerateImageParams, GenerateImageResult } from "./types";

const MOCK_IMAGE_URLS = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop",
];

export class MockImageProvider implements ImageProvider {
  async generate(params: GenerateImageParams): Promise<GenerateImageResult> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Randomly pick a mock image
    const randomIndex = Math.floor(Math.random() * MOCK_IMAGE_URLS.length);
    const imageUrl = MOCK_IMAGE_URLS[randomIndex];

    return {
      success: true,
      imageUrl,
    };
  }
}
