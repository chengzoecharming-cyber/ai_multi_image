import type { V2Session, V2SessionStatus, Step, V2GeneratedImage } from "../../types";

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
  if ((session.detail?.failedTypes?.length || 0) > 0) return "failed";
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
      generatingTypes: seed?.detail?.generatingTypes ?? [],
      activeGeneratingType: seed?.detail?.activeGeneratingType ?? null,
      failedTypes: seed?.detail?.failedTypes ?? [],
      results: seed?.detail?.results ?? [],
      lastError: seed?.detail?.lastError ?? null,
    },
    groupId: seed?.groupId ?? null,
  };
  return { ...base, status: deriveSessionStatus(base) };
}

function normalizeImageUrlKey(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith("/generated/") || parsed.pathname.startsWith("/uploads/")) {
      return parsed.pathname;
    }
  } catch {
    return trimmed;
  }
  return trimmed;
}

function isGeneratedOutputUrl(url: string, generatedUrlKeys: Set<string>): boolean {
  const key = normalizeImageUrlKey(url);
  if (!key) return false;
  return key.startsWith("/generated/") || generatedUrlKeys.has(key);
}

function filterInputImageUrls(urls: string[], generatedUrlKeys: Set<string>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of urls || []) {
    if (typeof url !== "string") continue;
    const trimmed = url.trim();
    const key = normalizeImageUrlKey(trimmed);
    if (!trimmed || !key || seen.has(key) || isGeneratedOutputUrl(trimmed, generatedUrlKeys)) {
      continue;
    }
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function clampImageIndex(index: number | undefined, length: number): number {
  if (length <= 0) return 0;
  const safeIndex = Number.isFinite(index) ? Number(index) : 0;
  return Math.max(0, Math.min(length - 1, safeIndex));
}

function getGeneratedImageMergeKey(image: V2GeneratedImage): string {
  if (image.taskId) return `task:${image.taskId}`;
  const urlKey = normalizeImageUrlKey(image.imageUrl || "");
  if (urlKey) return `url:${urlKey}`;
  return `id:${image.id}`;
}

function mergeGeneratedImages(...imageGroups: V2GeneratedImage[][]): V2GeneratedImage[] {
  const merged = new Map<string, V2GeneratedImage>();
  for (const images of imageGroups) {
    for (const image of images || []) {
      if (!image?.imageUrl) continue;
      merged.set(getGeneratedImageMergeKey(image), image);
    }
  }
  return Array.from(merged.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function hasImagesMissingFromLocal(serverImages: V2GeneratedImage[], localImages: V2GeneratedImage[]): boolean {
  const localKeys = new Set((localImages || []).map(getGeneratedImageMergeKey));
  return (serverImages || []).some((image) => !localKeys.has(getGeneratedImageMergeKey(image)));
}

export function normalizeSessionForPersistence(session: V2Session): V2Session {
  const generatedImages = mergeGeneratedImages(
    (session.generatedImages || []).map((image) => ({ ...image, imageBase64: undefined }))
  );
  const generatedUrlKeys = new Set(generatedImages.map((image) => normalizeImageUrlKey(image.imageUrl)).filter(Boolean));
  const productImageUrls = filterInputImageUrls(session.productImageUrls || [], generatedUrlKeys);
  const referenceImageUrls = filterInputImageUrls(session.referenceImageUrls || [], generatedUrlKeys);
  const detailImageUrls = session.detail?.detailImageUrls || [];

  const normalized: V2Session = {
    ...session,
    step: reconcileStep({
      ...session,
      productImageUrls,
      referenceImageUrls,
      generatedImages,
    }),
    productImageUrls,
    activeProductImageIndex: clampImageIndex(session.activeProductImageIndex, productImageUrls.length),
    referenceImageUrls,
    singlePlans: session.singlePlans || [],
    generatingImage: false,
    generatingImagePlanId: null,
    generatedImages,
    detail: session.detail
      ? {
          ...session.detail,
          detailImageUrls,
          activeDetailImageIndex: clampImageIndex(session.detail.activeDetailImageIndex, detailImageUrls.length),
          generating: false,
        }
      : session.detail,
  };

  return { ...normalized, status: deriveSessionStatus(normalized) };
}

/** Prepare a session snapshot for durable IndexedDB/server persistence. */
export function stripHeavySessionFields(session: V2Session): V2Session {
  return normalizeSessionForPersistence(session);
}

export function mergeSessionsWithServerHistory(localSessions: V2Session[], serverSessions: V2Session[]): V2Session[] {
  const merged = new Map<string, V2Session>();

  // 1. server 优先写入（作为 baseline）
  for (const session of serverSessions) {
    merged.set(session.id, normalizeSessionForPersistence(session));
  }

  // 2. local 覆盖配置字段，server 只补充缺失的生成历史
  for (const session of localSessions) {
    const localSession = normalizeSessionForPersistence(session);
    const existing = merged.get(session.id);
    if (!existing) {
      merged.set(localSession.id, localSession);
      continue;
    }

    const generatedImages = mergeGeneratedImages(existing.generatedImages || [], localSession.generatedImages || []);
    const serverHasNewGeneratedHistory = hasImagesMissingFromLocal(
      existing.generatedImages || [],
      localSession.generatedImages || []
    );
    const singlePlans =
      (localSession.singlePlans?.length ?? 0) > 0
        ? localSession.singlePlans
        : existing.singlePlans || [];
    const detail = localSession.detail || existing.detail;

    const mergedSession = normalizeSessionForPersistence({
      ...existing,
      ...localSession,
      lastError: serverHasNewGeneratedHistory ? null : localSession.lastError ?? existing.lastError,
      generatingImage: serverHasNewGeneratedHistory ? false : localSession.generatingImage,
      generatingImagePlanId: serverHasNewGeneratedHistory ? null : localSession.generatingImagePlanId,
      singlePlans,
      generatedImages,
      detail: detail
        ? {
            ...detail,
            generating: serverHasNewGeneratedHistory ? false : detail.generating,
            generatingTypes: serverHasNewGeneratedHistory ? [] : detail.generatingTypes,
            activeGeneratingType: serverHasNewGeneratedHistory ? null : detail.activeGeneratingType,
            lastError: serverHasNewGeneratedHistory ? null : detail.lastError,
          }
        : detail,
      updatedAt: Math.max(existing.updatedAt || 0, session.updatedAt || 0),
    });
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
