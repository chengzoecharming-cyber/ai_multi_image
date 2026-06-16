import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { V2Session } from "@/app/ai-image/v2/types";
import { getAuthScope, requireActiveAuthorizationCode, scopedTenantUserWhere } from "@/lib/auth-scope";
import {
  deserializeSession,
  toSessionCreateInput,
  toPlanCreateInput,
  toImageCreateInput,
  toDetailStateCreateInput,
} from "@/lib/v2-serialization";

const authorizationCodeInclude = {
  include: {
    user: { select: { name: true, email: true } },
  },
};

function isUniqueConstraintError(error: unknown): error is { code: "P2002" } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function toSessionUpdateData(sessionInput: ReturnType<typeof toSessionCreateInput>) {
  return {
    authorizationCodeId: sessionInput.authorizationCodeId,
    title: sessionInput.title,
    workspaceTab: sessionInput.workspaceTab,
    mode: sessionInput.mode,
    step: sessionInput.step,
    status: sessionInput.status,
    lastError: sessionInput.lastError,
    productImageUrls: sessionInput.productImageUrls,
    activeProductImageIndex: sessionInput.activeProductImageIndex,
    referenceImageUrls: sessionInput.referenceImageUrls,
    goal: sessionInput.goal,
    outputWidth: sessionInput.outputWidth,
    outputHeight: sessionInput.outputHeight,
    provider: sessionInput.provider,
    selectedTemplateId: sessionInput.selectedTemplateId,
    expandedSingleId: sessionInput.expandedSingleId,
    editingSingleId: sessionInput.editingSingleId,
    previewPlanId: sessionInput.previewPlanId,
    copiedId: sessionInput.copiedId,
    generatingImage: sessionInput.generatingImage,
    generatingImagePlanId: sessionInput.generatingImagePlanId,
    updatedAt: new Date(),
  };
}

// GET /api/ai-image/v2/sessions
export async function GET(request: NextRequest) {
  try {
    const scope = await getAuthScope(request);
    if (!scope) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const activeCode = requireActiveAuthorizationCode(scope);
    if (!activeCode.ok) {
      return NextResponse.json({ error: activeCode.error }, { status: activeCode.status });
    }
    const { searchParams } = new URL(request.url);
    const tenantId = "default";
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const rows = await prisma.aiImageV2Session.findMany({
      where: scopedTenantUserWhere(scope, tenantId),
      include: { plans: true, images: true, detail: true, authorizationCode: authorizationCodeInclude },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    });

    const sessions = (rows as any[]).map(deserializeSession);

    return NextResponse.json({ data: sessions });
  } catch (error) {
    console.error("[GET /api/ai-image/v2/sessions] Error:", error);
    return NextResponse.json({ error: "获取会话列表失败" }, { status: 500 });
  }
}

