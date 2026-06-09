-- AlterTable
ALTER TABLE "ai_image_v2_plans" ADD COLUMN "copy_blocks_cn" TEXT;
ALTER TABLE "ai_image_v2_plans" ADD COLUMN "headline_cn" TEXT;
ALTER TABLE "ai_image_v2_plans" ADD COLUMN "selling_points_cn" TEXT;
ALTER TABLE "ai_image_v2_plans" ADD COLUMN "subtitle_cn" TEXT;
ALTER TABLE "ai_image_v2_plans" ADD COLUMN "visual_presentation" TEXT;

-- CreateTable
CREATE TABLE "authorization_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'normal',
    "note" TEXT,
    "quota" INTEGER NOT NULL DEFAULT 50,
    "quota_max" INTEGER NOT NULL DEFAULT 50,
    "reset_hours" INTEGER NOT NULL DEFAULT 24,
    "reset_at" DATETIME,
    "user_id" TEXT,
    "created_by_admin_id" TEXT NOT NULL,
    "last_used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "authorization_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "authorization_codes_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ai_image_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "authorization_code_id" TEXT,
    "prompt_group_id" TEXT,
    "selected_fragment_ids" TEXT,
    "prompt_snapshot" TEXT NOT NULL,
    "user_prompt" TEXT,
    "negative_prompt_snapshot" TEXT,
    "config_snapshot" TEXT NOT NULL,
    "reference_images_snapshot" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "result_image_url" TEXT,
    "thumb_image_url" TEXT,
    "error_message" TEXT,
    "raw_response" TEXT,
    "provider" TEXT DEFAULT 'mock',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ai_image_tasks_prompt_group_id_fkey" FOREIGN KEY ("prompt_group_id") REFERENCES "ai_prompt_groups" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ai_image_tasks_authorization_code_id_fkey" FOREIGN KEY ("authorization_code_id") REFERENCES "authorization_codes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ai_image_tasks" ("config_snapshot", "created_at", "error_message", "id", "negative_prompt_snapshot", "prompt_group_id", "prompt_snapshot", "provider", "raw_response", "reference_images_snapshot", "result_image_url", "selected_fragment_ids", "status", "tenant_id", "thumb_image_url", "updated_at", "user_id", "user_prompt") SELECT "config_snapshot", "created_at", "error_message", "id", "negative_prompt_snapshot", "prompt_group_id", "prompt_snapshot", "provider", "raw_response", "reference_images_snapshot", "result_image_url", "selected_fragment_ids", "status", "tenant_id", "thumb_image_url", "updated_at", "user_id", "user_prompt" FROM "ai_image_tasks";
DROP TABLE "ai_image_tasks";
ALTER TABLE "new_ai_image_tasks" RENAME TO "ai_image_tasks";
CREATE INDEX "ai_image_tasks_tenant_id_user_id_authorization_code_id_created_at_idx" ON "ai_image_tasks"("tenant_id", "user_id", "authorization_code_id", "created_at" DESC);
CREATE TABLE "new_ai_image_v2_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "authorization_code_id" TEXT,
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
    "generating_image_plan_id" TEXT,
    CONSTRAINT "ai_image_v2_sessions_authorization_code_id_fkey" FOREIGN KEY ("authorization_code_id") REFERENCES "authorization_codes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ai_image_v2_sessions" ("active_product_image_index", "copied_id", "created_at", "editing_single_id", "expanded_single_id", "generating_image", "generating_image_plan_id", "goal", "id", "last_error", "mode", "output_height", "output_width", "preview_plan_id", "product_image_urls", "provider", "reference_image_urls", "selected_template_id", "status", "step", "tenant_id", "title", "updated_at", "user_id", "workspace_tab") SELECT "active_product_image_index", "copied_id", "created_at", "editing_single_id", "expanded_single_id", "generating_image", "generating_image_plan_id", "goal", "id", "last_error", "mode", "output_height", "output_width", "preview_plan_id", "product_image_urls", "provider", "reference_image_urls", "selected_template_id", "status", "step", "tenant_id", "title", "updated_at", "user_id", "workspace_tab" FROM "ai_image_v2_sessions";
DROP TABLE "ai_image_v2_sessions";
ALTER TABLE "new_ai_image_v2_sessions" RENAME TO "ai_image_v2_sessions";
CREATE INDEX "ai_image_v2_sessions_tenant_id_user_id_updated_at_idx" ON "ai_image_v2_sessions"("tenant_id", "user_id", "updated_at" DESC);
CREATE INDEX "ai_image_v2_sessions_tenant_id_user_id_authorization_code_id_updated_at_idx" ON "ai_image_v2_sessions"("tenant_id", "user_id", "authorization_code_id", "updated_at" DESC);
CREATE TABLE "new_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "authorization_code_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sessions_authorization_code_id_fkey" FOREIGN KEY ("authorization_code_id") REFERENCES "authorization_codes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_sessions" ("created_at", "expires_at", "id", "ip_address", "token", "updated_at", "user_agent", "user_id") SELECT "created_at", "expires_at", "id", "ip_address", "token", "updated_at", "user_agent", "user_id" FROM "sessions";
DROP TABLE "sessions";
ALTER TABLE "new_sessions" RENAME TO "sessions";
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "authorization_codes_code_key" ON "authorization_codes"("code");

-- CreateIndex
CREATE INDEX "authorization_codes_created_by_admin_id_created_at_idx" ON "authorization_codes"("created_by_admin_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "authorization_codes_user_id_idx" ON "authorization_codes"("user_id");
