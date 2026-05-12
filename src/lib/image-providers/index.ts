import { ImageProvider } from "./types";
import { MockImageProvider } from "./mock-provider";

export function getImageProvider(): ImageProvider {
  return new MockImageProvider();
}

export * from "./types";
