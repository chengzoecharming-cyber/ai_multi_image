import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthScope, requireActiveAuthorizationCode, scopedTenantUserWhere } from "@/lib/auth-scope";
import { getImageProvider } from "@/lib/image-providers";
import { checkAndResetQuotaForScope, deductQuotaForScope, quotaErrorMessage } from "@/lib/quota";

// POST /api/ai-image/tasks/:id/retry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 配额检查
    const quotaCheck = await checkAndResetQuotaForScope(scope);
    if (!quotaCheck.ok) {
      return NextResponse.json(
        { error: quotaErrorMessage(quotaCheck.hoursUntilReset), code: "QUOTA_EXHAUSTED" },
        { status: 429 }
      );
    }

    const { id } = await params;

    const task = await prisma.aiImageTask.findFirst({
      where: { id, ...scopedTenantUserWhere(scope, tenantId) },
    });

    if (!task) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    // 更新状态为 processing
    await prisma.aiImageTask.update({
      where: { id },
      data: {
        status: "processing",
        errorMessage: null,
        resultImageUrl: null,
      },
    });

    // Parse snapshot data
    const config = JSON.parse(task.configSnapshot);

    // Parse reference images snapshot (supports both legacy string[] and new object format)
    let productImageUrl: string | null = null;
    let styleReferenceUrls: string[] = [];
    try {
      const parsed = JSON.parse(task.referenceImagesSnapshot);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        productImageUrl = parsed.productImageUrl || null;
        styleReferenceUrls = parsed.styleReferenceUrls || [];
      } else if (Array.isArray(parsed)) {
        // Legacy format: array of image URLs — treat first as product, rest as style
        productImageUrl = parsed[0] || null;
        styleReferenceUrls = parsed.slice(1);
      }
    } catch {
      // If not valid JSON, leave defaults
    }

    // 重新调用 Provider — generate single image
    const provider = getImageProvider();
    const imageUrls: string[] = [];

    const result = await provider.generate({
      prompt: task.promptSnapshot,
      negativePrompt: task.negativePromptSnapshot || undefined,
      productImageUrl,
      styleReferenceUrls,
      width: config?.width || 1024,
      height: config?.height || 1024,
      model: config?.model,
      quality: config?.quality,
    });

    if (result.success && result.imageUrl) {
      imageUrls.push(result.imageUrl);
    }

    if (imageUrls.length > 0) {
      // 扣除配额（重试 = 1 张）
      const remainingQuota = await deductQuotaForScope(scope, 1);

      const updatedTask = await prisma.aiImageTask.update({
        where: { id },
        data: {
          status: "completed",
          resultImageUrl: JSON.stringify(imageUrls),
        },
      });
      return NextResponse.json({ data: updatedTask, remainingQuota });
    } else {
      const updatedTask = await prisma.aiImageTask.update({
        where: { id },
        data: {
          status: "failed",
          errorMessage: result.error || "重新生成失败",
        },
      });
      return NextResponse.json({ data: updatedTask });
    }
  } catch (error) {
    console.error("Failed to retry task:", error);
    return NextResponse.json({ error: "重新生成失败" }, { status: 500 });
  }
}
