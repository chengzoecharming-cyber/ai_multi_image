import assert from "node:assert/strict";
import { test } from "node:test";
import type { CreativePlan, V2GeneratedImage, V2Session } from "../../types";
import {
  mergeSessionsWithServerHistory,
  stripHeavySessionFields,
} from "./session-utils";

function generatedImage(overrides: Partial<V2GeneratedImage> = {}): V2GeneratedImage {
  return {
    id: "img-1",
    planId: "plan-1",
    taskId: "task-1",
    tab: "product",
    imageUrl: "/generated/task-1.png",
    imageBase64: "data:image/png;base64,abc123",
    createdAt: 2_000,
    ...overrides,
  };
}

function makeSession(overrides: Partial<V2Session> = {}): V2Session {
  return {
    id: "sess-1",
    title: "Test session",
    createdAt: 1_000,
    updatedAt: 1_000,
    workspaceTab: "product",
    mode: "single",
    step: "input",
    status: "draft",
    lastError: null,
    productImageUrls: ["/uploads/source.png"],
    activeProductImageIndex: 0,
    referenceImageUrls: [],
    goal: "Make a product hero image",
    outputWidth: 1920,
    outputHeight: 1920,
    provider: "chatgpt2api",
    selectedTemplateId: null,
    singlePlans: [],
    expandedSingleId: null,
    editingSingleId: null,
    previewPlanId: null,
    copiedId: null,
    generatingImage: false,
    generatingImagePlanId: null,
    generatedImages: [],
    detail: {
      detailImageUrls: [],
      activeDetailImageIndex: 0,
      heroPlan: null,
      selectedTypes: [],
      generating: false,
      results: [],
      lastError: null,
    },
    groupId: null,
    ...overrides,
  };
}

test("persisted session keeps generated outputs out of uploaded product inputs", () => {
  const firstGenerated = generatedImage();
  const secondGenerated = generatedImage({
    id: "img-2",
    taskId: "task-2",
    imageUrl: "http://localhost:3002/generated/task-2.png",
    createdAt: 1_500,
  });

  const persisted = stripHeavySessionFields(
    makeSession({
      step: "generating",
      productImageUrls: [
        "/uploads/source.png",
        "/generated/task-1.png",
        "http://localhost:3002/generated/task-2.png",
        "/uploads/source.png",
      ],
      activeProductImageIndex: 3,
      referenceImageUrls: ["/uploads/style.png", "/generated/task-1.png"],
      generatingImage: true,
      generatingImagePlanId: "plan-1",
      generatedImages: [firstGenerated, secondGenerated],
      detail: {
        detailImageUrls: ["/generated/task-1.png"],
        activeDetailImageIndex: 0,
        heroPlan: null,
        selectedTypes: [],
        generating: true,
        results: [],
        lastError: null,
      },
    })
  );

  assert.deepEqual(persisted.productImageUrls, ["/uploads/source.png"]);
  assert.equal(persisted.activeProductImageIndex, 0);
  assert.deepEqual(persisted.referenceImageUrls, ["/uploads/style.png"]);
  assert.deepEqual(
    persisted.generatedImages.map((image) => image.imageUrl),
    ["/generated/task-1.png", "http://localhost:3002/generated/task-2.png"]
  );
  assert.equal(persisted.generatedImages[0].imageBase64, undefined);
  assert.equal(persisted.generatingImage, false);
  assert.equal(persisted.generatingImagePlanId, null);
  assert.equal(persisted.step, "plans");
  assert.deepEqual(persisted.detail?.detailImageUrls, ["/generated/task-1.png"]);
  assert.equal(persisted.detail?.generating, false);
});

test("refresh merge prefers IndexedDB config and merges generated history separately", () => {
  const output = generatedImage();
  const serverSession = makeSession({
    updatedAt: 3_000,
    productImageUrls: ["/uploads/source.png", "/generated/task-1.png"],
    referenceImageUrls: ["/generated/task-1.png"],
    generatedImages: [output],
  });
  const indexedDbSession = makeSession({
    updatedAt: 2_000,
    productImageUrls: ["/uploads/source.png"],
    referenceImageUrls: ["/uploads/style.png"],
    generatedImages: [],
  });

  const [merged] = mergeSessionsWithServerHistory([indexedDbSession], [serverSession]);

  assert.deepEqual(merged.productImageUrls, ["/uploads/source.png"]);
  assert.deepEqual(merged.referenceImageUrls, ["/uploads/style.png"]);
  assert.deepEqual(merged.generatedImages.map((image) => image.imageUrl), ["/generated/task-1.png"]);
  assert.equal(merged.updatedAt, 3_000);
});

test("IndexedDB snapshot keeps complete plan prompts and visual directions", () => {
  const plan = {
    id: "plan-1",
    planName: "Hero Plan",
    planArchetype: "hero_feature",
    templateId: "tpl-hero",
    imageType: "hero",
    visualComplexity: "medium",
    informationDensity: "medium",
    layoutDirection: "center product with headline",
    visualDirection: "premium studio lighting",
    colorDirection: "white and graphite",
    productName: "Test Product",
    headline: "TEST PRODUCT",
    sellingPoints: [],
    copyBlocks: [],
    copySource: "ai_rewritten",
    textLanguage: "English",
    riskWarnings: [],
    planSummaryPrompt: "summary prompt",
    imageGenerationPrompt: "image generation prompt",
    finalPrompt: "final prompt",
  } as CreativePlan;

  const persisted = stripHeavySessionFields(makeSession({ singlePlans: [plan] }));

  assert.equal(persisted.singlePlans[0].layoutDirection, "center product with headline");
  assert.equal(persisted.singlePlans[0].visualDirection, "premium studio lighting");
  assert.equal(persisted.singlePlans[0].colorDirection, "white and graphite");
  assert.equal(persisted.singlePlans[0].planSummaryPrompt, "summary prompt");
  assert.equal(persisted.singlePlans[0].imageGenerationPrompt, "image generation prompt");
  assert.equal(persisted.singlePlans[0].finalPrompt, "final prompt");
});
