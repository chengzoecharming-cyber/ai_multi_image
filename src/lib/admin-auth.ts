import { auth } from "./auth";
import { NextRequest } from "next/server";

export async function requireAdmin(request: NextRequest): Promise<{ userId: string } | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user;
  if (!user) return null;
  if ((user as { role?: string }).role !== "admin") return null;
  return { userId: user.id };
}
