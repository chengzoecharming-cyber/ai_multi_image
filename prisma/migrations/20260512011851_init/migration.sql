-- CreateTable
CREATE TABLE "ai_prompt_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ai_prompt_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prompt_content" TEXT NOT NULL,
    "negative_prompt" TEXT,
    "config_json" TEXT NOT NULL,
    "remark" TEXT,
    "cover_image_url" TEXT,
    "use_count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ai_prompt_groups_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ai_prompt_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_prompt_group_references" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "group_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "image_name" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "reference_type" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_prompt_group_references_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "ai_prompt_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_image_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prompt_group_id" TEXT,
    "prompt_snapshot" TEXT NOT NULL,
    "config_snapshot" TEXT NOT NULL,
    "reference_images_snapshot" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "result_image_url" TEXT,
    "error_message" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ai_image_tasks_prompt_group_id_fkey" FOREIGN KEY ("prompt_group_id") REFERENCES "ai_prompt_groups" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
