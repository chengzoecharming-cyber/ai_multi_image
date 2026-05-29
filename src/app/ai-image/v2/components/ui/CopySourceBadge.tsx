"use client";

export function CopySourceBadge({ source }: { source?: string }) {
  if (!source) return null;
  const styles: Record<string, string> = {
    user_exact: "bg-green-50 text-green-700 border-green-200",
    ai_rewritten: "bg-blue-50 text-blue-700 border-blue-200",
    ai_suggested: "bg-amber-50 text-amber-700 border-amber-200",
  };
  const labels: Record<string, string> = {
    user_exact: "用户原文",
    ai_rewritten: "AI 改写",
    ai_suggested: "AI 建议",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${styles[source] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {labels[source] || source}
    </span>
  );
}
