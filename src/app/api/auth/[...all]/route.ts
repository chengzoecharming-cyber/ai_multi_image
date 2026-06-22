import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

function normalizeRequest(request: NextRequest): Request {
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!baseURL || request.url.startsWith(baseURL)) {
    return request;
  }

  const url = new URL(request.url);
  const normalizedUrl = new URL(url.pathname + url.search, baseURL);

  return new Request(normalizedUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    credentials: request.credentials,
  });
}

// Better Auth 处理所有 /api/auth/* 请求（signIn, signUp, signOut, session 等）
export async function GET(request: NextRequest) {
  return auth.handler(normalizeRequest(request));
}

export async function POST(request: NextRequest) {
  return auth.handler(normalizeRequest(request));
}
