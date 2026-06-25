"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { signIn, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { P0 } from "@/app/ai-image/v2/design-tokens";

type Mode = "signin" | "signup";

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callbackUrl?: string;
}

export function SignInDialog({
  open,
  onOpenChange,
  callbackUrl = "/ai-image/v2",
}: SignInDialogProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");

  // Shared fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authorizationCode, setAuthorizationCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Sign-up only fields
  const [confirmPassword, setConfirmPassword] = useState("");

  const canSubmitSignIn =
    email.trim().length > 0 && password.trim().length > 0 && !loading;

  const canSubmitSignUp =
    email.trim().length > 0 &&
    password.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    authorizationCode.trim().length > 0 &&
    !loading;

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

  const resetFields = () => {
    setEmail("");
    setPassword("");
    setAuthorizationCode("");
    setConfirmPassword("");
    setLoading(false);
  };

  const handleSwitchMode = (next: Mode) => {
    setMode(next);
    resetFields();
  };

  const handleSignIn = async (e: React.FormEvent) => {
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
        router.replace(callbackUrl);
        router.refresh();
        window.setTimeout(() => {
          window.location.replace(callbackUrl);
        }, 300);
      }
    } catch (err) {
      toast.error("登录失败，请检查邮箱和密码");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorizationCode.trim()) {
      toast.error("请输入授权码");
      return;
    }
    if (!email.trim() || !password.trim()) {
      toast.error("请填写邮箱和密码");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("两次输入的密码不一致");
      return;
    }
    if (password.length < 6) {
      toast.error("密码长度至少 6 位");
      return;
    }
    setLoading(true);
    try {
      const signupRes = await fetch("/api/auth-code/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorizationCode: authorizationCode.trim(),
          email: email.trim(),
          password,
        }),
      });
      if (!signupRes.ok) {
        const data = (await signupRes
          .json()
          .catch(() => ({}))) as { error?: string };
        toast.error(data.error || "注册失败");
        return;
      }

      const result = await signIn.email({
        email: email.trim(),
        password,
        callbackURL: callbackUrl,
      });
      if (result.error) {
        toast.error(result.error.message || "注册成功，请登录");
        handleSwitchMode("signin");
        return;
      }

      // Activate auth code after successful sign-in
      await activateCode(authorizationCode.trim());
      toast.success("注册成功，已自动登录");
      handleClose();
      router.replace(callbackUrl);
      router.refresh();
      window.setTimeout(() => {
        window.location.replace(callbackUrl);
      }, 300);
    } catch (err) {
      toast.error("注册失败");
    } finally {
      setLoading(false);
    }
  };

  async function activateCode(code: string): Promise<void> {
    const res = await fetch("/api/auth-code/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorizationCode: code }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error || "授权码激活失败");
    }
  }

  if (!open) return null;

  const isSignIn = mode === "signin";

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
            {isSignIn ? "请登录" : "注册账号"}
          </h2>

          {/* Tabs */}
          <div className="mt-6 flex border-b border-[#EBECED]">
            <button
              type="button"
              onClick={() => handleSwitchMode("signin")}
              className={cn(
                "relative px-1 pb-2 text-[14px] font-medium transition-colors",
                isSignIn ? "text-black" : "text-[#72808a] hover:text-black"
              )}
            >
              登录
              {isSignIn && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-black" />
              )}
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("signup")}
              className={cn(
                "relative ml-6 px-1 pb-2 text-[14px] font-medium transition-colors",
                !isSignIn ? "text-black" : "text-[#72808a] hover:text-black"
              )}
            >
              注册
              {!isSignIn && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-black" />
              )}
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={isSignIn ? handleSignIn : handleSignUp}
            className="mt-6 flex flex-col"
          >
            {/* Authorization Code Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="auth-code"
                className="text-[14px] font-medium leading-5"
                style={{ color: P0 }}
              >
                授权码
                {!isSignIn && (
                  <span className="ml-1 text-red-500">*</span>
                )}
              </label>
              <input
                id="auth-code"
                type="text"
                placeholder={isSignIn ? "普通用户必填，管理员可留空" : "6位授权码"}
                value={authorizationCode}
                onChange={(e) =>
                  setAuthorizationCode(e.target.value.toUpperCase().slice(0, 6))
                }
                required={!isSignIn}
                className="h-10 w-full rounded-[10px] border-0 px-3 text-[14px] font-medium outline-none ring-0 transition-colors placeholder:font-normal placeholder:text-[#72808a]"
                style={{ backgroundColor: "rgb(248, 249, 250)", color: P0 }}
              />
            </div>

            {/* Email Field */}
            <div className="mt-4 flex flex-col gap-1.5">
              <label
                htmlFor="auth-email"
                className="text-[14px] font-medium leading-5"
                style={{ color: P0 }}
              >
                邮箱
              </label>
              <input
                id="auth-email"
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
                htmlFor="auth-password"
                className="text-[14px] font-medium leading-5"
                style={{ color: P0 }}
              >
                密码
              </label>
              <input
                id="auth-password"
                type="password"
                placeholder={isSignIn ? "输入密码" : "至少 6 位"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 w-full rounded-[10px] border-0 px-3 text-[14px] font-medium outline-none ring-0 transition-colors placeholder:font-normal placeholder:text-[#72808a]"
                style={{ backgroundColor: "rgb(248, 249, 250)", color: P0 }}
              />
            </div>

            {/* Confirm Password (signup only) */}
            {!isSignIn && (
              <div className="mt-4 flex flex-col gap-1.5">
                <label
                  htmlFor="auth-confirm-password"
                  className="text-[14px] font-medium leading-5"
                  style={{ color: P0 }}
                >
                  确认密码
                </label>
                <input
                  id="auth-confirm-password"
                  type="password"
                  placeholder="再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-10 w-full rounded-[10px] border-0 px-3 text-[14px] font-medium outline-none ring-0 transition-colors placeholder:font-normal placeholder:text-[#72808a]"
                  style={{ backgroundColor: "rgb(248, 249, 250)", color: P0 }}
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSignIn ? !canSubmitSignIn : !canSubmitSignUp}
              className={cn(
                "mt-6 flex h-10 w-full items-center justify-center rounded-[10px] text-[14px] font-medium text-white transition-colors",
                (isSignIn ? canSubmitSignIn : canSubmitSignUp)
                  ? "bg-black"
                  : "bg-[#EBECED]"
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSignIn ? (
                "登录"
              ) : (
                "注册"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
