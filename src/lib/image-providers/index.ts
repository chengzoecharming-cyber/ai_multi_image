import { ImageProvider } from "./types";
import { VolcanoProvider } from "./volcano-provider";
import { ChatGPT2APIProvider } from "./chatgpt2api-provider";

export function getImageProvider(providerName?: string): ImageProvider {
  const provider = providerName || process.env.IMAGE_PROVIDER || "chatgpt2api";

  switch (provider.toLowerCase()) {
    case "volcano":
    case "ark":
    case "seedream":
      return new VolcanoProvider();
    case "chatgpt2api":
    case "chatgpt":
    case "gpt-image-2":
    default:
      return new ChatGPT2APIProvider();
  }
}

export function listProviderNames(): string[] {
  return ["volcano", "chatgpt2api"];
}

export * from "./types";
