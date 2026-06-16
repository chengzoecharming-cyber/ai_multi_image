"use client";

import { useSession } from "@/lib/auth-client";
import type { V2Session } from "../types";

import { BBG, P1, P2 } from "../design-tokens";

export function AuthCodeAuditCard({
  authorizationCode,
}: {
  authorizationCode: V2Session["authorizationCode"];
}) {
  const { data: session } = useSession();
  const currentUser = session?.user as { role?: string } | undefined;
  const isAdmin = currentUser?.role === "admin";

  if (!isAdmin || !authorizationCode?.code) return null;

  return (
    <div
      className="flex items-center justify-between rounded-lg px-3 py-2"
      style={{ backgroundColor: BBG }}
    >
      <span
        className="text-[12px] font-medium"
        style={{ color: P1 }}
      >
        {authorizationCode.code}
      </span>
      <span
        className="text-[12px] font-medium truncate max-w-[140px]"
        style={{ color: P2 }}
      >
        {authorizationCode.note || "无备注"}
      </span>
    </div>
  );
}
