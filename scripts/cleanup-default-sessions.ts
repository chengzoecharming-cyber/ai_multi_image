/**
 * Cleanup script: remove all legacy V2 sessions and prompt-groups
 * that were created with userId="default" / tenantId="default"
 * before real authentication was introduced.
 *
 * Run: npx tsx scripts/cleanup-default-sessions.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenantId = "default";
  const userId = "default";

  // Delete V2 sessions
  const v2Sessions = await prisma.aiImageV2Session.deleteMany({
    where: { tenantId, userId },
  });
  console.log(`Deleted ${v2Sessions.count} V2 sessions (default/default)`);

  // Delete prompt groups
  const promptGroups = await prisma.aiPromptGroup.deleteMany({
    where: { tenantId, userId },
  });
  console.log(`Deleted ${promptGroups.count} prompt groups (default/default)`);

  // Delete tasks
  const tasks = await prisma.aiImageTask.deleteMany({
    where: { tenantId, userId },
  });
  console.log(`Deleted ${tasks.count} tasks (default/default)`);

  console.log("Cleanup complete.");
}

main()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
