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

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
        toast.success("登录成功");
        router.push("/ai-image/v2");
        router.refresh();
      }
    } catch (err) {
      toast.error("登录失败，请检查邮箱和密码");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8FC]">
      <div className="w-full max-w-sm p-8 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">AI 制图工作台</h1>
          <p className="text-sm text-gray-500">登录以继续使用</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              placeholder="输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "登录"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          还没有账号？{" "}
          <Link href="/sign-up" className="text-indigo-600 hover:underline">
            立即注册
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
