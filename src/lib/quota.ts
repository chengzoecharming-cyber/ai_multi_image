import { prisma } from "./db";

export interface QuotaCheckResult {
  ok: boolean;
  remaining: number;
  resetHours: number;
  resetAt: Date | null;
  hoursUntilReset: number;
}

function addHours(date: Date, hours: number): Date {
  const d = new Date(date);
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  return d;
}

/**
 * 检查并自动重置用户配额。
 * 如果 quotaResetAt 已过期（或为空），将配额恢复到 imageQuotaMax 并更新 resetAt。
 */
export async function checkAndResetQuota(userId: string): Promise<QuotaCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      imageQuota: true,
      imageQuotaMax: true,
      quotaResetAt: true,
      quotaResetHours: true,
    },
  });

  if (!user) {
    return { ok: false, remaining: 0, resetHours: 24, resetAt: null, hoursUntilReset: 0 };
  }

  const now = new Date();
  let resetAt = user.quotaResetAt;
  let quota = user.imageQuota;
  const resetHours = user.quotaResetHours ?? 24;
  const quotaMax = user.imageQuotaMax ?? 9999;

  // 自动重置：resetAt 为空 或 已过期
  if (!resetAt || now >= resetAt) {
    quota = quotaMax;
    resetAt = addHours(now, resetHours);
    await prisma.user.update({
      where: { id: userId },
      data: {
        imageQuota: quota,
        quotaResetAt: resetAt,
      },
    });
  }

  const msUntilReset = resetAt.getTime() - now.getTime();
  const hoursUntilReset = Math.max(0, Math.ceil(msUntilReset / (1000 * 60 * 60)));

  return {
    ok: quota > 0,
    remaining: quota,
    resetHours,
    resetAt,
    hoursUntilReset,
  };
}

/**
 * 扣除配额。应在生成成功后调用。
 */
export async function deductQuota(userId: string, count: number): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { imageQuota: true },
  });

  if (!user) return 0;

  const newQuota = Math.max(0, user.imageQuota - count);
  await prisma.user.update({
    where: { id: userId },
    data: { imageQuota: newQuota },
  });

  return newQuota;
}

/**
 * 配额不足时的统一错误信息
 */
export function quotaErrorMessage(hoursUntilReset: number): string {
  return `配额已耗尽，请在 ${hoursUntilReset} 小时后重置后重试`;
}
