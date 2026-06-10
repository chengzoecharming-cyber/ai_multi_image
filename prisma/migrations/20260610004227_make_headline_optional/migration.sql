-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ai_image_v2_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_name" TEXT NOT NULL,
    "plan_archetype" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "image_type" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "layout_direction" TEXT NOT NULL,
    "visual_direction" TEXT NOT NULL,
    "color_direction" TEXT NOT NULL,
    "visual_presentation" TEXT,
    "copy_density" TEXT,
    "product_analysis_json" TEXT,
    "product_name" TEXT NOT NULL,
    "headline" TEXT,
    "subtitle" TEXT,
    "selling_points" TEXT,
    "copy_blocks" TEXT,
    "headline_cn" TEXT,
    "subtitle_cn" TEXT,
    "selling_points_cn" TEXT,
    "copy_blocks_cn" TEXT,
    "copy_source" TEXT NOT NULL DEFAULT 'ai_rewritten',
    "copy_notes" TEXT,
    "visual_style_id" TEXT,
    "visual_style_label" TEXT,
    "layout_overlay_json" TEXT,
    "plan_summary_prompt" TEXT,
    "image_generation_prompt" TEXT,
    "final_prompt" TEXT,
    "risk_warnings" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_image_v2_plans_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "ai_image_v2_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ai_image_v2_plans" ("color_direction", "copy_blocks", "copy_blocks_cn", "copy_density", "copy_notes", "copy_source", "created_at", "final_prompt", "headline", "headline_cn", "id", "image_generation_prompt", "image_type", "layout_direction", "layout_overlay_json", "plan_archetype", "plan_name", "plan_summary_prompt", "product_analysis_json", "product_name", "risk_warnings", "selling_points", "selling_points_cn", "session_id", "sort_order", "subtitle", "subtitle_cn", "template_id", "tenant_id", "user_id", "visual_direction", "visual_presentation", "visual_style_id", "visual_style_label") SELECT "color_direction", "copy_blocks", "copy_blocks_cn", "copy_density", "copy_notes", "copy_source", "created_at", "final_prompt", "headline", "headline_cn", "id", "image_generation_prompt", "image_type", "layout_direction", "layout_overlay_json", "plan_archetype", "plan_name", "plan_summary_prompt", "product_analysis_json", "product_name", "risk_warnings", "selling_points", "selling_points_cn", "session_id", "sort_order", "subtitle", "subtitle_cn", "template_id", "tenant_id", "user_id", "visual_direction", "visual_presentation", "visual_style_id", "visual_style_label" FROM "ai_image_v2_plans";
DROP TABLE "ai_image_v2_plans";
ALTER TABLE "new_ai_image_v2_plans" RENAME TO "ai_image_v2_plans";
CREATE INDEX "ai_image_v2_plans_tenant_id_user_id_session_id_idx" ON "ai_image_v2_plans"("tenant_id", "user_id", "session_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
