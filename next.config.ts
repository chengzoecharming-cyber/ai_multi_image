import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
