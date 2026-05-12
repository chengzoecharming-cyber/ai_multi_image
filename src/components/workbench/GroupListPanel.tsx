"use client";

import { useState } from "react";
import { Search, Plus, ImageIcon, Clock, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { PromptGroup, PromptCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GroupListPanelProps {
  groups: PromptGroup[];
  categories: PromptCategory[];
  selectedGroupId: string | null;
  onSelectGroup: (group: PromptGroup) => void;
  onCreateGroup: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategoryId: string | null;
  onCategoryChange: (id: string | null) => void;
}

export default function GroupListPanel({
  groups,
  categories,
  selectedGroupId,
  onSelectGroup,
  onCreateGroup,
  searchQuery,
  onSearchChange,
  selectedCategoryId,
  onCategoryChange,
}: GroupListPanelProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <div className="flex flex-col h-full w-full border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            提示词组
          </h2>
          <Button
            size="sm"
            onClick={onCreateGroup}
            className="h-7 px-2 text-xs bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            新建
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className={cn(
            "absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors",
            isSearchFocused ? "text-indigo-500" : "text-gray-400"
          )} />
          <Input
            placeholder="搜索提示词组..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="pl-8 h-8 text-sm bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-300 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-3 py-2 border-b border-gray-100">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-1.5">
            <button
              onClick={() => onCategoryChange(null)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0",
                selectedCategoryId === null
                  ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                  : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
              )}
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0",
                  selectedCategoryId === cat.id
                    ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                    : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Group Cards */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Layers className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">暂无提示词组</p>
              <p className="text-xs mt-0.5">点击上方新建按钮创建</p>
            </div>
          ) : (
            groups.map((group) => (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all duration-200 group",
                  selectedGroupId === group.id
                    ? "border-indigo-300 bg-indigo-50/60 shadow-sm ring-1 ring-indigo-100"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                )}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <h3 className={cn(
                    "text-sm font-medium truncate pr-2",
                    selectedGroupId === group.id ? "text-indigo-700" : "text-gray-700"
                  )}>
                    {group.name}
                  </h3>
                  {group.category && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0 border-gray-200 text-gray-500">
                      {group.category.name}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                  {group.promptContent}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    {group.references?.length || 0} 张参考图
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {group.config?.width}×{group.config?.height}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
