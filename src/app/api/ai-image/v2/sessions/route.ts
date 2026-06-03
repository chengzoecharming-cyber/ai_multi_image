import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { V2Session } from "@/app/ai-image/v2/types";
import {
  deserializeSession,
  toSessionCreateInput,
  toPlanCreateInput,
  toImageCreateInput,
  toDetailStateCreateInput,
} from "@/lib/v2-serialization";

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id ?? null;
}

// GET /api/ai-image/v2/sessions
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const tenantId = "default";
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const rows = await prisma.aiImageV2Session.findMany({
      where: { tenantId, userId },
      include: { plans: true, images: true, detail: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    });

    const sessions = rows.map(deserializeSession);

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
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const tenantId = "default";

    const body = (await request.json()) as { session: V2Session };
    const session = body.session;
    if (!session?.id) {
      return NextResponse.json({ error: "Missing session.id" }, { status: 400 });
    }

    const existing = await prisma.aiImageV2Session.findFirst({
      where: { id: session.id, tenantId, userId },
      include: { plans: true, images: true, detail: true },
    });

    const sessionInput = toSessionCreateInput(session, tenantId, userId);

    await prisma.$transaction(async (tx) => {
      if (existing) {
        // ── Update session core fields ──
        await tx.aiImageV2Session.update({
          where: { id: session.id },
          data: {
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
          },
        });

        // ── Replace plans (source of truth from frontend) ──
        await tx.aiImageV2Plan.deleteMany({ where: { sessionId: session.id, tenantId, userId } });
        if (session.singlePlans?.length) {
          await tx.aiImageV2Plan.createMany({
            data: session.singlePlans.map((plan, i) => toPlanCreateInput(plan, session.id, tenantId, userId, i)),
          });
        }

        // ── Merge images: keep server images + append new ones from client ──
        const existingImageIds = new Set(existing.images.map((img) => img.id));
        const newImages = (session.generatedImages || []).filter((img) => !existingImageIds.has(img.id));
        if (newImages.length > 0) {
          await tx.aiImageV2GeneratedImage.createMany({
            data: newImages.map((img) => toImageCreateInput(img, session.id, tenantId, userId)),
          });
        }

        // ── Replace detail state (source of truth from frontend) ──
        if (existing.detail) {
          await tx.aiImageV2DetailState.deleteMany({ where: { sessionId: session.id, tenantId, userId } });
        }
        if (session.detail) {
          await tx.aiImageV2DetailState.create({
            data: toDetailStateCreateInput(session.detail, session.id, tenantId, userId),
          });
        }
      } else {
        // ── Create new session with all children ──
        await tx.aiImageV2Session.create({ data: sessionInput });

        if (session.singlePlans?.length) {
          await tx.aiImageV2Plan.createMany({
            data: session.singlePlans.map((plan, i) => toPlanCreateInput(plan, session.id, tenantId, userId, i)),
          });
        }

        if (session.generatedImages?.length) {
          await tx.aiImageV2GeneratedImage.createMany({
            data: session.generatedImages.map((img) => toImageCreateInput(img, session.id, tenantId, userId)),
          });
        }

        if (session.detail) {
          await tx.aiImageV2DetailState.create({
            data: toDetailStateCreateInput(session.detail, session.id, tenantId, userId),
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
