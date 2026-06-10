-- AlterTable
ALTER TABLE "ai_image_v2_detail_states" ADD COLUMN "active_generating_type" TEXT;
ALTER TABLE "ai_image_v2_detail_states" ADD COLUMN "failed_types" TEXT;
ALTER TABLE "ai_image_v2_detail_states" ADD COLUMN "generating_types" TEXT;
