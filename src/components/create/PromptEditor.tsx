"use client";

import { Textarea } from "@/components/ui/textarea";

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function PromptEditor({
  value,
  onChange,
  disabled,
}: PromptEditorProps) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="自由输入背景描述，或从模板库中选择"
      disabled={disabled}
      className="min-h-[110px] text-[12px] bg-[#F5F6F8] border-0 rounded-xl resize-none placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
    />
  );
}
