import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/.prisma/client/**/*",
      "./node_modules/@prisma/client/**/*",
      "./prisma/**/*",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.siliconflow.cn",
      },
      {
        protocol: "https",
        hostname: "*.siliconflow.cn",
      },
      {
        protocol: "https",
        hostname: "dashscope-result-bj.oss-cn-beijing.aliyuncs.com",
      },
      {
        protocol: "https",
        hostname: "*.oss-cn-beijing.aliyuncs.com",
      },
      {
        protocol: "https",
        hostname: "*.aliyun.com",
      },
    ],
  },
  async headers() {
    return [
      // Fingerprinted assets can be cached aggressively.
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // User-generated images: allow browser cache but revalidate reasonably.
      {
        source: "/generated/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      // Never cache HTML/app responses at CDN/browser layer.
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
