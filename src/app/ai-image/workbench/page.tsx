"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Wand2, Eye, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { ImageTask, PromptGroup, PromptGroupConfig } from "@/lib/types";
import {
  generateImage,
  getTasks,
  uploadFile,
  getPromptGroups,
} from "@/lib/api";
import { buildPromptFromTemplate } from "@/lib/prompt";
import type { PromptTemplate } from "@/lib/prompt/templates";
import { getTemplateById } from "@/lib/prompt/templates";
import SizeSelector from "@/components/create/SizeSelector";
import ReferenceUploader from "@/components/create/ReferenceUploader";
import PreviewPanel from "@/components/create/PreviewPanel";
import TemplateSelector from "@/components/create/TemplateSelector";
import TemplateVariableForm from "@/components/create/TemplateVariableForm";

// Default empty config
const DEFAULT_CONFIG: PromptGroupConfig = {
  ratio: "1:1",
  width: 1024,
  height: 1024,
  model: "default",
  quality: "standard",
  strictSize: true,
  generationModeId: "conservative_enhancement",
};

// Generation mode options
const GENERATION_MODES = [
  { id: "conservative_enhancement", name: "保守优化", description: "尽量保持产品结构不变，只优化背景、光影、清晰度和商品展示效果" },
  { id: "commercial_showcase", name: "商业展示", description: "在保持主要结构的基础上，增强商品图的商业质感和展示效果" },
  { id: "creative_scene", name: "创意场景", description: "生成更有氛围和创意的商品图，但可能对产品结构产生更大变化" },
];

// Simple hash for detecting modifications
function hashConfig(obj: unknown): string {
  return JSON.stringify(obj);
}

