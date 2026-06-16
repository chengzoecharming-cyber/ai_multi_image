import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Zap,
  Info,
  Search,
  Scale,
  TreePine,
  Mountain,
  Package,
  FileText,
  Crown,
  Ruler,
  Grid3x3,
  Paintbrush,
} from "lucide-react";

export interface TemplateThumbnail {
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
}

export const TEMPLATE_THUMBNAILS: Record<string, TemplateThumbnail> = {
  "tpl-white-bg-hero": {
    icon: Sparkles,
    gradient: "from-gray-50 to-gray-100",
    iconColor: "text-gray-400",
  },
  "tpl-temu-promo": {
    icon: Zap,
    gradient: "from-orange-50 to-red-50",
    iconColor: "text-orange-400",
  },
  "tpl-feature-explanation": {
    icon: Info,
    gradient: "from-blue-50 to-indigo-50",
    iconColor: "text-blue-400",
  },
  "tpl-macro-detail": {
    icon: Search,
    gradient: "from-stone-100 to-stone-200",
    iconColor: "text-stone-500",
  },
  "tpl-advantage-comparison": {
    icon: Scale,
    gradient: "from-purple-50 to-violet-50",
    iconColor: "text-purple-400",
  },
  "tpl-lifestyle-scene": {
    icon: TreePine,
    gradient: "from-emerald-50 to-green-50",
    iconColor: "text-emerald-400",
  },
  "tpl-environment-scene": {
    icon: Mountain,
    gradient: "from-cyan-50 to-sky-50",
    iconColor: "text-cyan-400",
  },
  "tpl-bundle-showcase": {
    icon: Package,
    gradient: "from-pink-50 to-rose-50",
    iconColor: "text-pink-400",
  },
  "tpl-spec-technical": {
    icon: FileText,
    gradient: "from-slate-100 to-slate-200",
    iconColor: "text-slate-500",
  },
  "tpl-premium-luxury": {
    icon: Crown,
    gradient: "from-zinc-800 to-zinc-900",
    iconColor: "text-amber-400",
  },
  "tpl-dimension-annotation": {
    icon: Ruler,
    gradient: "from-yellow-50 to-amber-50",
    iconColor: "text-yellow-500",
  },
  "tpl-image-set-5": {
    icon: Grid3x3,
    gradient: "from-violet-50 to-purple-50",
    iconColor: "text-violet-400",
  },
  "tpl-blank-free": {
    icon: Paintbrush,
    gradient: "from-white to-gray-50",
    iconColor: "text-gray-300",
  },
};

export function getTemplateThumbnail(id: string): TemplateThumbnail {
  return TEMPLATE_THUMBNAILS[id] || {
    icon: Sparkles,
    gradient: "from-gray-50 to-gray-100",
    iconColor: "text-gray-400",
  };
}
