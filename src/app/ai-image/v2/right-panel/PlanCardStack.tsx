"use client";

import { useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CreativePlan, V2GeneratedImage } from "../types";
import { PlanCard } from "./PlanCard";

export interface PlanCardStackProps {
  plans: CreativePlan[];
  activeIndex: number;
  generatedImages: V2GeneratedImage[];
  generatingImagePlanId: string | null;
  onChangeIndex: (index: number) => void;
  onSave: (plan: CreativePlan) => void;
  onGenerateImage: (plan: CreativePlan) => void;
  onViewImage: (plan: CreativePlan) => void;
  onOpenInfo: (plan: CreativePlan) => void;
}

export function PlanCardStack({
  plans,
  activeIndex,
  generatedImages,
  generatingImagePlanId,
  onChangeIndex,
  onSave,
  onGenerateImage,
  onViewImage,
  onOpenInfo,
}: PlanCardStackProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);

  const goPrev = useCallback(() => {
    const next = activeIndex <= 0 ? plans.length - 1 : activeIndex - 1;
    onChangeIndex(next);
  }, [activeIndex, plans.length, onChangeIndex]);

  const goNext = useCallback(() => {
    const next = activeIndex >= plans.length - 1 ? 0 : activeIndex + 1;
    onChangeIndex(next);
  }, [activeIndex, plans.length, onChangeIndex]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX.current;
    setDragOffset(dx);
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset < -80) {
      goNext();
    } else if (dragOffset > 80) {
      goPrev();
    }
    setDragOffset(0);
  }, [isDragging, dragOffset, goNext, goPrev]);

  if (plans.length === 0) return null;

  const hasImageForPlan = (planId: string) =>
    generatedImages.some((g) => g.planId === planId && g.imageUrl);

  return (
    <div
      className="flex-1 flex items-center justify-center bg-gray-100 relative overflow-hidden select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* 左右切换按钮 */}
      {plans.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-6 z-20 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:scale-105 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-6 z-20 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:scale-105 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* 指示器 */}
      {plans.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {plans.map((_, i) => (
            <button
              key={i}
              onClick={() => onChangeIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeIndex ? "w-6 bg-[#0f1419]" : "w-1.5 bg-gray-300 hover:bg-gray-400"
              )}
            />
          ))}
        </div>
      )}

      {/* 卡片堆叠 — 使用 plan.id 作为 key 以实现切换动效 */}
      <div className="relative w-[385px] h-[412px]">
        {plans.map((plan, i) => {
          const offset = i - activeIndex;
          let normalizedOffset = offset;
          if (normalizedOffset < -1) normalizedOffset += plans.length;
          if (normalizedOffset > 1) normalizedOffset -= plans.length;

          const isActive = normalizedOffset === 0;
          const isVisible = Math.abs(normalizedOffset) <= 1;

          const baseTransform = isActive
            ? "translateX(0) scale(1) rotate(0deg)"
            : normalizedOffset === -1
              ? "translateX(-35%) scale(0.85) rotate(-5deg)"
              : "translateX(35%) scale(0.85) rotate(5deg)";

          const dragTransform = isDragging && isActive && plans.length > 1
            ? `translateX(${dragOffset}px)`
            : "";

          return (
            <div
              key={plan.id}
              className="absolute inset-0 transition-all duration-500 ease-out will-change-transform"
              style={{
                transform: `${baseTransform} ${dragTransform}`.trim(),
                zIndex: isActive ? 10 : isVisible ? 5 : 0,
                opacity: isVisible ? (isActive ? 1 : 0.6) : 0,
                pointerEvents: isActive ? "auto" : "none",
              }}
            >
              <PlanCard
                plan={plan}
                index={i}
                isActive={isActive}
                hasGeneratedImage={hasImageForPlan(plan.id)}
                isGenerating={generatingImagePlanId === plan.id}
                onSave={onSave}
                onGenerateImage={onGenerateImage}
                onViewImage={onViewImage}
                onOpenInfo={onOpenInfo}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
