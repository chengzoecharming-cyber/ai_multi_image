import { ImageProvider } from "./types";
import { MockImageProvider } from "./mock-provider";
import { PollinationsProvider } from "./pollinations-provider";
import { SiliconFlowProvider } from "./siliconflow-provider";
import { VolcanoProvider } from "./volcano-provider";
import { QwenProvider } from "./qwen-provider";

export function getImageProvider(): ImageProvider {
  const provider = process.env.IMAGE_PROVIDER || "pollinations";

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
    case "pollinations":
    default:
      return new PollinationsProvider();
  }
}

export * from "./types";
