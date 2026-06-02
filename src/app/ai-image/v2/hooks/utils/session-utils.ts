import type { V2Session, V2SessionStatus, Step, CreativePlan, V2GeneratedImage, V2DetailState, V2WorkspaceTab } from "../../types";

export function nowTs() {
  return Date.now();
}

export function createPlanRequestId() {
  return `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function sessionHasOutput(session: V2Session): boolean {
  return (
    (session.generatedImages?.length || 0) > 0 ||
    (session.singlePlans?.length || 0) > 0 ||
    (session.detail?.results?.length || 0) > 0
  );
}

export function parseTaskResultImages(resultImageUrl?: string | null): string[] {
  if (!resultImageUrl) return [];
  try {
    const parsed = JSON.parse(resultImageUrl);
    if (Array.isArray(parsed)) return parsed.filter((u) => typeof u === "string");
    if (typeof parsed === "string") return [parsed];
    return [];
  } catch {
    return [resultImageUrl];
  }
}

export function getSessionHistoryKey(session: V2Session): string | null {
  const taskIds = (session.generatedImages || [])
    .map((img) => img.taskId?.trim())
    .filter((id): id is string => Boolean(id))
    .sort();
  if (taskIds.length > 0) {
    return `task:${taskIds.join(",")}`;
  }

  const imageUrls = (session.generatedImages || [])
    .map((img) => img.imageUrl?.trim())
    .filter((url): url is string => Boolean(url))
    .sort();
  if (imageUrls.length > 0) {
    return `img:${imageUrls.join(",")}`;
  }

  return null;
}

export function deriveSessionStatus(session: V2Session): V2SessionStatus {
  if (session.lastError) return "failed";
  if (session.detail?.lastError) return "failed";
  if (session.generatingImage || session.detail?.generating) return "generating";
  if (session.step === "generating") return "planning";
  if ((session.generatedImages?.length || 0) > 0) return "done";
  if ((session.singlePlans?.length || 0) > 0) {
    if (session.step === "plans" || session.step === "preview") return "needs_review";
  }
  return "draft";
}

function reconcileStep(seed?: Partial<V2Session>): Step {
  const step = seed?.step || "input";
  if (step === "generating") {
    if ((seed?.singlePlans?.length || 0) > 0) return "plans";
    if ((seed?.generatedImages?.length || 0) > 0) return "plans";
    return "input";
  }
  if (step === "input" && ((seed?.singlePlans?.length || 0) > 0 || (seed?.generatedImages?.length || 0) > 0)) {
    return "plans";
  }
  return step;
}

export function createEmptySession(seed?: Partial<V2Session>): V2Session {
  const ts = nowTs();

  const migratedProductImages = seed?.productImageUrls ?? [];
  const migratedDetailImages = seed?.detail?.detailImageUrls ?? [];

  const base: V2Session = {
    id: seed?.id || globalThis.crypto?.randomUUID?.() || `sess-${ts}-${Math.random().toString(36).slice(2, 6)}`,
    title: seed?.title,
    createdAt: seed?.createdAt || ts,
    updatedAt: ts,
    workspaceTab: seed?.workspaceTab || "product",
    mode: "single",
    step: reconcileStep(seed),
    status: seed?.status,
    lastError: seed?.lastError ?? null,
    productImageUrls: migratedProductImages,
    activeProductImageIndex: seed?.activeProductImageIndex ?? 0,
    referenceImageUrls: seed?.referenceImageUrls ?? [],
    goal: seed?.goal ?? "",
    outputWidth: Number.isFinite(seed?.outputWidth) ? Number(seed?.outputWidth) : 1920,
    outputHeight: Number.isFinite(seed?.outputHeight) ? Number(seed?.outputHeight) : 1920,
    provider: seed?.provider || process.env.NEXT_PUBLIC_DEFAULT_IMAGE_PROVIDER || "chatgpt2api",
    selectedTemplateId: seed?.selectedTemplateId ?? null,
    singlePlans: seed?.singlePlans ?? [],
    expandedSingleId: seed?.expandedSingleId ?? null,
    editingSingleId: seed?.editingSingleId ?? null,
    previewPlanId: seed?.previewPlanId ?? null,
    copiedId: seed?.copiedId ?? null,
    generatingImage: false,
    generatingImagePlanId: null,
    generatedImages: seed?.generatedImages ?? [],
    detail: {
      detailImageUrls: migratedDetailImages,
      activeDetailImageIndex: seed?.detail?.activeDetailImageIndex ?? 0,
      heroPlan: seed?.detail?.heroPlan ?? null,
      selectedTypes: seed?.detail?.selectedTypes ?? [],
      generating: false,
      results: seed?.detail?.results ?? [],
      lastError: seed?.detail?.lastError ?? null,
    },
    groupId: seed?.groupId ?? null,
  };
  return { ...base, status: deriveSessionStatus(base) };
}

/** Strip heavy fields from plans before persistence to avoid quota issues. */
export function stripHeavyPlanFields(plans: CreativePlan[]): Partial<CreativePlan>[] {
  return plans.map((p) => {
    const {
      visualDirection,
      colorDirection,
      layoutDirection,
      imageGenerationPrompt,
      finalPrompt,
      planSummaryPrompt,
      ...rest
    } = p;
    return rest;
  });
}

/** Strip heavy fields from a session before persistence. */
export function stripHeavySessionFields(session: V2Session): V2Session {
  return {
    ...session,
    singlePlans: stripHeavyPlanFields(session.singlePlans || []) as CreativePlan[],
    generatedImages: session.generatedImages.map((g) => {
      const { imageBase64, ...rest } = g;
      return rest as V2GeneratedImage;
    }),
  };
}

export function mergeSessionsWithServerHistory(localSessions: V2Session[], serverSessions: V2Session[]): V2Session[] {
  const merged = new Map<string, V2Session>();

  // 1. server 优先写入（作为 baseline）
  for (const session of serverSessions) {
    merged.set(session.id, session);
  }

  // 2. local 覆盖或补充（同一 id 时，以 updatedAt 大的为准）
  for (const session of localSessions) {
    const existing = merged.get(session.id);
    if (!existing) {
      merged.set(session.id, session);
      continue;
    }

    const sessionProductImages = session.productImageUrls ?? [];
    const existingProductImages = existing.productImageUrls ?? [];
    const mergedProductImages = [...new Set([...existingProductImages, ...sessionProductImages])];

    const sessionRefs = session.referenceImageUrls ?? [];
    const existingRefs = existing.referenceImageUrls ?? [];
    const mergedRefs = [...new Set([...existingRefs, ...sessionRefs])];

    const sessionDetailImages = session.detail?.detailImageUrls ?? [];
    const existingDetailImages = existing.detail?.detailImageUrls ?? [];
    const mergedDetailImages = [...new Set([...existingDetailImages, ...sessionDetailImages])];

    const mergedSession: V2Session = {
      ...existing,
      ...session,
      productImageUrls: mergedProductImages,
      activeProductImageIndex: session.activeProductImageIndex ?? existing.activeProductImageIndex ?? 0,
      referenceImageUrls: mergedRefs,
      goal: (session.goal && session.goal.trim()) ? session.goal : (existing.goal || ""),
      generatedImages:
        (session.generatedImages?.length ?? 0) > (existing.generatedImages?.length ?? 0)
          ? session.generatedImages
          : existing.generatedImages,
      singlePlans:
        (session.singlePlans?.length ?? 0) > (existing.singlePlans?.length ?? 0)
          ? session.singlePlans
          : existing.singlePlans,
      detail: {
        ...(session.detail || existing.detail || { selectedTypes: [], generating: false, results: [], lastError: null }),
        detailImageUrls: mergedDetailImages,
        activeDetailImageIndex: session.detail?.activeDetailImageIndex ?? existing.detail?.activeDetailImageIndex ?? 0,
      },
      updatedAt: Math.max(existing.updatedAt || 0, session.updatedAt || 0),
    };
    merged.set(session.id, mergedSession);
  }

  return Array.from(merged.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function resolveImageUrl(rawResultImageUrl: unknown): string | null {
  if (!rawResultImageUrl) return null;
  if (Array.isArray(rawResultImageUrl)) return rawResultImageUrl[0] || null;
  if (typeof rawResultImageUrl !== "string") return null;
  try {
    const parsed = JSON.parse(rawResultImageUrl);
    if (Array.isArray(parsed)) return parsed[0] || null;
    if (typeof parsed === "string") return parsed;
  } catch {
    return rawResultImageUrl;
  }
  return null;
}

export function buildImageBase64(rawBase64: string): string {
  if (!rawBase64) return "";
  if (rawBase64.startsWith("data:")) return rawBase64;
  if (rawBase64.startsWith("http")) return "";
  if (rawBase64.length > 64) return `data:image/png;base64,${rawBase64}`;
  return "";
}
