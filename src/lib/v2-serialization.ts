import type {
  V2Session, CreativePlan, V2GeneratedImage, V2DetailState,
  CopyBlock, ProductAnalysis, LayoutOverlay, V2SessionStatus,
  PlanArchetype, CopySource,
} from "@/app/ai-image/v2/types";
import type { CopyDensityId } from "@/app/ai-image/v2/domain/copy-density/types";
import type { V2DetailType } from "@/app/ai-image/v2/domain/detail-assets";
import type { VisualStyleId } from "@/app/ai-image/v2/plan-taxonomy";

// ============================================================
// Prisma row types (use `any` to avoid stale cache issues)
// ============================================================

interface RawPlan {
  id: string;
  planName: string;
  planArchetype: string;
  templateId: string;
  imageType: string;
  sortOrder: number;
  layoutDirection: string;
  visualDirection: string;
  colorDirection: string;
  visualPresentation: string | null;
  copyDensity: string | null;
  productAnalysisJson: string | null;
  productName: string;
  headline: string | null;
  subtitle: string | null;
  sellingPoints: string | null;
  copyBlocks: string | null;
  headlineCn: string | null;
  subtitleCn: string | null;
  sellingPointsCn: string | null;
  copyBlocksCn: string | null;
  copySource: string;
  copyNotes: string | null;
  visualStyleId: string | null;
  visualStyleLabel: string | null;
  layoutOverlayJson: string | null;
  planSummaryPrompt: string | null;
  imageGenerationPrompt: string | null;
  finalPrompt: string | null;
  riskWarnings: string | null;
  createdAt: Date;
}

interface RawImage {
  id: string;
  planId: string | null;
  taskId: string | null;
  tab: string;
  detailType: string | null;
  imageUrl: string | null;
  thumbImageUrl: string | null;
  imageBase64: string | null;
  createdAt: Date;
}

interface RawDetail {
  detailImageUrls: string | null;
  activeDetailImageIndex: number;
  heroPlanJson: string | null;
  selectedTypes: string | null;
  generating: boolean;
  lastError: string | null;
  failedTypes: string | null;
  generatingTypes: string | null;
  activeGeneratingType: string | null;
}

interface RawSession {
  id: string;
  authorizationCodeId: string | null;
  authorizationCode?: {
    code: string;
    status: string;
    note: string | null;
    quota: number;
    quotaMax: number;
    resetHours: number;
    resetAt: Date | null;
    user?: {
      name: string | null;
      email: string;
    } | null;
  } | null;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  workspaceTab: string | null;
  mode: string;
  step: string;
  status: string | null;
  lastError: string | null;
  productImageUrls: string | null;
  activeProductImageIndex: number;
  referenceImageUrls: string | null;
  goal: string;
  outputWidth: number;
  outputHeight: number;
  provider: string | null;
  selectedTemplateId: string | null;
  expandedSingleId: string | null;
  editingSingleId: string | null;
  previewPlanId: string | null;
  copiedId: string | null;
  generatingImage: boolean;
  generatingImagePlanId: string | null;
  plans: RawPlan[];
  images: RawImage[];
  detail: RawDetail | null;
}

// ============================================================
// Prisma → Frontend types
// ============================================================

