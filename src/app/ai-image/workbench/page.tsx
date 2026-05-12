"use client";

import { useState, useCallback, useEffect } from "react";
import { Wand2, History, Sparkles, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { PromptGroup, ImageTask, ReferenceImage, PromptGroupConfig } from "@/lib/types";
import { generateImage, getTasks, createPromptGroup, updatePromptGroup, uploadFile } from "@/lib/api";
import SizeSelector from "@/components/create/SizeSelector";
import PromptEditor from "@/components/create/PromptEditor";
import ReferenceUploader from "@/components/create/ReferenceUploader";
import CurrentTemplateBar from "@/components/create/CurrentTemplateBar";
import PreviewPanel from "@/components/create/PreviewPanel";
import TemplateLibraryDrawer from "@/components/template-library/TemplateLibraryDrawer";

// Default empty config
const DEFAULT_CONFIG: PromptGroupConfig = {
  ratio: "1:1",
  width: 1024,
  height: 1024,
  model: "default",
  quality: "standard",
};

// Simple hash for detecting modifications
function hashConfig(obj: unknown): string {
  return JSON.stringify(obj);
}

export default function WorkbenchPage() {
  // -- Core state --
  const [promptContent, setPromptContent] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [config, setConfig] = useState<PromptGroupConfig>(DEFAULT_CONFIG);
  const [references, setReferences] = useState<ReferenceImage[]>([]);

  // -- Template state --
  const [currentTemplate, setCurrentTemplate] = useState<PromptGroup | null>(null);
  const [originalHash, setOriginalHash] = useState<string>("");
  const isModified = currentTemplate
    ? hashConfig({ promptContent, negativePrompt, config, references }) !== originalHash
    : false;

  // -- Generation state --
  const [isGenerating, setIsGenerating] = useState(false);
  const [latestTask, setLatestTask] = useState<ImageTask | null>(null);
  const [taskHistory, setTaskHistory] = useState<ImageTask[]>([]);

  // -- UI state --
  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false);

  // Load task history on mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await getTasks();
      setTaskHistory(res.data);
      if (res.data.length > 0) {
        setLatestTask(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    }
  };

  // -- Handlers --
  const handleSizeChange = useCallback((value: string, width: number, height: number) => {
    setConfig((prev) => ({ ...prev, ratio: value, width, height }));
  }, []);

  const handleAddReferences = useCallback((newImages: ReferenceImage[]) => {
    setReferences((prev) => [...prev, ...newImages]);
  }, []);

  const handleRemoveReference = useCallback((index: number) => {
    setReferences((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearReferences = useCallback(() => {
    setReferences([]);
  }, []);

  const handleInsertTemplate = useCallback((template: PromptGroup) => {
    setPromptContent((prev) => {
      if (!prev) return template.promptContent;
      return `${prev}，${template.promptContent}`;
    });
    if (template.negativePrompt) {
      setNegativePrompt((prev) => {
        if (!prev) return template.negativePrompt!;
        return `${prev}，${template.negativePrompt}`;
      });
    }
    toast.success(`已插入模板「${template.name}」`);
  }, []);

  const handleReplaceTemplate = useCallback((template: PromptGroup) => {
    setPromptContent(template.promptContent);
    if (template.negativePrompt) setNegativePrompt(template.negativePrompt);
    if (template.config) {
      setConfig(template.config);
    }
    if (template.references && template.references.length > 0) {
      setReferences(template.references);
    }
    setCurrentTemplate(template);
    setOriginalHash(
      hashConfig({
        promptContent: template.promptContent,
        negativePrompt: template.negativePrompt || "",
        config: template.config || DEFAULT_CONFIG,
        references: template.references || [],
      })
    );
    toast.success(`已替换为模板「${template.name}」`);
  }, []);

  const handleSaveTemplate = useCallback(async () => {
    if (!currentTemplate) return;
    try {
      await updatePromptGroup(currentTemplate.id, {
        name: currentTemplate.name,
        promptContent,
        negativePrompt,
        configJson: JSON.stringify(config),
        references,
      });
      setOriginalHash(hashConfig({ promptContent, negativePrompt, config, references }));
      toast.success("模板已保存");
    } catch (err) {
      toast.error("保存失败");
      console.error(err);
    }
  }, [currentTemplate, promptContent, negativePrompt, config, references]);

  const handleSaveAsTemplate = useCallback(async () => {
    try {
      const res = await createPromptGroup({
        name: `未命名模板 ${new Date().toLocaleString("zh-CN", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        promptContent,
        negativePrompt,
        configJson: JSON.stringify(config),
        categoryId: currentTemplate?.categoryId || "",
        references,
      });
      setCurrentTemplate(res.data);
      setOriginalHash(hashConfig({ promptContent, negativePrompt, config, references }));
      toast.success("已另存为新模板");
    } catch (err) {
      toast.error("保存失败");
      console.error(err);
    }
  }, [promptContent, negativePrompt, config, references, currentTemplate]);

  const handleGenerate = useCallback(async () => {
    if (!promptContent.trim() && references.length === 0) {
      toast.error("请填写创意描述或上传参考图");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await generateImage({
        promptContent,
        negativePrompt,
        referenceImageUrls: references.map((r) => r.imageUrl),
        config,
      });
      const task = res.data;
      setLatestTask(task);
      setTaskHistory((prev) => [task, ...prev]);
      if (task.status === "completed" && task.resultImageUrl) {
        toast.success("图片生成成功");
      } else if (task.status === "failed") {
        toast.error(task.errorMessage || "生成失败");
      }
    } catch (err) {
      toast.error("生成请求失败");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }, [promptContent, negativePrompt, references, config]);

  const handleRetry = useCallback(async () => {
    if (!latestTask) return;
    setIsGenerating(true);
    try {
      const { retryTask } = await import("@/lib/api");
      const res = await retryTask(latestTask.id);
      const task = res.data;
      setLatestTask(task);
      setTaskHistory((prev) => [task, ...prev.filter((t) => t.id !== task.id)]);
      if (task.status === "completed" && task.resultImageUrl) {
        toast.success("图片生成成功");
      } else if (task.status === "failed") {
        toast.error(task.errorMessage || "生成失败");
      }
    } catch (err) {
      toast.error("重试失败");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }, [latestTask]);

  const handleDownload = useCallback(() => {
    if (!latestTask?.resultImageUrl) return;
    const a = document.createElement("a");
    a.href = latestTask.resultImageUrl;
    a.download = `ai-image-${latestTask.id.slice(0, 8)}.png`;
    a.target = "_blank";
    a.click();
  }, [latestTask]);

  // Drop-to-upload on right panel
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
      if (!files.length) return;
      const remaining = 5 - references.length;
      const toUpload = files.slice(0, remaining);
      const newImages: ReferenceImage[] = [];
      for (const file of toUpload) {
        try {
          const res = await uploadFile(file);
          newImages.push({
            imageUrl: res.data.url,
            imageName: res.data.name,
            sortOrder: references.length + newImages.length,
          });
        } catch (err) {
          console.error("Upload failed:", err);
        }
      }
      if (newImages.length > 0) {
        setReferences((prev) => [...prev, ...newImages]);
        toast.success(`已上传 ${newImages.length} 张参考图`);
      }
    },
    [references]
  );

  return (
    <div className="h-[calc(100vh-3.5rem)] flex bg-[#F7F8FA]">
      {/* Left config panel */}
      <div className="w-[460px] shrink-0 flex flex-col bg-white">
        {/* Scrollable config area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
          {/* Product & composition preview */}
          <div>
            <label className="block text-[14px] font-bold text-gray-800 mb-3">
              商品及构图
            </label>
            <div className="rounded-2xl bg-[#F8F9FB] h-[180px] flex items-center justify-center overflow-hidden">
              {references.length > 0 ? (
                <img
                  src={references[0].imageUrl}
                  alt="商品预览"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-[13px] text-gray-400">从右侧上传图片后开始制作</span>
              )}
            </div>
          </div>

          {/* Size selector */}
          <div>
            <label className="block text-[14px] font-bold text-gray-800 mb-3">
              <span className="text-red-500 mr-1">*</span>生成尺寸
            </label>
            <SizeSelector
              value={config.ratio || "1:1"}
              width={config.width}
              height={config.height}
              onChange={handleSizeChange}
            />
          </div>

          {/* Prompt editor */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[14px] font-bold text-gray-800">
                <span className="text-red-500 mr-1">*</span>创意灵感
              </label>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-semibold text-gray-700">描述词推荐</span>
              <button
                onClick={() => setTemplateLibraryOpen(true)}
                className="text-[12px] text-gray-500 hover:text-indigo-600 transition-colors"
              >
                从模版库添加
              </button>
            </div>
            <div className="rounded-2xl bg-[#F8F9FB] p-4 space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <button className="flex items-center gap-1.5 text-indigo-600 font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  快捷创作
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500 text-white font-medium">HOT</span>
                </button>
                <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors">
                  <Sparkles className="w-3.5 h-3.5" />
                  高级创作
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">创意描述</label>
                <PromptEditor
                  value={promptContent}
                  onChange={setPromptContent}
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>

          {/* Negative prompt */}
          <div>
            <label className="block text-[14px] font-bold text-gray-800 mb-3">排除内容</label>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="输入不希望在画面中出现的内容..."
              disabled={isGenerating}
              className="w-full min-h-[80px] px-4 py-3 text-[13px] bg-[#F5F6F8] border-0 rounded-xl resize-none outline-none placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Reference upload */}
          <div>
            <label className="block text-[14px] font-bold text-gray-800 mb-3">
              风格参考<span className="text-gray-400 font-normal text-sm ml-1">（非必填）</span>
            </label>
            <ReferenceUploader
              images={references}
              onAdd={handleAddReferences}
              onRemove={handleRemoveReference}
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Bottom action area */}
        <div className="shrink-0 px-6 pt-4 pb-6 bg-white">
          {/* Current template bar */}
          <CurrentTemplateBar
            templateName={currentTemplate?.name}
            isModified={isModified}
            onSave={handleSaveTemplate}
            onSaveAs={handleSaveAsTemplate}
            disabled={isGenerating}
          />

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || (!promptContent.trim() && references.length === 0)}
            className="w-full h-[52px] mt-4 rounded-2xl text-[15px] font-semibold text-white border-0 shadow-lg shadow-indigo-500/20 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#5558E0] hover:to-[#7C4FE6] disabled:opacity-60"
          >
            <Wand2 className="w-5 h-5 mr-2" />
            {isGenerating ? "生成中..." : "立即生成"}
          </Button>
        </div>
      </div>

      {/* Right preview panel */}
      <div
        className="flex-1 flex flex-col min-w-0"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            <History className="w-3.5 h-3.5" />
            历史记录
          </button>
          <div className="flex items-center gap-2">
            {taskHistory.length > 0 && (
              <span className="text-[12px] text-gray-400">
                已生成 {taskHistory.filter((t) => t.status === "completed").length} 张
              </span>
            )}
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-y-auto">
          <PreviewPanel
            references={references}
            latestTask={latestTask}
            isGenerating={isGenerating}
            onRetry={handleRetry}
            onDownload={handleDownload}
            onClearReferences={handleClearReferences}
          />
        </div>

        {/* History strip at bottom */}
        {taskHistory.length > 0 && (
          <div className="shrink-0 px-6 py-3">
            <div className="flex items-center gap-2 mb-2">
              <History className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] font-medium text-gray-500">历史记录</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {taskHistory.slice(0, 10).map((task) => (
                <button
                  key={task.id}
                  onClick={() => setLatestTask(task)}
                  className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-white hover:ring-2 hover:ring-indigo-200 transition-all"
                >
                  {task.status === "completed" && task.resultImageUrl ? (
                    <img src={task.resultImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : task.status === "failed" ? (
                    <div className="w-full h-full flex items-center justify-center bg-red-50">
                      <span className="text-[9px] text-red-400">失败</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <span className="text-[9px] text-gray-400">{task.status === "processing" ? "中" : "待"}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Template library drawer */}
      <TemplateLibraryDrawer
        open={templateLibraryOpen}
        onClose={() => setTemplateLibraryOpen(false)}
        onInsert={handleInsertTemplate}
        onReplace={handleReplaceTemplate}
      />
    </div>
  );
}