// POST /api/ai-image/v2/sessions
// Upsert: update existing session incrementally, never delete-and-recreate
export async function POST(request: NextRequest) {
  try {
    const scope = await getAuthScope(request);
    if (!scope) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const activeCode = requireActiveAuthorizationCode(scope);
    if (!activeCode.ok) {
      return NextResponse.json({ error: activeCode.error }, { status: activeCode.status });
    }
    const tenantId = "default";

    const body = (await request.json()) as { session: V2Session };
    const session = body.session;
    if (!session?.id) {
      return NextResponse.json({ error: "Missing session.id" }, { status: 400 });
    }

    const existingById = await prisma.aiImageV2Session.findUnique({
      where: { id: session.id },
      select: { userId: true, tenantId: true },
    });

    if (
      existingById &&
      !scope.isAdmin &&
      (existingById.userId !== scope.userId || existingById.tenantId !== tenantId)
    ) {
      return NextResponse.json(
        { error: "Session id conflict", code: "SESSION_ID_CONFLICT" },
        { status: 409 }
      );
    }

    if (existingById && existingById.tenantId !== tenantId) {
      return NextResponse.json(
        { error: "Session id conflict", code: "SESSION_ID_CONFLICT" },
        { status: 409 }
      );
    }

    const existing = existingById
      ? await prisma.aiImageV2Session.findFirst({
          where: { id: session.id, ...scopedTenantUserWhere(scope, tenantId) },
          include: { plans: true, images: true, detail: true, authorizationCode: authorizationCodeInclude },
        }) as any
      : null;

    if (existingById && !existing) {
      return NextResponse.json(
        { error: "Session id conflict", code: "SESSION_ID_CONFLICT" },
        { status: 409 }
      );
    }

    const ownerUserId = existingById?.userId ?? scope.userId;
    const ownerAuthorizationCodeId = existing?.authorizationCodeId ?? scope.authorizationCodeId ?? null;
    const sessionInput = toSessionCreateInput(
      { ...session, authorizationCodeId: ownerAuthorizationCodeId },
      tenantId,
      ownerUserId
    );

    await prisma.$transaction(async (tx) => {
      if (existing) {
        // ── Update session core fields ──
        await tx.aiImageV2Session.update({
          where: { id: session.id },
          data: toSessionUpdateData(sessionInput),
        });

        // ── Replace plans (source of truth from frontend) ──
        await tx.aiImageV2Plan.deleteMany({ where: { sessionId: session.id, tenantId, userId: ownerUserId } });
        if (session.singlePlans?.length) {
          const uniquePlans = Array.from(
            new Map(session.singlePlans.map((plan) => [plan.id, plan])).values()
          );
          try {
            await tx.aiImageV2Plan.createMany({
              data: uniquePlans.map((plan, i) => toPlanCreateInput(plan, session.id, tenantId, ownerUserId, i)),
            });
          } catch (e) {
            if (!isUniqueConstraintError(e)) throw e;
            // concurrent save raced; silently ignore duplicate plans
          }
        }

        // ── Merge images: keep server images + append new ones from client ──
        const existingImageIds = new Set(existing.images.map((img: any) => img.id));
        const existingTaskIds = new Set(existing.images.map((img: any) => img.taskId).filter(Boolean));
        const newImages = (session.generatedImages || []).filter(
          (img) => !existingImageIds.has(img.id) && !(img.taskId && existingTaskIds.has(img.taskId))
        );
        if (newImages.length > 0) {
          const uniqueNewImages = Array.from(
            new Map(newImages.map((img) => [img.id, img])).values()
          );
          try {
            await tx.aiImageV2GeneratedImage.createMany({
              data: uniqueNewImages.map((img) => toImageCreateInput(img, session.id, tenantId, ownerUserId)),
            });
          } catch (e) {
            if (!isUniqueConstraintError(e)) throw e;
            // concurrent save raced; silently ignore duplicate images
          }
        }

        // ── Replace detail state (source of truth from frontend) ──
        if (existing.detail) {
          await tx.aiImageV2DetailState.deleteMany({ where: { sessionId: session.id, tenantId, userId: ownerUserId } });
        }
        if (session.detail) {
          await tx.aiImageV2DetailState.create({
            data: toDetailStateCreateInput(session.detail, session.id, tenantId, ownerUserId),
          });
        }
      } else {
        // ── Create new session with all children ──
        let createCollidedWithSameUser = false;
        try {
          await tx.aiImageV2Session.create({ data: sessionInput });
        } catch (error) {
          if (!isUniqueConstraintError(error)) {
            throw error;
          }

          const conflict = await tx.aiImageV2Session.findUnique({
            where: { id: session.id },
            select: { userId: true, tenantId: true },
          });

          if (!conflict || conflict.userId !== ownerUserId || conflict.tenantId !== tenantId) {
            throw error;
          }

          await tx.aiImageV2Session.update({
            where: { id: session.id },
            data: toSessionUpdateData(sessionInput),
          });
          createCollidedWithSameUser = true;
        }

        if (createCollidedWithSameUser) {
          await tx.aiImageV2Plan.deleteMany({ where: { sessionId: session.id, tenantId, userId: ownerUserId } });
          await tx.aiImageV2GeneratedImage.deleteMany({ where: { sessionId: session.id, tenantId, userId: ownerUserId } });
          await tx.aiImageV2DetailState.deleteMany({ where: { sessionId: session.id, tenantId, userId: ownerUserId } });
        }

        if (session.singlePlans?.length) {
          const uniquePlans = Array.from(
            new Map(session.singlePlans.map((plan) => [plan.id, plan])).values()
          );
          try {
            await tx.aiImageV2Plan.createMany({
              data: uniquePlans.map((plan, i) => toPlanCreateInput(plan, session.id, tenantId, ownerUserId, i)),
            });
          } catch (e) {
            if (!isUniqueConstraintError(e)) throw e;
            // concurrent save raced; silently ignore duplicate plans
          }
        }

        if (session.generatedImages?.length) {
          const uniqueImages = Array.from(
            new Map(session.generatedImages.map((img) => [img.id, img])).values()
          );
          try {
            await tx.aiImageV2GeneratedImage.createMany({
              data: uniqueImages.map((img) => toImageCreateInput(img, session.id, tenantId, ownerUserId)),
            });
          } catch (e) {
            if (!isUniqueConstraintError(e)) throw e;
            // concurrent save raced; silently ignore duplicate images
          }
        }

        if (session.detail) {
          await tx.aiImageV2DetailState.create({
            data: toDetailStateCreateInput(session.detail, session.id, tenantId, ownerUserId),
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/ai-image/v2/sessions] Error:", error);
    return NextResponse.json({ error: "保存会话失败" }, { status: 500 });
  }
}
