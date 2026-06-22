import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

function normalizeRequest(request: Request): Request {
  const baseURL = process.env.BETTER_AUTH_URL;
  const url = new URL(request.url);

  if (url.pathname === "/api/auth/session") {
    url.pathname = "/api/auth/get-session";
  }

  if (baseURL) {
    const base = new URL(baseURL);
    url.protocol = base.protocol;
    url.host = base.host;
  }

  if (url.toString() === request.url) {
    return request;
  }

  return new Request(url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    credentials: request.credentials,
    // Required by the Fetch spec when forwarding a streamed body.
    duplex: "half",
  } as RequestInit);
}

// Better Auth 处理所有 /api/auth/* 请求（signIn, signUp, signOut, get-session 等）
const handler = toNextJsHandler({
  ...auth,
  handler: (request: Request) => auth.handler(normalizeRequest(request)),
});

export const { GET, POST } = handler;
