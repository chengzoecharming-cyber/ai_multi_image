"use client";

// Barrel file: re-exports all v2 components for backward-compatible imports.
// Components are organized under ./components/ by category.

export { StepBadge } from "./components/ui/StepBadge";
export { ModeSelector } from "./components/ui/ModeSelector";

export { ProductAnalysisBlock } from "./components/blocks/ProductAnalysisBlock";
export { LayoutOverlayBlock } from "./components/blocks/LayoutOverlayBlock";
export { RiskWarningsBlock } from "./components/blocks/RiskWarningsBlock";

export { PlanEditableFields } from "./components/plan/PlanEditableFields";
export { PlanInfoDialog } from "./components/plan/PlanInfoDialog";

export { SinglePlanCard } from "./components/cards/SinglePlanCard";
export { SubPlanCard } from "./components/cards/SubPlanCard";
export { SetPlanCard } from "./components/cards/SetPlanCard";

export { PromptPreviewPanel } from "./components/preview/PromptPreviewPanel";