export function deserializeSession(row: RawSession): V2Session {
  const detail: V2DetailState | undefined = row.detail
    ? {
        detailImageUrls: safeParseJson<string[]>(row.detail.detailImageUrls) || [],
        activeDetailImageIndex: row.detail.activeDetailImageIndex,
        heroPlan: safeParseJson<CreativePlan>(row.detail.heroPlanJson) || null,
        selectedTypes: (safeParseJson<string[]>(row.detail.selectedTypes) || []) as V2DetailType[],
        generating: row.detail.generating,
        generatingTypes: (safeParseJson<string[]>(row.detail.generatingTypes) || []) as V2DetailType[],
        activeGeneratingType: (row.detail.activeGeneratingType as V2DetailType) || null,
        failedTypes: safeParseJson<Array<{ type: V2DetailType; error: string }>>(row.detail.failedTypes) || [],
        results: [],
        lastError: row.detail.lastError ?? null,
      }
    : undefined;

  const generatedImages: V2GeneratedImage[] = (row.images || [])
    .filter((img) => !!img.imageUrl)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((img) => ({
      id: img.id,
      planId: img.planId ?? undefined,
      taskId: img.taskId ?? undefined,
      tab: (img.tab as "product" | "detail") || "product",
      detailType: (img.detailType as V2DetailType) ?? undefined,
      imageUrl: img.imageUrl!,
      thumbUrl: img.thumbImageUrl ?? undefined,
      imageBase64: img.imageBase64 ?? undefined,
      createdAt: new Date(img.createdAt).getTime(),
    }));

  if (detail) {
    detail.results = generatedImages
      .filter((img) => img.tab === "detail" && img.detailType)
      .map((img) => ({ type: img.detailType!, imageId: img.id }));
  }

  const singlePlans: CreativePlan[] = (row.plans || [])
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(deserializePlan);

  return {
    id: row.id,
    authorizationCodeId: row.authorizationCodeId ?? undefined,
    authorizationCode: row.authorizationCode
      ? {
          code: row.authorizationCode.code,
          status: row.authorizationCode.status,
          note: row.authorizationCode.note,
          quota: row.authorizationCode.quota,
          quotaMax: row.authorizationCode.quotaMax,
          resetHours: row.authorizationCode.resetHours,
          resetAt: row.authorizationCode.resetAt ? new Date(row.authorizationCode.resetAt).getTime() : null,
          user: row.authorizationCode.user
            ? {
                name: row.authorizationCode.user.name,
                email: row.authorizationCode.user.email,
              }
            : null,
        }
      : null,
    title: row.title ?? undefined,
    createdAt: new Date(row.createdAt).getTime(),
    updatedAt: new Date(row.updatedAt).getTime(),
    workspaceTab: (row.workspaceTab as "product" | "detail") || "product",
    mode: (row.mode as "single") || "single",
    step: (row.step as "input" | "generating" | "plans" | "preview") || "input",
    status: (row.status as V2SessionStatus) || undefined,
    lastError: row.lastError ?? null,
    productImageUrls: safeParseJson<string[]>(row.productImageUrls) || [],
    activeProductImageIndex: row.activeProductImageIndex,
    referenceImageUrls: safeParseJson<string[]>(row.referenceImageUrls) || [],
    goal: row.goal,
    outputWidth: row.outputWidth,
    outputHeight: row.outputHeight,
    provider: row.provider ?? undefined,
    selectedTemplateId: row.selectedTemplateId ?? null,
    singlePlans,
    expandedSingleId: row.expandedSingleId ?? null,
    editingSingleId: row.editingSingleId ?? null,
    previewPlanId: row.previewPlanId ?? null,
    copiedId: row.copiedId ?? null,
    generatingImage: row.generatingImage,
    generatingImagePlanId: row.generatingImagePlanId ?? null,
    generatedImages,
    detail,
  };
}

function deserializePlan(row: RawPlan): CreativePlan {
  return {
    id: row.id,
    planName: row.planName,
    planArchetype: row.planArchetype as PlanArchetype,
    templateId: row.templateId,
    imageType: row.imageType,
    visualComplexity: "medium" as "simple" | "medium" | "complex",
    informationDensity: "medium" as "low" | "medium" | "high",
    copyDensity: (row.copyDensity as CopyDensityId) ?? undefined,
    layoutDirection: row.layoutDirection,
    visualDirection: row.visualDirection,
    colorDirection: row.colorDirection,
    visualPresentation: row.visualPresentation ?? undefined,
    productAnalysis: safeParseJson<ProductAnalysis>(row.productAnalysisJson) ?? undefined,
    productName: row.productName,
    headline: row.headline ?? undefined,
    subtitle: row.subtitle ?? undefined,
    sellingPoints: safeParseJson<string[]>(row.sellingPoints) || [],
    copyBlocks: safeParseJson<CopyBlock[]>(row.copyBlocks) || [],
    headlineCn: row.headlineCn ?? undefined,
    subtitleCn: row.subtitleCn ?? undefined,
    sellingPointsCn: safeParseJson<string[]>(row.sellingPointsCn) || undefined,
    copyBlocksCn: safeParseJson<CopyBlock[]>(row.copyBlocksCn) || undefined,
    copySource: (row.copySource as CopySource) || "ai_rewritten",
    copyNotes: safeParseJson<string[]>(row.copyNotes) ?? undefined,
    visualStyleId: (row.visualStyleId as VisualStyleId) ?? undefined,
    visualStyleLabel: row.visualStyleLabel ?? undefined,
    layoutOverlay: safeParseJson<LayoutOverlay>(row.layoutOverlayJson) ?? undefined,
    textLanguage: "English",
    riskWarnings: safeParseJson<string[]>(row.riskWarnings) || [],
    planSummaryPrompt: row.planSummaryPrompt ?? undefined,
    imageGenerationPrompt: row.imageGenerationPrompt ?? undefined,
    finalPrompt: row.finalPrompt ?? undefined,
  };
}

