"use client";

import { useCallback } from "react";
import { Layout, Eye, Palette, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CopySourceBadge } from "../ui/CopySourceBadge";
import type { CreativePlan } from "../../types";

export function PlanEditableFields({
  plan,
  isEditing,
  onUpdate,
}: {
  plan: CreativePlan;
  isEditing: boolean;
  onUpdate: (p: CreativePlan) => void;
}) {
  const updateField = useCallback(
    <K extends keyof CreativePlan>(key: K, value: CreativePlan[K]) => {
      onUpdate({ ...plan, [key]: value });
    },
    [plan, onUpdate]
  );

  const sellingPoints = plan.sellingPoints || [];

  const updateSellingPoint = (i: number, val: string) => {
    const sp = [...sellingPoints];
    sp[i] = val;
    updateField("sellingPoints", sp);
  };

  const addSellingPoint = () => updateField("sellingPoints", [...sellingPoints, ""]);
  const removeSellingPoint = (i: number) => updateField("sellingPoints", sellingPoints.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {/* AI Auto Copy Section */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium text-gray-500 flex items-center gap-1">
            <Type className="w-3 h-3" />AI 自动文案
          </Label>
          <CopySourceBadge source={plan.copySource} />
          <span className="text-[11px] text-gray-400">可编辑</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium text-gray-500 flex items-center gap-1">
            标题 Headline <Badge variant="outline" className="text-[10px] h-3.5 px-1 font-normal">英文</Badge>
          </Label>
        </div>
        {isEditing ? (
          <Input value={plan.headline} onChange={(e) => updateField("headline", e.target.value)} className="text-sm h-8" />
        ) : (
          <p className="text-sm text-gray-800 font-medium">{plan.headline}</p>
        )}
      </div>

      {plan.subtitle && (
        <div className="space-y-1">
          <Label className="text-xs font-medium text-gray-500">副标题 Subtitle</Label>
          {isEditing ? (
            <Input value={plan.subtitle} onChange={(e) => updateField("subtitle", e.target.value)} className="text-sm h-8" />
          ) : (
            <p className="text-sm text-gray-600">{plan.subtitle}</p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-500 flex items-center gap-1">
          文案要点（可选） <Badge variant="outline" className="text-[10px] h-3.5 px-1 font-normal">英文</Badge>
        </Label>
        <div className="space-y-1.5">
          {sellingPoints.map((sp, i) => (
            <div key={i} className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Input value={sp} onChange={(e) => updateSellingPoint(i, e.target.value)} className="text-sm h-8 flex-1" />
                  {sellingPoints.length > 1 && (
                    <button onClick={() => removeSellingPoint(i)} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  )}
                </>
              ) : (
                <span className="text-sm text-gray-700 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100">{sp}</span>
              )}
            </div>
          ))}
          {isEditing && (
            <Button variant="ghost" size="sm" className="h-7 text-indigo-600 text-xs" onClick={addSellingPoint}>
              + 添加文案要点
            </Button>
          )}
        </div>
      </div>

      {plan.copyNotes && plan.copyNotes.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs font-medium text-gray-400">文案说明</Label>
          {plan.copyNotes.map((note, i) => (
            <p key={i} className="text-[11px] text-gray-400">{note}</p>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <Layout className="w-3 h-3" />版式方向
        </Label>
        {isEditing ? (
          <Textarea value={plan.layoutDirection} onChange={(e) => updateField("layoutDirection", e.target.value)} className="text-sm min-h-[60px] resize-none" />
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed">{plan.layoutDirection}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <Eye className="w-3 h-3" />视觉方向
        </Label>
        {isEditing ? (
          <Textarea value={plan.visualDirection} onChange={(e) => updateField("visualDirection", e.target.value)} className="text-sm min-h-[60px] resize-none" />
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed">{plan.visualDirection}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <Palette className="w-3 h-3" />色彩方向
        </Label>
        {isEditing ? (
          <Textarea value={plan.colorDirection} onChange={(e) => updateField("colorDirection", e.target.value)} className="text-sm min-h-[60px] resize-none" />
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed">{plan.colorDirection}</p>
        )}
      </div>
    </div>
  );
}
