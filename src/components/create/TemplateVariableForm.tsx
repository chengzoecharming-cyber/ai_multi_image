"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  PromptTemplate,
  TemplateVariable,
  getDefaultVariableValues,
} from "@/lib/prompt/templates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TemplateVariableFormProps {
  template: PromptTemplate;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export default function TemplateVariableForm({
  template,
  values,
  onChange,
}: TemplateVariableFormProps) {
  // Initialize default values when template changes
  useEffect(() => {
    const defaults = getDefaultVariableValues(template);
    const merged: Record<string, string> = {};
    for (const v of template.variables) {
      merged[v.key] = values[v.key] ?? defaults[v.key] ?? "";
    }
    onChange(merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id]);

  const handleChange = (key: string, value: string) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="space-y-4">
      {template.variables.map((variable) => (
        <FormField
          key={variable.key}
          variable={variable}
          value={values[variable.key] || ""}
          onChange={(val) => handleChange(variable.key, val)}
        />
      ))}
    </div>
  );
}

function FormField({
  variable,
  value,
  onChange,
}: {
  variable: TemplateVariable;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-medium text-gray-700">
        {variable.label}
        {variable.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {variable.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={variable.placeholder || ""}
          className={cn(
            "w-full min-h-[80px] px-3 py-2.5 text-[13px] bg-[#F5F6F8] border border-gray-200 rounded-xl resize-none outline-none placeholder:text-gray-400",
            "focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 transition-colors"
          )}
        />
      ) : variable.type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full px-3 py-2.5 text-[13px] bg-[#F5F6F8] border border-gray-200 rounded-xl outline-none",
            "focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 transition-colors"
          )}
        >
          {variable.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={variable.placeholder || ""}
          className={cn(
            "text-[13px] bg-[#F5F6F8] border-gray-200 rounded-xl",
            "focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
          )}
        />
      )}
    </div>
  );
}
