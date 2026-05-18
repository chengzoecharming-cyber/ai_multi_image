-- AlterTable
ALTER TABLE "ai_image_tasks" ADD COLUMN "negative_prompt_snapshot" TEXT;
ALTER TABLE "ai_image_tasks" ADD COLUMN "provider" TEXT DEFAULT 'mock';
ALTER TABLE "ai_image_tasks" ADD COLUMN "raw_response" TEXT;
ALTER TABLE "ai_image_tasks" ADD COLUMN "selected_fragment_ids" TEXT;
ALTER TABLE "ai_image_tasks" ADD COLUMN "user_prompt" TEXT;

-- AlterTable
ALTER TABLE "ai_prompt_groups" ADD COLUMN "final_prompt" TEXT;
ALTER TABLE "ai_prompt_groups" ADD COLUMN "selected_fragment_ids" TEXT;
