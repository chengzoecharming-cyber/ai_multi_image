"use client";

import * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";

/* ── V2DropdownMenu ─────────────────────────────────── */

function V2DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="v2-dropdown-menu" {...props} />;
}

function V2DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="v2-dropdown-menu-trigger" {...props} />;
}

function V2DropdownMenuContent({
  align = "end",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="v2-dropdown-menu-content"
          className={cn(
            "z-50 flex flex-col gap-1 rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/5 outline-none",
            "data-[side=bottom]:slide-in-from-top-2",
            "data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2",
            "data-[side=top]:slide-in-from-bottom-2",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

/* ── V2DropdownMenuItem ─────────────────────────────── */

interface V2DropdownMenuItemProps extends React.ComponentProps<typeof MenuPrimitive.Item> {
  icon?: React.ReactNode;
}

function V2DropdownMenuItem({
  icon,
  children,
  className,
  ...props
}: V2DropdownMenuItemProps) {
  return (
    <MenuPrimitive.Item
      data-slot="v2-dropdown-menu-item"
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-lg px-2 py-[6px] outline-none select-none",
        "text-[13px] font-normal text-[#0f1419]",
        "hover:bg-[rgb(248,249,250)] focus:bg-[rgb(248,249,250)] data-highlighted:bg-[rgb(248,249,250)]",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {icon && (
        <span className="!flex h-4 w-4 shrink-0 items-center justify-center text-[#506672]">
          {icon}
        </span>
      )}
      {children}
    </MenuPrimitive.Item>
  );
}

/* ── Exports ────────────────────────────────────────── */

export {
  V2DropdownMenu,
  V2DropdownMenuTrigger,
  V2DropdownMenuContent,
  V2DropdownMenuItem,
};