export default function WorkbenchPage() {
  // -- Core state (template-first) --
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [userDescription, setUserDescription] = useState("");
  const [config, setConfig] = useState<PromptGroupConfig>(DEFAULT_CONFIG);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [styleReferenceUrls, setStyleReferenceUrls] = useState<string[]>([]);

  // -- Derived: current template object --
  const currentTemplate = useMemo(
    () => (selectedTemplateId ? getTemplateById(selectedTemplateId) || null : null),
    [selectedTemplateId]
  );

  // -- UI expand/collapse state --
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [showFullPromptDialog, setShowFullPromptDialog] = useState(false);

  // -- My templates --
  const [myTemplates, setMyTemplates] = useState<PromptGroup[]>([]);

  // -- Generation state --
  const [generatingTasks, setGeneratingTasks] = useState<ImageTask[]>([]);
  const [latestTask, setLatestTask] = useState<ImageTask | null>(null);
  const [taskHistory, setTaskHistory] = useState<ImageTask[]>([]);

  // -- Right panel view state --
  const [showHistory, setShowHistory] = useState(false);
  const hasGenerating = generatingTasks.length > 0;

  // -- UI state --
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);

  // -- Computed: built prompt preview --
  const builtPrompt = useMemo(() => {
    if (!currentTemplate) {
      return { positivePrompt: "", negativePrompt: "" };
    }
    return buildPromptFromTemplate({
      templateId: currentTemplate.id,
      variableValues,
      userDescription: userDescription || undefined,
      hasProductImage: !!productImageUrl,
      hasStyleReferences: styleReferenceUrls.length > 0,
    });
  }, [currentTemplate, variableValues, userDescription, productImageUrl, styleReferenceUrls]);

  // Load task history + my templates on mount
  useEffect(() => {
    loadTasks();
    loadMyTemplates();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await getTasks();
      setTaskHistory(res.data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    }
  };

  const loadMyTemplates = async () => {
    try {
      const res = await getPromptGroups();
      setMyTemplates(res.data);
    } catch (err) {
      console.error("Failed to load my templates:", err);
    }
  };

  // -- Template selection --
  const handleSelectTemplate = useCallback((template: PromptTemplate) => {
    setSelectedTemplateId(template.id);
    // Reset variables to defaults
    const defaults: Record<string, string> = {};
    for (const v of template.variables) {
      defaults[v.key] = v.defaultValue || "";
    }
    setVariableValues(defaults);
    toast.success(`已选择模版「${template.name}」`);
  }, []);

  // -- Handlers --
  const handleSizeChange = useCallback((value: string, width: number, height: number) => {
    setConfig((prev) => ({ ...prev, ratio: value, width, height }));
  }, []);

  // Product image handlers
  const handleProductImageUpload = useCallback(
    async (files: FileList) => {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!fileArray.length) return;
      const file = fileArray[0];
      try {
        const res = await uploadFile(file);
        setProductImageUrl(res.data.url);
        toast.success("商品主体图已上传");
      } catch (err) {
        toast.error("上传失败");
        console.error(err);
      }
    },
    []
  );

  const handleRemoveProductImage = useCallback(() => {
    setProductImageUrl(null);
  }, []);

  // Style reference handlers
  const handleAddStyleReferences = useCallback((newUrls: string[]) => {
    setStyleReferenceUrls((prev) => [...prev, ...newUrls]);
  }, []);

  const handleRemoveStyleReference = useCallback((index: number) => {
    setStyleReferenceUrls((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!currentTemplate) {
      toast.error("请先选择一个模版");
      return;
    }
    if (!productImageUrl) {
      toast.error("请上传商品主体图");
      return;
    }

    // Create a placeholder task to show in the generating list immediately
    const placeholderTask: ImageTask = {
      id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tenantId: "default",
      userId: "default",
      promptSnapshot: builtPrompt.positivePrompt,
      configSnapshot: config,
      referenceImagesSnapshot: {
        productImageUrl,
        styleReferenceUrls,
      },
      status: "processing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setGeneratingTasks((prev) => [placeholderTask, ...prev]);

    try {
      const res = await generateImage({
        templateId: currentTemplate.id,
        variableValues,
        userDescription: userDescription || undefined,
        productImageUrl,
        styleReferenceUrls,
        config: {
          ...config,
          generationModeId: config.generationModeId || DEFAULT_CONFIG.generationModeId,
        },
      });
      const task = res.data;
      setLatestTask(task);
      setTaskHistory((prev) => [task, ...prev]);
      setGeneratingTasks((prev) => prev.filter((t) => t.id !== placeholderTask.id));
      if (task.status === "completed" && task.resultImageUrl) {
        toast.success("图片生成成功");
      } else if (task.status === "failed") {
        toast.error(task.errorMessage || "生成失败");
      }
    } catch (err) {
      toast.error("生成请求失败");
      console.error(err);
      setGeneratingTasks((prev) => prev.filter((t) => t.id !== placeholderTask.id));
    }
  }, [currentTemplate, builtPrompt, productImageUrl, styleReferenceUrls, config, variableValues, userDescription]);

  const handleRetry = useCallback(async () => {
    if (!latestTask) return;
    const placeholderTask: ImageTask = {
      id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tenantId: "default",
      userId: "default",
      promptSnapshot: latestTask.promptSnapshot,
      configSnapshot: latestTask.configSnapshot,
      referenceImagesSnapshot: latestTask.referenceImagesSnapshot,
      status: "processing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setGeneratingTasks((prev) => [placeholderTask, ...prev]);
    try {
      const { retryTask } = await import("@/lib/api");
      const res = await retryTask(latestTask.id);
      const task = res.data;
      setLatestTask(task);
      setTaskHistory((prev) => [task, ...prev.filter((t) => t.id !== task.id)]);
      setGeneratingTasks((prev) => prev.filter((t) => t.id !== placeholderTask.id));
      if (task.status === "completed" && task.resultImageUrl) {
        toast.success("图片生成成功");
      } else if (task.status === "failed") {
        toast.error(task.errorMessage || "生成失败");
      }
    } catch (err) {
      toast.error("重试失败");
      console.error(err);
      setGeneratingTasks((prev) => prev.filter((t) => t.id !== placeholderTask.id));
    }
  }, [latestTask]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      const { deleteTask } = await import("@/lib/api");
      await deleteTask(taskId);
      setTaskHistory((prev) => prev.filter((t) => t.id !== taskId));
      setLatestTask((prev) => (prev?.id === taskId ? null : prev));
      toast.success("已删除生成记录");
    } catch (err) {
      toast.error("删除失败");
      console.error(err);
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (!latestTask?.resultImageUrl) return;
    let urls: string[] = [];
    try {
      const parsed = JSON.parse(latestTask.resultImageUrl);
      urls = Array.isArray(parsed) ? parsed : [latestTask.resultImageUrl];
    } catch {
      urls = [latestTask.resultImageUrl];
    }
    urls.forEach((url, i) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-image-${latestTask.id.slice(0, 8)}-${i + 1}.png`;
      a.target = "_blank";
      a.click();
    });
  }, [latestTask]);

  // Drop-to-upload on right panel
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
      if (!files.length) return;

      if (!productImageUrl) {
        try {
          const res = await uploadFile(files[0]);
          setProductImageUrl(res.data.url);
          toast.success("商品主体图已上传");
        } catch (err) {
          console.error("Upload failed:", err);
        }
        const remaining = files.slice(1);
        const newUrls: string[] = [];
        for (const file of remaining.slice(0, 5 - styleReferenceUrls.length)) {
          try {
            const res = await uploadFile(file);
            newUrls.push(res.data.url);
          } catch (err) {
            console.error("Upload failed:", err);
          }
        }
        if (newUrls.length > 0) {
          setStyleReferenceUrls((prev) => [...prev, ...newUrls]);
          toast.success(`已上传 ${newUrls.length} 张风格参考图`);
        }
      } else {
        const toUpload = files.slice(0, 5 - styleReferenceUrls.length);
        const newUrls: string[] = [];
        for (const file of toUpload) {
          try {
            const res = await uploadFile(file);
            newUrls.push(res.data.url);
          } catch (err) {
            console.error("Upload failed:", err);
          }
        }
        if (newUrls.length > 0) {
          setStyleReferenceUrls((prev) => [...prev, ...newUrls]);
          toast.success(`已上传 ${newUrls.length} 张风格参考图`);
        }
      }
    },
    [productImageUrl, styleReferenceUrls]
  );

  // File upload from empty-state click
  const handleUploadFile = useCallback(
    async (files: FileList) => {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!fileArray.length) return;

      if (!productImageUrl) {
        try {
          const res = await uploadFile(fileArray[0]);
          setProductImageUrl(res.data.url);
          toast.success("商品主体图已上传");
        } catch (err) {
          console.error("Upload failed:", err);
        }
        const remaining = fileArray.slice(1);
        const newUrls: string[] = [];
        for (const file of remaining.slice(0, 5 - styleReferenceUrls.length)) {
          try {
            const res = await uploadFile(file);
            newUrls.push(res.data.url);
          } catch (err) {
            console.error("Upload failed:", err);
          }
        }
        if (newUrls.length > 0) {
          setStyleReferenceUrls((prev) => [...prev, ...newUrls]);
          toast.success(`已上传 ${newUrls.length} 张风格参考图`);
        }
      } else {
        const toUpload = fileArray.slice(0, 5 - styleReferenceUrls.length);
        const newUrls: string[] = [];
        for (const file of toUpload) {
          try {
            const res = await uploadFile(file);
            newUrls.push(res.data.url);
          } catch (err) {
            console.error("Upload failed:", err);
          }
        }
        if (newUrls.length > 0) {
          setStyleReferenceUrls((prev) => [...prev, ...newUrls]);
          toast.success(`已上传 ${newUrls.length} 张风格参考图`);
        }
      }
    },
    [productImageUrl, styleReferenceUrls]
  );

  return (
    <div className="h-screen flex bg-[#F7F8FA] overflow-hidden">
      {/* Left config panel */}
      <div className="w-[420px] shrink-0 flex flex-col bg-white relative">
        {/* Scrollable config area */}
        <div className="flex-1 overflow-y-auto px-[16px] py-6 space-y-6">
          {/* Step 1: Select Template */}
          <div>
            <label className="block text-[14px] font-bold text-gray-800 mb-1">
              <span className="text-red-500 mr-1">*</span>1. 选择模版
            </label>
            <p className="text-[12px] text-gray-500 mb-3">
              每个模版都是完整的 Prompt 方案，选择后填写变量即可生成。
            </p>
            <TemplateSelector
              selectedTemplateId={selectedTemplateId}
              onSelect={handleSelectTemplate}
            />
          </div>

          {/* Step 2: Upload Product Image */}
          <div>
            <label className="block text-[14px] font-bold text-gray-800 mb-1">
              <span className="text-red-500 mr-1">*</span>2. 上传商品图
            </label>
            <p className="text-[12px] text-gray-500 mb-2">
              AI 将以此图为基准，保持产品外形、结构和比例。
            </p>
            <div className="rounded-2xl bg-[#F8F9FB] h-[180px] flex items-center justify-center overflow-hidden relative group">
              {productImageUrl ? (
                <>
                  <img
                    src={productImageUrl}
                    alt="商品预览"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                    <label className="px-4 py-2 bg-white text-gray-800 text-[13px] font-medium rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      重新上传
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) handleProductImageUpload(e.target.files);
                        }}
                      />
                    </label>
                    <button
                      onClick={handleRemoveProductImage}
                      className="px-4 py-2 bg-red-50 text-red-600 text-[13px] font-medium rounded-lg hover:bg-red-100 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-300 mb-2" />
                  <span className="text-[13px] text-gray-400">点击上传商品主体图</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleProductImageUpload(e.target.files);
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Step 3: Style References (Optional) */}
          <div>
            <label className="block text-[14px] font-bold text-gray-800 mb-1">
              3. 风格参考图<span className="text-gray-400 font-normal text-sm ml-1">（可选）</span>
            </label>
            <p className="text-[12px] text-gray-500 mb-2">
              AI 只参考视觉风格，不改变商品主体结构。
            </p>
            <ReferenceUploader
              urls={styleReferenceUrls}
              onAdd={handleAddStyleReferences}
              onRemove={handleRemoveStyleReference}
              maxCount={5}
            />
          </div>

          {/* Step 4: Template Variables */}
          {currentTemplate && (
            <div>
              <label className="block text-[14px] font-bold text-gray-800 mb-3">
                4. 填写模版变量
              </label>
              <TemplateVariableForm
                template={currentTemplate}
                values={variableValues}
                onChange={setVariableValues}
              />
            </div>
          )}

          {/* Step 5: Free Description (Optional) */}
          <div>
            <label className="block text-[14px] font-bold text-gray-800 mb-1">
              5. 补充自由描述<span className="text-gray-400 font-normal text-sm ml-1">（可选）</span>
            </label>
            <p className="text-[12px] text-gray-500 mb-2">
              在模版基础上追加个性化要求。
            </p>
            <textarea
              value={userDescription}
              onChange={(e) => setUserDescription(e.target.value)}
              placeholder="例如：需要在右上角增加一个对比区域、背景使用深蓝色..."
              className="w-full min-h-[80px] px-4 py-3 text-[13px] bg-[#F5F6F8] border-0 rounded-xl resize-none outline-none placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Generation mode */}
          <div>
            <label className="block text-[14px] font-bold text-gray-800 mb-3">
              生成模式
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GENERATION_MODES.map((mode) => {
                const isActive = (config.generationModeId || DEFAULT_CONFIG.generationModeId) === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() =>
                      setConfig((prev) => ({ ...prev, generationModeId: mode.id }))
                    }
                    className={cn(
                      "flex flex-col items-start p-3 rounded-xl border text-left transition-all",
                      isActive
                        ? "border-indigo-500 bg-indigo-50/40 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                    title={mode.description}
                  >
                    <span
                      className={cn(
                        "text-[13px] font-semibold",
                        isActive ? "text-indigo-700" : "text-gray-800"
                      )}
                    >
                      {mode.name}
                    </span>
                    <span className="text-[11px] text-gray-500 mt-1 leading-snug">
                      {mode.description}
                    </span>
                  </button>
                );
              })}
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
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, strictSize: prev.strictSize !== false ? false : true }))}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] border transition-colors",
                  config.strictSize !== false
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                )}
              >
                严格尺寸: {config.strictSize !== false ? "开" : "关"}
              </button>
              <span className="text-[12px] text-gray-500">
                建议保持开启，避免尺寸被自动适配
              </span>
            </div>
          </div>

          {/* Step 6: Prompt Preview (collapsible) */}
          <div>
            <button
              onClick={() => setShowPromptPreview((v) => !v)}
              className="flex items-center justify-between w-full text-left"
            >
              <label className="text-[14px] font-bold text-gray-800 cursor-pointer">
                6. 查看最终 Prompt
              </label>
              {showPromptPreview ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {showPromptPreview && (
              <div className="mt-3 space-y-3">
                {currentTemplate ? (
                  <>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                        正向 Prompt
                      </span>
                      <div className="mt-1 p-3 bg-indigo-50 rounded-lg border border-indigo-100 max-h-[200px] overflow-y-auto">
                        <pre className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-wrap font-mono">
                          {builtPrompt.positivePrompt}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                        负向 Prompt
                      </span>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-100 max-h-[120px] overflow-y-auto">
                        <pre className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap font-mono">
                          {builtPrompt.negativePrompt}
                        </pre>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowFullPromptDialog(true)}
                      className="flex items-center text-[12px] text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      在新窗口查看完整 Prompt
                    </button>
                  </>
                ) : (
                  <p className="text-[13px] text-gray-400 py-4 text-center">
                    请先选择一个模版
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom action area */}
        <div className="shrink-0 px-[16px] pt-4 pb-6 bg-white border-t border-gray-100">
          <Button
            onClick={handleGenerate}
            disabled={!currentTemplate || !productImageUrl}
            className="w-full h-[52px] rounded-2xl text-[15px] font-semibold text-white border-0 shadow-lg shadow-indigo-500/20 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#5558E0] hover:to-[#7C4FE6] disabled:opacity-60"
          >
            <Wand2 className="w-5 h-5 mr-2" />
            立即生成
          </Button>
          {!currentTemplate && (
            <p className="text-center text-[12px] text-gray-400 mt-2">
              请先选择模版并上传商品图
            </p>
          )}
        </div>
      </div>

      {/* Right preview panel */}
      <div
        className="flex-1 flex flex-col min-w-0 relative"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Top bar */}
        {!showHistory && (
          <div className="flex items-center justify-between px-6 pt-6 pb-3">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <img src="/icons/history.svg" alt="" className="w-3.5 h-3.5" />
              历史记录
            </button>
            <div className="flex items-center gap-2">
              {taskHistory.length > 0 && (
                <span className="text-[12px] text-gray-400">
                  已生成 {taskHistory.filter((t) => t.status === "completed").length} 组
                </span>
              )}
            </div>
          </div>
        )}

        {/* Preview area */}
        <div className="flex-1 overflow-y-auto">
          <PreviewPanel
            productImageUrl={productImageUrl}
            styleReferenceUrls={styleReferenceUrls}
            latestTask={latestTask}
            generatingTasks={generatingTasks}
            taskHistory={taskHistory}
            showHistory={showHistory}
            onRetry={handleRetry}
            onDownload={handleDownload}
            onRemoveProductImage={handleRemoveProductImage}
            onRemoveStyleReference={handleRemoveStyleReference}
            onSelectTask={setLatestTask}
            onCloseHistory={() => setShowHistory(false)}
            onOpenHistory={() => setShowHistory(true)}
            onUploadFile={handleUploadFile}
            onDeleteTask={handleDeleteTask}
            onRefreshTasks={loadTasks}
            onLoadTaskConfig={() => {
              // Template-first tasks cannot be restored to the old editor
              toast.info("历史记录查看功能即将适配新模版系统");
            }}
          />
        </div>
      </div>

      {/* Full Prompt Dialog */}
      <Dialog open={showFullPromptDialog} onOpenChange={setShowFullPromptDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>完整 Prompt</DialogTitle>
            <DialogDescription>
              基于模版「{currentTemplate?.name}」生成的最终 Prompt
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <h4 className="text-[12px] font-semibold text-gray-500 mb-2">模版信息</h4>
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <p className="text-[12px] text-gray-700">
                  <span className="font-medium">模版：</span>{currentTemplate?.name}
                </p>
                <p className="text-[12px] text-gray-600 mt-1">
                  <span className="font-medium">描述：</span>{currentTemplate?.description}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-[12px] font-semibold text-gray-500 mb-2">变量值</h4>
              <div className="p-2.5 bg-gray-50 rounded-lg space-y-1">
                {currentTemplate?.variables.map((v) => (
                  <p key={v.key} className="text-[12px] text-gray-700">
                    <span className="font-medium">{v.label}：</span>
                    {variableValues[v.key] || "（未填写）"}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[12px] font-semibold text-gray-500 mb-2">正向 Prompt</h4>
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <pre className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-wrap font-mono">
                  {builtPrompt.positivePrompt}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="text-[12px] font-semibold text-gray-500 mb-2">负向 Prompt</h4>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <pre className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap font-mono">
                  {builtPrompt.negativePrompt}
                </pre>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