// ============================================================
// Frontend types → Prisma create inputs (plain objects)
// ============================================================

export interface AiImageV2SessionCreateData {
  id: string;
  tenantId: string;
  userId: string;
  authorizationCodeId: string | null;
  title: string | null;
  workspaceTab: string;
  mode: string;
  step: string;
  status: string | null;
  lastError: string | null;
  productImageUrls: string;
  activeProductImageIndex: number;
  referenceImageUrls: string;
  goal: string;
  outputWidth: number;
  outputHeight: number;
  provider: string | null;
  selectedTemplateId: string | null;
  expandedSingleId: string | null;
  editingSingleId: string | null;
  previewPlanId: string | null;
  copiedId: string | null;
  generatingImage: boolean;
  generatingImagePlanId: string | null;
}

export interface AiImageV2PlanCreateData {
  id: string;
  sessionId: string;
  tenantId: string;
  userId: string;
  planName: string;
  planArchetype: string;
  templateId: string;
  imageType: string;
  sortOrder: number;
  layoutDirection: string;
  visualDirection: string;
  colorDirection: string;
  visualPresentation: string | null;
  copyDensity: string | null;
  productAnalysisJson: string | null;
  productName: string;
  headline: string | null;
  subtitle: string | null;
  sellingPoints: string;
  copyBlocks: string;
  headlineCn: string | null;
  subtitleCn: string | null;
  sellingPointsCn: string;
  copyBlocksCn: string;
  copySource: string;
  copyNotes: string | null;
  visualStyleId: string | null;
  visualStyleLabel: string | null;
  layoutOverlayJson: string | null;
  planSummaryPrompt: string | null;
  imageGenerationPrompt: string | null;
  finalPrompt: string | null;
  riskWarnings: string;
}

export interface AiImageV2GeneratedImageCreateData {
  id: string;
  sessionId: string;
  tenantId: string;
  userId: string;
  planId: string | null;
  taskId: string | null;
  tab: string;
  detailType: string | null;
  imageUrl: string;
  thumbImageUrl: string | null;
  imageBase64: string | null;
  createdAt: Date;
}

export interface AiImageV2DetailStateCreateData {
  sessionId: string;
  tenantId: string;
  userId: string;
  detailImageUrls: string;
  activeDetailImageIndex: number;
  heroPlanJson: string | null;
  selectedTypes: string;
  generating: boolean;
  lastError: string | null;
  failedTypes: string;
  generatingTypes: string;
  activeGeneratingType: string | null;
}

export function toSessionCreateInput(
  session: V2Session,
  tenantId: string,
  userId: string,
): AiImageV2SessionCreateData {
  return {
    id: session.id,
    tenantId,
    userId,
    authorizationCodeId: session.authorizationCodeId ?? null,
    title: session.title ?? null,
    workspaceTab: session.workspaceTab || "product",
    mode: session.mode || "single",
    step: session.step || "input",
    status: session.status ?? null,
    lastError: session.lastError ?? null,
    productImageUrls: JSON.stringify(session.productImageUrls || []),
    activeProductImageIndex: session.activeProductImageIndex ?? 0,
    referenceImageUrls: JSON.stringify(session.referenceImageUrls || []),
    goal: session.goal || "",
    outputWidth: session.outputWidth ?? 1920,
    outputHeight: session.outputHeight ?? 1920,
    provider: session.provider ?? "chatgpt2api",
    selectedTemplateId: session.selectedTemplateId ?? null,
    expandedSingleId: session.expandedSingleId ?? null,
    editingSingleId: session.editingSingleId ?? null,
    previewPlanId: session.previewPlanId ?? null,
    copiedId: session.copiedId ?? null,
    generatingImage: session.generatingImage ?? false,
    generatingImagePlanId: session.generatingImagePlanId ?? null,
  };
}

