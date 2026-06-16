"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { signIn, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { P0 } from "@/app/ai-image/v2/design-tokens";

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignInDialog({ open, onOpenChange }: SignInDialogProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authorizationCode, setAuthorizationCode] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit =
    email.trim().length > 0 && password.trim().length > 0 && !loading;

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("请填写邮箱和密码");
      return;
    }
    setLoading(true);
    try {
      const result = await signIn.email({
        email: email.trim(),
        password,
        callbackURL: "/ai-image/v2",
      });
      if (result.error) {
        toast.error(result.error.message || "登录失败");
      } else {
        const activateRes = await fetch("/api/auth-code/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authorizationCode: authorizationCode.trim(),
          }),
        });
        if (!activateRes.ok) {
          const data = (await activateRes
            .json()
            .catch(() => ({}))) as { error?: string };
          await signOut();
          toast.error(data.error || "授权码校验失败");
          setLoading(false);
          return;
        }
        toast.success("登录成功");
        handleClose();
        router.push("/ai-image/v2");
        router.refresh();
      }
    } catch (err) {
      toast.error("登录失败，请检查邮箱和密码");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="relative w-[440px] max-w-[calc(100%-2rem)] rounded-[16px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] outline-none">
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-[12px] top-[12px] flex h-9 w-9 items-center justify-center rounded-[8px] transition-colors hover:bg-[#EBECED]"
          aria-label="关闭"
          title="关闭"
        >
          <X className="h-5 w-5 text-[#72808a]" strokeWidth={1.5} />
        </button>

        {/* Content */}
        <div className="px-8 pb-8 pt-8">
          {/* Title */}
          <h2
            className="text-[24px] font-medium leading-tight"
            style={{ color: P0 }}
          >
            请登录
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col">
            {/* Authorization Code Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="signin-auth-code"
                className="text-[14px] font-medium leading-5"
                style={{ color: P0 }}
              >
                授权码
              </label>
              <input
                id="signin-auth-code"
                type="text"
                placeholder="普通用户必填，管理员可留空"
                value={authorizationCode}
                onChange={(e) =>
                  setAuthorizationCode(e.target.value.toUpperCase().slice(0, 6))
                }
                className="h-10 w-full rounded-[10px] border-0 px-3 text-[14px] font-medium outline-none ring-0 transition-colors placeholder:font-normal placeholder:text-[#72808a]"
                style={{ backgroundColor: "rgb(248, 249, 250)", color: P0 }}
              />
            </div>

            {/* Email Field */}
            <div className="mt-4 flex flex-col gap-1.5">
              <label
                htmlFor="signin-email"
                className="text-[14px] font-medium leading-5"
                style={{ color: P0 }}
              >
                邮箱
              </label>
              <input
                id="signin-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 w-full rounded-[10px] border-0 px-3 text-[14px] font-medium outline-none ring-0 transition-colors placeholder:font-normal placeholder:text-[#72808a]"
                style={{ backgroundColor: "rgb(248, 249, 250)", color: P0 }}
              />
            </div>

            {/* Password Field */}
            <div className="mt-4 flex flex-col gap-1.5">
              <label
                htmlFor="signin-password"
                className="text-[14px] font-medium leading-5"
                style={{ color: P0 }}
              >
                密码
              </label>
              <input
                id="signin-password"
                type="password"
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 w-full rounded-[10px] border-0 px-3 text-[14px] font-medium outline-none ring-0 transition-colors placeholder:font-normal placeholder:text-[#72808a]"
                style={{ backgroundColor: "rgb(248, 249, 250)", color: P0 }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "mt-6 flex h-10 w-full items-center justify-center rounded-[10px] text-[14px] font-medium text-white transition-colors",
                canSubmit ? "bg-black" : "bg-[#EBECED]"
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "登录"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
