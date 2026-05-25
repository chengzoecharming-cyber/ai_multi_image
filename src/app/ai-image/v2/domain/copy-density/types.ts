/**
 * CopyDensityId — 文案密度/文案策略。
 *
 * 描述的是「画面上放多少字、怎么组织文案」，不是视觉风格。
 */
export type CopyDensityId =
  | "headline_only"
  | "minimal"
  | "medium"
  | "rich";

export interface CopyDensityProfile {
  id: CopyDensityId;
  label: string;
  description: string;
}
