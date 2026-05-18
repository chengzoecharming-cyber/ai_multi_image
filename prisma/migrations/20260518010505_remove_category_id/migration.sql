/*
  Warnings:

  - You are about to drop the `ai_prompt_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `category_id` on the `ai_prompt_groups` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ai_prompt_categories";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ai_prompt_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prompt_content" TEXT NOT NULL,
    "final_prompt" TEXT,
    "negative_prompt" TEXT,
    "selected_fragment_ids" TEXT,
    "config_json" TEXT NOT NULL,
    "remark" TEXT,
    "cover_image_url" TEXT,
    "use_count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_ai_prompt_groups" ("config_json", "cover_image_url", "created_at", "final_prompt", "id", "last_used_at", "name", "negative_prompt", "prompt_content", "remark", "selected_fragment_ids", "tenant_id", "updated_at", "use_count", "user_id") SELECT "config_json", "cover_image_url", "created_at", "final_prompt", "id", "last_used_at", "name", "negative_prompt", "prompt_content", "remark", "selected_fragment_ids", "tenant_id", "updated_at", "use_count", "user_id" FROM "ai_prompt_groups";
DROP TABLE "ai_prompt_groups";
ALTER TABLE "new_ai_prompt_groups" RENAME TO "ai_prompt_groups";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
