"use client";

import { Save, FilePlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CurrentTemplateBarProps {
  templateName?: string;
  isModified: boolean;
  onSave: () => void;
  onSaveAs: () => void;
  disabled?: boolean;
}

export default function CurrentTemplateBar({
  templateName,
  isModified,
  onSave,
  onSaveAs,
  disabled,
}: CurrentTemplateBarProps) {
  return (
    <div className="flex items-center justify-between py-3 border-t border-gray-100">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-gray-500 shrink-0">当前模板</span>
        {templateName ? (
          <>
            <span className="text-xs font-medium text-gray-700 truncate">
              {templateName}
            </span>
            {isModified && (
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-1.5 border-amber-300 text-amber-600 bg-amber-50 shrink-0"
              >
                <AlertCircle className="w-3 h-3 mr-0.5" />
                未保存
              </Badge>
            )}
          </>
        ) : (
          <span className="text-xs text-gray-400">未选择模板</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={onSave}
          disabled={disabled || !isModified}
          className="h-7 px-2.5 text-xs border-gray-300"
        >
          <Save className="w-3 h-3 mr-1" />
          保存
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onSaveAs}
          disabled={disabled}
          className="h-7 px-2.5 text-xs border-gray-300"
        >
          <FilePlus className="w-3 h-3 mr-1" />
          另存为
        </Button>
      </div>
    </div>
  );
}
