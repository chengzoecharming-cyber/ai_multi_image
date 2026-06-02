import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_TENANT_ID = "default";
const DEFAULT_USER_ID = "default";

function hasFlag(flag) {
  return process.argv.includes(flag);
}

async function main() {
  const dryRun = !hasFlag("--execute");
  const tenantId = process.env.CLEANUP_TENANT_ID || DEFAULT_TENANT_ID;
  const userId = process.env.CLEANUP_USER_ID || DEFAULT_USER_ID;

  const [sessionCount, planCount, imageCount, detailCount] = await Promise.all([
    prisma.aiImageV2Session.count({ where: { tenantId, userId } }),
    prisma.aiImageV2Plan.count({ where: { tenantId, userId } }),
    prisma.aiImageV2GeneratedImage.count({ where: { tenantId, userId } }),
    prisma.aiImageV2DetailState.count({ where: { tenantId, userId } }),
  ]);

  console.log(
    JSON.stringify(
      {
        dryRun,
        tenantId,
        userId,
        counts: {
          sessions: sessionCount,
          plans: planCount,
          images: imageCount,
          detailStates: detailCount,
        },
      },
      null,
      2
    )
  );

  if (dryRun) {
    console.log("\nDry run only. Re-run with --execute to delete these records.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.aiImageV2DetailState.deleteMany({ where: { tenantId, userId } });
    await tx.aiImageV2GeneratedImage.deleteMany({ where: { tenantId, userId } });
    await tx.aiImageV2Plan.deleteMany({ where: { tenantId, userId } });
    await tx.aiImageV2Session.deleteMany({ where: { tenantId, userId } });
  });

  console.log("\nCleanup completed.");
}

main()
  .catch((error) => {
    console.error("Cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
