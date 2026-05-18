"use client";

import Link from "next/link";
import { Sparkles, Wand2, FolderOpen, ArrowRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F6F8FC]">
      {/* Header */}
      <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-semibold text-gray-800">AI 制图工作台</span>
        </div>
        <nav className="flex items-center gap-1">
          <Link
            href="/ai-image/workbench"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <Wand2 className="w-4 h-4" />
            AI 制图工作台
          </Link>
          <Link
            href="/ai-image/prompt-groups"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <FolderOpen className="w-4 h-4" />
            提示词组管理
          </Link>
          <Link
            href="/ai-image/v2"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
          >
            <Sparkles className="w-4 h-4" />
            V2 任务式
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-200 mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            AI 制图工作台
          </h1>
          <p className="text-base text-gray-500 mb-8 leading-relaxed">
            轻量 AI 商业创意工作台，通过提示词组沉淀你的制图方案。<br />
            上传参考图、编写 Prompt、一键生成商品图片。
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/ai-image/workbench">
              <Button
                size="lg"
                className="h-11 px-6 text-base font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0 shadow-lg shadow-indigo-200"
              >
                <Wand2 className="w-5 h-5 mr-2" />
                进入 AI 制图工作台
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl w-full mt-16">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <Layers className="w-6 h-6 text-indigo-500 mb-3" />
            <h3 className="text-sm font-semibold text-gray-700 mb-1">提示词组管理</h3>
            <p className="text-xs text-gray-400">沉淀你的制图方案，快速复用和编辑</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <Wand2 className="w-6 h-6 text-violet-500 mb-3" />
            <h3 className="text-sm font-semibold text-gray-700 mb-1">参考图生图</h3>
            <p className="text-xs text-gray-400">上传参考图，AI 基于参考风格生成图片</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <Sparkles className="w-6 h-6 text-indigo-500 mb-3" />
            <h3 className="text-sm font-semibold text-gray-700 mb-1">全局配置</h3>
            <p className="text-xs text-gray-400">灵活设置尺寸、比例、模型等生成参数</p>
          </div>
        </div>
      </main>
    </div>
  );
}