export function toPlanCreateInput(
  plan: CreativePlan,
  sessionId: string,
  tenantId: string,
  userId: string,
  sortOrder: number,
): AiImageV2PlanCreateData {
  return {
    id: plan.id,
    sessionId,
    tenantId,
    userId,
    planName: plan.planName,
    planArchetype: plan.planArchetype,
    templateId: plan.templateId,
    imageType: plan.imageType as string,
    sortOrder,
    layoutDirection: plan.layoutDirection || "",
    visualDirection: plan.visualDirection || "",
    colorDirection: plan.colorDirection || "",
    visualPresentation: plan.visualPresentation ?? null,
    copyDensity: plan.copyDensity ?? null,
    productAnalysisJson: plan.productAnalysis ? JSON.stringify(plan.productAnalysis) : null,
    productName: plan.productName,
    headline: plan.headline ?? null,
    subtitle: plan.subtitle ?? null,
    sellingPoints: JSON.stringify(plan.sellingPoints || []),
    copyBlocks: JSON.stringify(plan.copyBlocks || []),
    headlineCn: plan.headlineCn ?? null,
    subtitleCn: plan.subtitleCn ?? null,
    sellingPointsCn: JSON.stringify(plan.sellingPointsCn || []),
    copyBlocksCn: JSON.stringify(plan.copyBlocksCn || []),
    copySource: plan.copySource,
    copyNotes: plan.copyNotes ? JSON.stringify(plan.copyNotes) : null,
    visualStyleId: plan.visualStyleId ?? null,
    visualStyleLabel: plan.visualStyleLabel ?? null,
    layoutOverlayJson: plan.layoutOverlay ? JSON.stringify(plan.layoutOverlay) : null,
    planSummaryPrompt: plan.planSummaryPrompt ?? null,
    imageGenerationPrompt: plan.imageGenerationPrompt ?? null,
    finalPrompt: plan.finalPrompt ?? null,
    riskWarnings: JSON.stringify(plan.riskWarnings || []),
  };
}

export function toImageCreateInput(
  image: V2GeneratedImage,
  sessionId: string,
  tenantId: string,
  userId: string,
): AiImageV2GeneratedImageCreateData {
  return {
    id: image.id,
    sessionId,
    tenantId,
    userId,
    planId: image.planId ?? null,
    taskId: image.taskId ?? null,
    tab: image.tab || "product",
    detailType: image.detailType ?? null,
    imageUrl: image.imageUrl,
    thumbImageUrl: image.thumbUrl ?? null,
    imageBase64: image.imageBase64 ?? null,
    createdAt: new Date(image.createdAt),
  };
}

export function toDetailStateCreateInput(
  detail: V2DetailState,
  sessionId: string,
  tenantId: string,
  userId: string,
): AiImageV2DetailStateCreateData {
  return {
    sessionId,
    tenantId,
    userId,
    detailImageUrls: JSON.stringify(detail.detailImageUrls || []),
    activeDetailImageIndex: detail.activeDetailImageIndex ?? 0,
    heroPlanJson: detail.heroPlan ? JSON.stringify(detail.heroPlan) : null,
    selectedTypes: JSON.stringify(detail.selectedTypes || []),
    generating: detail.generating ?? false,
    lastError: detail.lastError ?? null,
    failedTypes: JSON.stringify(detail.failedTypes || []),
    generatingTypes: JSON.stringify(detail.generatingTypes || []),
    activeGeneratingType: detail.activeGeneratingType ?? null,
  };
}

// ============================================================
// Helpers
// ============================================================

function safeParseJson<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
