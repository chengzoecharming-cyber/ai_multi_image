"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/ai-image/v2");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#F6F8FC]">
      <div className="text-sm text-gray-500">正在跳转...</div>
    </div>
  );
}
