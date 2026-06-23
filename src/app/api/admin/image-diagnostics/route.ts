import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

function safeJson(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}

// GET /api/admin/image-diagnostics
// Admin-only, read-only diagnostics derived from existing task snapshots.
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parsePositiveInt(searchParams.get("limit"), 50, 200);
  const status = searchParams.get("status");
  const provider = searchParams.get("provider");
  const sessionId = searchParams.get("sessionId");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (provider && provider !== "all") where.provider = provider;

  const tasks = await prisma.aiImageTask.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      provider: true,
      status: true,
      errorMessage: true,
      resultImageUrl: true,
      thumbImageUrl: true,
      userPrompt: true,
      promptSnapshot: true,
      configSnapshot: true,
      referenceImagesSnapshot: true,
      createdAt: true,
      updatedAt: true,
      authorizationCode: {
        select: {
          code: true,
          note: true,
          user: { select: { email: true, name: true } },
        },
      },
    },
  });

  const diagnostics = tasks
    .map((task) => {
      const config = safeJson(task.configSnapshot);
      const refs = safeJson(task.referenceImagesSnapshot);
      const productImageUrls = asStringArray(refs.productImageUrls);
      const styleReferenceUrls = asStringArray(refs.styleReferenceUrls);
      const availableReferenceUrls = asStringArray(refs.availableReferenceUrls);
      const resultUrls = (() => {
        if (!task.resultImageUrl) return [];
        try {
          const parsed = JSON.parse(task.resultImageUrl);
          if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string");
          if (typeof parsed === "string") return [parsed];
        } catch {
          return [task.resultImageUrl];
        }
        return [];
      })();

      return {
        id: task.id,
        provider: task.provider || "unknown",
        status: task.status,
        errorMessage: task.errorMessage,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        sessionId: asString(config.sessionId),
        planId: asString(config.planId),
        source: asString(config.source),
        detailType: asString(config.detailType),
        model: asString(config.model),
        size: `${config.width || "?"}x${config.height || "?"}`,
        productImageCount: productImageUrls.length,
        styleReferenceCount: styleReferenceUrls.length,
        availableReferenceCount: availableReferenceUrls.length,
        productImageUrls,
        styleReferenceUrls,
        availableReferenceUrls,
        resultUrls,
        promptPreview: (task.userPrompt || task.promptSnapshot || "").slice(0, 240),
        authorizationCode: task.authorizationCode
          ? {
              code: task.authorizationCode.code,
              note: task.authorizationCode.note,
              userEmail: task.authorizationCode.user?.email || null,
              userName: task.authorizationCode.user?.name || null,
            }
          : null,
      };
    })
    .filter((task) => !sessionId || task.sessionId === sessionId);

  const summary = diagnostics.reduce(
    (acc, task) => {
      acc.total += 1;
      acc.byStatus[task.status] = (acc.byStatus[task.status] || 0) + 1;
      acc.byProvider[task.provider] = (acc.byProvider[task.provider] || 0) + 1;
      return acc;
    },
    { total: 0, byStatus: {} as Record<string, number>, byProvider: {} as Record<string, number> }
  );

  return NextResponse.json({ data: diagnostics, summary });
}
