import { Wand2, LayoutTemplate, Images } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface V2NavItem {
  slug: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

export const V2_NAV_ITEMS: V2NavItem[] = [
  {
    slug: "workbench",
    label: "生图工作台",
    icon: Wand2,
    href: "/ai-image/v2",
  },
  {
    slug: "templates",
    label: "模版库",
    icon: LayoutTemplate,
    href: "/ai-image/v2/templates",
  },
  {
    slug: "assets",
    label: "我的素材",
    icon: Images,
    href: "/ai-image/v2/assets",
  },
];

export type V2NavSlug = (typeof V2_NAV_ITEMS)[number]["slug"];
