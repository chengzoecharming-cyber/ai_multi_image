"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { SignInDialog } from "@/components/auth/SignInDialog";

function getSafeCallbackUrl(): string {
  if (typeof window === "undefined") return "/ai-image/v2";

  const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl");
  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return "/ai-image/v2";
  }

  return callbackUrl;
}

export default function SignInPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [dialogOpen, setDialogOpen] = useState(true);
  const callbackUrl = useMemo(() => getSafeCallbackUrl(), []);

  useEffect(() => {
    if (!session) return;

    router.replace(callbackUrl);

    const fallbackTimer = window.setTimeout(() => {
      window.location.replace(callbackUrl);
    }, 800);

    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, [callbackUrl, session, router]);

  if (isPending || session) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F6F8FC]">
        <div className="text-sm text-gray-500">
          {session ? "正在跳转..." : "正在检查登录状态..."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#F6F8FC]">
      <SignInDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        callbackUrl={callbackUrl}
      />
    </div>
  );
}
