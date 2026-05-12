"use client";

import { useState, useCallback, useEffect } from "react";
import { Wand2, History } from "lucide-react";
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
    <div className="h-[calc(100vh-3.5rem)] flex bg-[#F6F8FC]">
      {/* Left config panel */}
      <div className="w-[380px] shrink-0 flex flex-col bg-white border-r border-gray-200">
        {/* Scrollable config area */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Size selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">生成尺寸</label>
            <SizeSelector
              value={config.ratio || "1:1"}
              width={config.width}
              height={config.height}
              onChange={handleSizeChange}
            />
          </div>

          {/* Prompt editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700">创意描述</label>
              <span className="text-[10px] text-gray-400">{promptContent.length} 字</span>
            </div>
            <PromptEditor
              value={promptContent}
              onChange={setPromptContent}
              onOpenTemplateLibrary={() => setTemplateLibraryOpen(true)}
              disabled={isGenerating}
            />
          </div>

          {/* Negative prompt (collapsed feel) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">排除内容</label>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="输入不希望在画面中出现的内容..."
              disabled={isGenerating}
              className="w-full min-h-[60px] px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 resize-none outline-none"
            />
          </div>

          {/* Reference upload */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">参考图</label>
            <ReferenceUploader
              images={references}
              onAdd={handleAddReferences}
              onRemove={handleRemoveReference}
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Bottom action area */}
        <div className="px-5 pb-5 pt-0 space-y-3">
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
            className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
          >
            <Wand2 className="w-4 h-4 mr-2" />
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
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200/60 bg-white/50">
          <h1 className="text-sm font-semibold text-gray-700">AI 商品图创作</h1>
          <div className="flex items-center gap-2">
            {taskHistory.length > 0 && (
              <span className="text-[11px] text-gray-400">
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
          <div className="shrink-0 px-6 py-3 border-t border-gray-200/60 bg-white/50">
            <div className="flex items-center gap-2 mb-2">
              <History className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] font-medium text-gray-500">历史记录</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {taskHistory.slice(0, 10).map((task) => (
                <button
                  key={task.id}
                  onClick={() => setLatestTask(task)}
                  className="relative shrink-0 w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-white hover:border-indigo-300 transition-colors"
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
