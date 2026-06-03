import { hashPassword } from "@better-auth/utils/password";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  }
  if (password.length < 6) {
    throw new Error("ADMIN_PASSWORD must be at least 6 characters");
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: "admin",
      emailVerified: true,
      imageQuota: 9999,
      imageQuotaMax: 9999,
      quotaResetHours: 24,
    },
    create: {
      name,
      email,
      emailVerified: true,
      role: "admin",
      imageQuota: 9999,
      imageQuotaMax: 9999,
      quotaResetHours: 24,
    },
    select: { id: true, email: true },
  });

  const account = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
    select: { id: true },
  });

  if (account) {
    await prisma.account.update({
      where: { id: account.id },
      data: { accountId: user.id, password: hashed },
    });
  } else {
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: hashed,
      },
    });
  }

  console.log(`Admin ensured: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
