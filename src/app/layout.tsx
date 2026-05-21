import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 制图工作台",
  description: "轻量 AI 商业创意工作台 - 基于提示词组的参考图生图工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F6F8FC] font-sans">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
