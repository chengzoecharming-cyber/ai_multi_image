"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [authorizationCode, setAuthorizationCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
          name: name.trim(),
        }),
      });
      if (!signupRes.ok) {
        const data = (await signupRes.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error || "注册失败");
        return;
      }

      const result = await signIn.email({
        email: email.trim(),
        password,
        callbackURL: "/ai-image/v2",
      });
      if (result.error) {
        toast.error(result.error.message || "注册成功，请返回登录页登录");
        router.push("/sign-in");
        return;
      } else {
        await activateCode(authorizationCode.trim());
      }
      toast.success("注册成功，已自动登录");
      router.push("/ai-image/v2");
      router.refresh();
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8FC]">
      <div className="w-full max-w-sm p-8 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">注册账号</h1>
          <p className="text-sm text-gray-500">创建新账号以使用全部功能</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="authorizationCode">授权码</Label>
            <Input
              id="authorizationCode"
              type="text"
              placeholder="6位授权码"
              value={authorizationCode}
              onChange={(e) => setAuthorizationCode(e.target.value.toUpperCase().slice(0, 6))}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">昵称（可选）</Label>
            <Input
              id="name"
              type="text"
              placeholder="你的昵称"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="至少 6 位"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">确认密码</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "注册"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          已有账号？{" "}
          <Link href="/sign-in" className="text-indigo-600 hover:underline">
            立即登录
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
