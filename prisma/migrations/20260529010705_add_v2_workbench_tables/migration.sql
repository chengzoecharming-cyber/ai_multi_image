-- CreateTable
CREATE TABLE "ai_image_v2_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "workspace_tab" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'single',
    "step" TEXT NOT NULL DEFAULT 'input',
    "status" TEXT,
    "last_error" TEXT,
    "product_image_urls" TEXT,
    "active_product_image_index" INTEGER NOT NULL DEFAULT 0,
    "reference_image_urls" TEXT,
    "goal" TEXT NOT NULL DEFAULT '',
    "output_width" INTEGER NOT NULL DEFAULT 1920,
    "output_height" INTEGER NOT NULL DEFAULT 1920,
    "provider" TEXT DEFAULT 'chatgpt2api',
    "selected_template_id" TEXT,
    "expanded_single_id" TEXT,
    "editing_single_id" TEXT,
    "preview_plan_id" TEXT,
    "copied_id" TEXT,
    "generating_image" BOOLEAN NOT NULL DEFAULT false,
    "generating_image_plan_id" TEXT
);

-- CreateTable
CREATE TABLE "ai_image_v2_plans" (
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
    "copy_density" TEXT,
    "product_analysis_json" TEXT,
    "product_name" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "subtitle" TEXT,
    "selling_points" TEXT,
    "copy_blocks" TEXT,
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

-- CreateTable
CREATE TABLE "ai_image_v2_generated_images" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT,
    "task_id" TEXT,
    "tab" TEXT NOT NULL DEFAULT 'product',
    "detail_type" TEXT,
    "image_url" TEXT NOT NULL,
    "image_base64" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_image_v2_generated_images_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "ai_image_v2_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_image_v2_detail_states" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "detail_image_urls" TEXT,
    "active_detail_image_index" INTEGER NOT NULL DEFAULT 0,
    "hero_plan_json" TEXT,
    "selected_types" TEXT,
    "generating" BOOLEAN NOT NULL DEFAULT false,
    "last_error" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_image_v2_detail_states_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "ai_image_v2_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ai_image_v2_sessions_tenant_id_user_id_updated_at_idx" ON "ai_image_v2_sessions"("tenant_id", "user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "ai_image_v2_plans_tenant_id_user_id_session_id_idx" ON "ai_image_v2_plans"("tenant_id", "user_id", "session_id");

-- CreateIndex
CREATE INDEX "ai_image_v2_generated_images_tenant_id_user_id_session_id_idx" ON "ai_image_v2_generated_images"("tenant_id", "user_id", "session_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_image_v2_detail_states_session_id_key" ON "ai_image_v2_detail_states"("session_id");

-- CreateIndex
CREATE INDEX "ai_image_v2_detail_states_tenant_id_user_id_idx" ON "ai_image_v2_detail_states"("tenant_id", "user_id");
