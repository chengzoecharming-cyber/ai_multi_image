"use client";

import { useState, useMemo } from "react";
import { X, BookOpen, User, Sparkles, LayoutGrid, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PlanTemplate } from "@/lib/plan-templates/types";

interface PlanTemplateLibraryDrawerProps {
  open: boolean;
  onClose: () => void;
  onUseTemplate: (template: PlanTemplate) => void;
  systemTemplates: PlanTemplate[];
  userTemplates: PlanTemplate[];
}

type TabKey = "system" | "user";

export default function PlanTemplateLibraryDrawer({
  open,
  onClose,
  onUseTemplate,
  systemTemplates,
  userTemplates,
}: PlanTemplateLibraryDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("system");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const templates = activeTab === "system" ? systemTemplates : userTemplates;

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedId) || null,
    [templates, selectedId]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[900px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-indigo-500" />
            </div>
            <h2 className="text-base font-semibold text-gray-800">方案模板库</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50/50">
          <button
            onClick={() => { setActiveTab("system"); setSelectedId(null); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === "system"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            系统预置模板
            <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-1">
              {systemTemplates.length}
            </Badge>
          </button>
          <button
            onClick={() => { setActiveTab("user"); setSelectedId(null); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === "user"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            )}
          >
            <User className="w-3.5 h-3.5" />
            我的模板
            <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-1">
              {userTemplates.length}
            </Badge>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Template List */}
          <div className="w-[360px] border-r border-gray-100 overflow-y-auto">
            {templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                <p className="text-sm text-gray-500">
                  {activeTab === "user" ? "暂无用户保存的模板" : "暂无系统模板"}
                </p>
                {activeTab === "user" && (
                  <p className="text-xs text-gray-400 mt-1">
                    在方案卡片上点击「保存为模板」即可创建
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={cn(
                      "w-full text-left rounded-xl border p-3 transition-all",
                      selectedId === t.id
                        ? "border-indigo-300 bg-indigo-50/60 shadow-sm"
                        : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {t.category === "image_set" ? (
                        <LayoutGrid className="w-3.5 h-3.5 text-violet-500" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                      )}
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {t.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                      {t.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal">
                        {t.category === "image_set" ? "组图" : "单图"}
                      </Badge>
                      {t.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px] h-4 px-1 font-normal"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <div className="flex-1 overflow-y-auto p-5 bg-gray-50/30">
            {selectedTemplate ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {selectedTemplate.category === "image_set" ? (
                      <LayoutGrid className="w-5 h-5 text-violet-500" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-indigo-500" />
                    )}
                    <h3 className="text-base font-semibold text-gray-800">
                      {selectedTemplate.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedTemplate.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    variant={selectedTemplate.scope === "system" ? "default" : "outline"}
                    className="text-xs"
                  >
                    {selectedTemplate.scope === "system" ? "系统预置" : "用户保存"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {selectedTemplate.category === "image_set" ? "组图模板" : "单图模板"}
                  </Badge>
                  {selectedTemplate.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    适用平台
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTemplate.applicablePlatforms.map((p) => (
                      <span
                        key={p}
                        className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    变量占位符
                  </h4>
                  <div className="space-y-2">
                    {selectedTemplate.variables.map((v) => (
                      <div
                        key={v.key}
                        className="flex items-start gap-2 text-sm bg-white rounded-lg border border-gray-100 p-2.5"
                      >
                        <code className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-mono shrink-0">
                          {v.key}
                        </code>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-700 font-medium">{v.label}</span>
                            {v.required && (
                              <span className="text-[10px] text-red-500">*</span>
                            )}
                          </div>
                          {v.placeholder && (
                            <p className="text-xs text-gray-400 mt-0.5">{v.placeholder}</p>
                          )}
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0">
                          {v.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Prompt 模板预览
                  </h4>
                  <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                    <pre className="text-xs text-gray-100 whitespace-pre-wrap font-mono leading-relaxed max-h-[240px] overflow-y-auto">
                      {selectedTemplate.templatePrompt}
                    </pre>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => {
                      onUseTemplate(selectedTemplate);
                      onClose();
                    }}
                    className="w-full h-10 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0 shadow-lg shadow-indigo-200"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    使用此模板
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <BookOpen className="w-10 h-10 mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">选择一个模板查看详情</p>
                <p className="text-xs text-gray-400 mt-1">
                  点击左侧模板卡片预览 Prompt 和变量
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
