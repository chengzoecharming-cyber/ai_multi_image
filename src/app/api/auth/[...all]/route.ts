import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

// Better Auth 处理所有 /api/auth/* 请求（signIn, signUp, signOut, session 等）
export async function GET(request: NextRequest) {
  return auth.handler(request);
}

export async function POST(request: NextRequest) {
  return auth.handler(request);
}
