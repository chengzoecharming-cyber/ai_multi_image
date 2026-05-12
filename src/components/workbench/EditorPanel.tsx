"use client";

import { useRef } from "react";
import {
  Save,
  Copy,
  FilePlus,
  Upload,
  X,
  ImageIcon,
  Wand2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PromptGroup, PromptCategory, ReferenceImage, PromptFieldSelections } from "@/lib/types";
import { cn } from "@/lib/utils";
import PromptFieldSelector from "./PromptFieldSelector";

interface EditorPanelProps {
  group: PromptGroup | null;
  categories: PromptCategory[];
  isUnsaved: boolean;
  isSaving: boolean;
  onNameChange: (name: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onPromptChange: (prompt: string) => void;
  onNegativePromptChange: (prompt: string) => void;
  onRemarkChange: (remark: string) => void;
  onAddReference: (ref: ReferenceImage) => void;
  onRemoveReference: (index: number) => void;
  onConfigChange: (config: PromptGroup["config"]) => void;
  onPromptFieldsChange: (fields: PromptFieldSelections) => void;
  onBuildPrompt: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onDuplicate: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const RATIO_OPTIONS = [
  { value: "1:1", label: "1:1 正方形", width: 1024, height: 1024 },
  { value: "3:4", label: "3:4 竖版", width: 768, height: 1024 },
  { value: "4:5", label: "4:5 竖版", width: 820, height: 1024 },
  { value: "16:9", label: "16:9 横版", width: 1024, height: 576 },
];

export default function EditorPanel({
  group,
  categories,
  isUnsaved,
  isSaving,
  onNameChange,
  onCategoryChange,
  onPromptChange,
  onNegativePromptChange,
  onRemarkChange,
  onAddReference,
  onRemoveReference,
  onConfigChange,
  onPromptFieldsChange,
  onBuildPrompt,
  onSave,
  onSaveAs,
  onDuplicate,
  onGenerate,
  isGenerating,
}: EditorPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    if (group && group.references && group.references.length + files.length > 5) {
      alert("单个提示词组最多支持 5 张参考图");
      return;
    }

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok && data.data?.url) {
          onAddReference({
            imageUrl: data.data.url,
            imageName: data.data.name,
            sortOrder: group?.references?.length || 0,
          });
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRatioChange = (ratio: string) => {
    const option = RATIO_OPTIONS.find((o) => o.value === ratio);
    if (option && group) {
      onConfigChange({
        ...group.config,
        ratio: option.value,
        width: option.width,
        height: option.height,
      });
    }
  };

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white">
        <Wand2 className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 text-sm">请从左侧选择或新建一个提示词组</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-gray-800 truncate">
            {group.name || "未命名提示词组"}
          </h2>
          {isUnsaved && (
            <Badge
              variant="outline"
              className="text-[10px] h-5 px-1.5 border-amber-300 text-amber-600 bg-amber-50 shrink-0"
            >
              <AlertCircle className="w-3 h-3 mr-0.5" />
              未保存
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={onSave}
            disabled={isSaving || !isUnsaved}
            className="h-7 px-2.5 text-xs border-gray-300"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            保存
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onSaveAs}
            disabled={isSaving}
            className="h-7 px-2.5 text-xs border-gray-300"
          >
            <FilePlus className="w-3.5 h-3.5 mr-1" />
            另存为
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDuplicate}
            disabled={isSaving}
            className="h-7 px-2.5 text-xs border-gray-300"
          >
            <Copy className="w-3.5 h-3.5 mr-1" />
            复制
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Name & Category */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-600 mb-1.5 block">提示词组名称</Label>
            <Input
              value={group.name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="输入名称..."
              className="h-8 text-sm bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-600 mb-1.5 block">分类</Label>
            <Select value={group.categoryId} onValueChange={(v) => onCategoryChange(v || "")}>
              <SelectTrigger className="h-8 text-sm bg-gray-50 border-gray-200">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Prompt Field Selector */}
        <PromptFieldSelector
          fields={group.config?.promptFields || {}}
          onChange={onPromptFieldsChange}
          onBuildPrompt={onBuildPrompt}
          disabled={isGenerating}
        />

        {/* Prompt */}
        <div>
          <Label className="text-xs text-gray-600 mb-1.5 block">Prompt</Label>
          <Textarea
            value={group.promptContent}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="输入你想生成的商品图效果..."
            className="min-h-[100px] text-sm bg-gray-50 border-gray-200 focus:bg-white resize-none"
          />
        </div>

        {/* Negative Prompt */}
        <div>
          <Label className="text-xs text-gray-600 mb-1.5 block">Negative Prompt（可选）</Label>
          <Textarea
            value={group.negativePrompt || ""}
            onChange={(e) => onNegativePromptChange(e.target.value)}
            placeholder="不希望出现的内容..."
            className="min-h-[60px] text-sm bg-gray-50 border-gray-200 focus:bg-white resize-none"
          />
        </div>

        {/* Reference Images */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-gray-600">
              参考图 ({group.references?.length || 0}/5)
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={(group.references?.length || 0) >= 5}
              className="h-6 px-2 text-[11px] border-gray-300"
            >
              <Upload className="w-3 h-3 mr-1" />
              上传参考图
            </Button>
          </div>

          {group.references && group.references.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {group.references.map((ref, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden group bg-gray-50"
                >
                  <img
                    src={ref.imageUrl}
                    alt={ref.imageName || `参考图 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => onRemoveReference(index)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
            >
              <ImageIcon className="w-6 h-6 text-gray-300 mb-1" />
              <p className="text-xs text-gray-400">点击上传参考图</p>
            </div>
          )}
        </div>

        {/* Global Config */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <h3 className="text-xs font-semibold text-gray-700 mb-3">全局配置</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">图片比例</Label>
              <Select value={group.config?.ratio} onValueChange={(v) => v && handleRatioChange(v)}>
                <SelectTrigger className="h-8 text-sm bg-white border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RATIO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">宽度</Label>
                <Input
                  type="number"
                  value={group.config?.width}
                  onChange={(e) =>
                    onConfigChange({
                      ...group.config,
                      width: parseInt(e.target.value) || 1024,
                    })
                  }
                  className="h-8 text-sm bg-white border-gray-200"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">高度</Label>
                <Input
                  type="number"
                  value={group.config?.height}
                  onChange={(e) =>
                    onConfigChange({
                      ...group.config,
                      height: parseInt(e.target.value) || 1024,
                    })
                  }
                  className="h-8 text-sm bg-white border-gray-200"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">模型</Label>
              <Select
                value={group.config?.model}
                onValueChange={(v) =>
                  onConfigChange({ ...group.config, model: v || "default" })
                }
              >
                <SelectTrigger className="h-8 text-sm bg-white border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">默认模型</SelectItem>
                  <SelectItem value="enhanced">增强模型</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">质量</Label>
              <Select
                value={group.config?.quality}
                onValueChange={(v) =>
                  onConfigChange({ ...group.config, quality: v || "standard" })
                }
              >
                <SelectTrigger className="h-8 text-sm bg-white border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">标准</SelectItem>
                  <SelectItem value="high">高清</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Remark */}
        <div>
          <Label className="text-xs text-gray-600 mb-1.5 block">备注（可选）</Label>
          <Textarea
            value={group.remark || ""}
            onChange={(e) => onRemarkChange(e.target.value)}
            placeholder="添加备注..."
            className="min-h-[50px] text-sm bg-gray-50 border-gray-200 focus:bg-white resize-none"
          />
        </div>
      </div>

      {/* Generate Button */}
      <div className="px-5 py-3 border-t border-gray-100">
        <Button
          onClick={onGenerate}
          disabled={isGenerating || !group.promptContent?.trim()}
          className={cn(
            "w-full h-10 text-sm font-semibold text-white border-0",
            "bg-gradient-to-r from-indigo-500 to-violet-500",
            "hover:from-indigo-600 hover:to-violet-600",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isGenerating ? (
            <>
              <span className="animate-spin mr-2">
                <Wand2 className="w-4 h-4" />
              </span>
              生成中...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              生成图片
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
