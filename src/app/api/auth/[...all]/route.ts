import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

function normalizeRequest(request: NextRequest): NextRequest {
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!baseURL || request.url.startsWith(baseURL)) {
    return request;
  }

  const base = new URL(baseURL);
  request.nextUrl.host = base.host;
  request.nextUrl.protocol = base.protocol;

  return request;
}

// Better Auth 处理所有 /api/auth/* 请求（signIn, signUp, signOut, session 等）
export async function GET(request: NextRequest) {
  return auth.handler(normalizeRequest(request));
}

export async function POST(request: NextRequest) {
  return auth.handler(normalizeRequest(request));
}
