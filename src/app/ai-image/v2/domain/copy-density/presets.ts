import type { CopyDensityId, CopyDensityProfile } from "./types";

export const COPY_DENSITY_PROFILES: Record<CopyDensityId, CopyDensityProfile> = {
  headline_only: {
    id: "headline_only",
    label: "仅主标题",
    description: "画面只有 1 个主标题（2–5 个词），无副标题、无卖点列表、无文案块。适用于极简主图或微距特写。",
  },
  minimal: {
    id: "minimal",
    label: "轻量文案",
    description: "主标题 + 2–3 个极短标签或卖点词。适用于白底主图、高端质感图。",
  },
  medium: {
    id: "medium",
    label: "中等文案",
    description: "主标题 + 副标题 + 3–4 个结构化卖点（每点带标题和 1 行说明）+ 底部信息栏。适用于功能卖点图、规格图。",
  },
  rich: {
    id: "rich",
    label: "丰富文案",
    description: "大标题 + 副标题 + 核心主张 + 4+ 个 feature panels + 对比标签 + 底部 info bar。适用于促销图、对比图、套装图。",
  },
};
