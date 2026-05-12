"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductItem {
  name: string;
  icon: string;
}

interface ProductCategory {
  key: string;
  label: string;
  items: ProductItem[];
}

const CATEGORIES: ProductCategory[] = [
  {
    key: "platform",
    label: "电商平台",
    items: [
      { name: "Temu", icon: "🛒" },
      { name: "Cozen", icon: "🏪" },
      { name: "Amazon", icon: "📦" },
      { name: "eBay", icon: "🏷️" },
      { name: "Shopee", icon: "🛍️" },
      { name: "Lazada", icon: "📮" },
      { name: "AliExpress", icon: "✈️" },
      { name: "Wish", icon: "⭐" },
      { name: "Target", icon: "🎯" },
    ],
  },
  {
    key: "hardware",
    label: "五金件",
    items: [
      { name: "螺丝", icon: "🔩" },
      { name: "螺母", icon: "🔧" },
      { name: "垫片", icon: "⚙️" },
      { name: "铆钉", icon: "📌" },
      { name: "销钉", icon: "📍" },
      { name: "卡簧", icon: "⭕" },
      { name: "螺栓", icon: "🔩" },
      { name: "膨胀管", icon: "📦" },
      { name: "角码", icon: "📐" },
    ],
  },
  {
    key: "standard",
    label: "标准件",
    items: [
      { name: "轴承", icon: "⚙️" },
      { name: "密封圈", icon: "⭕" },
      { name: "弹簧", icon: "🌀" },
      { name: "齿轮", icon: "⚙️" },
      { name: "链条", icon: "⛓️" },
      { name: "皮带轮", icon: "🔘" },
      { name: "联轴器", icon: "🔗" },
      { name: "法兰", icon: "🔘" },
      { name: "轴套", icon: "🔧" },
    ],
  },
  {
    key: "seal",
    label: "密封件",
    items: [
      { name: "O型圈", icon: "⭕" },
      { name: "油封", icon: "🛡️" },
      { name: "垫片", icon: "📄" },
      { name: "密封条", icon: "📏" },
      { name: "机械密封", icon: "⚙️" },
      { name: "液压密封", icon: "💧" },
      { name: "气动密封", icon: "💨" },
      { name: "活塞环", icon: "⭕" },
      { name: "防尘圈", icon: "🛡️" },
    ],
  },
];

interface ProductTagSelectorProps {
  selected: string[];
  onToggle: (name: string) => void;
}

export default function ProductTagSelector({
  selected,
  onToggle,
}: ProductTagSelectorProps) {
  const [activeTab, setActiveTab] = useState("platform");
  const activeCategory = CATEGORIES.find((c) => c.key === activeTab);

  return (
    <div className="bg-white rounded-xl flex overflow-hidden h-[320px] gap-3">
      {/* Left tabs */}
      <div className="w-[90px] shrink-0 py-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveTab(cat.key)}
            className={cn(
              "w-full text-left px-3 py-2 text-[12px] transition-colors rounded-lg mx-2",
              activeTab === cat.key
                ? "text-indigo-600 bg-indigo-50 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>
      {/* Right grid — scrollable */}
      <div className="flex-1 p-0 overflow-y-auto">
        <div className="grid grid-cols-3 gap-x-2 gap-y-3">
          {activeCategory?.items.map((item) => {
            const isSelected = selected.includes(item.name);
            return (
              <button
                key={item.name}
                onClick={() => onToggle(item.name)}
                className="flex flex-col items-center justify-center text-[12px] transition-colors text-gray-600"
              >
                <div
                  className={cn(
                    "w-[76px] h-[76px] rounded-lg flex items-center justify-center bg-gray-50",
                    isSelected && "border-2 border-indigo-500"
                  )}
                >
                  <span className="text-2xl leading-none">{item.icon}</span>
                </div>
                <span className="mt-1 leading-none">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
