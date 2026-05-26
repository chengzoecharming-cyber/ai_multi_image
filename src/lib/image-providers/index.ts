import { ImageProvider } from "./types";
import { MockImageProvider } from "./mock-provider";
import { PollinationsProvider } from "./pollinations-provider";
import { SiliconFlowProvider } from "./siliconflow-provider";
import { VolcanoProvider } from "./volcano-provider";
import { QwenProvider } from "./qwen-provider";
import { ChatGPT2APIProvider } from "./chatgpt2api-provider";

export function getImageProvider(providerName?: string): ImageProvider {
  const provider = providerName || process.env.IMAGE_PROVIDER || "pollinations";

  switch (provider.toLowerCase()) {
    case "mock":
      return new MockImageProvider();
    case "siliconflow":
      return new SiliconFlowProvider();
    case "volcano":
    case "ark":
    case "seedream":
      return new VolcanoProvider();
    case "qwen":
    case "wanx":
    case "dashscope":
      return new QwenProvider();
    case "chatgpt2api":
    case "chatgpt":
    case "gpt-image-2":
      return new ChatGPT2APIProvider();
    case "pollinations":
    default:
      return new PollinationsProvider();
  }
}

export function listProviderNames(): string[] {
  return ["pollinations", "volcano", "siliconflow", "qwen", "chatgpt2api"];
}

export * from "./types";
