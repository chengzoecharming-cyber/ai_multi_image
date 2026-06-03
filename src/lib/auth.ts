import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    // 关闭邮箱验证（内部工具，不需要邮件服务）
    requireEmailVerification: false,
  },
  // 扩展 User 模型：增加 role / imageQuota / quotaResetAt / quotaResetHours 字段
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        required: true,
      },
      imageQuota: {
        type: "number",
        defaultValue: 9999,
        required: true,
      },
      imageQuotaMax: {
        type: "number",
        defaultValue: 9999,
        required: true,
      },
      quotaResetAt: {
        type: "date",
        required: false,
      },
      quotaResetHours: {
        type: "number",
        defaultValue: 24,
        required: true,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 天
    updateAge: 60 * 60 * 24, // 1 天后刷新
  },
});

export type SessionUser = typeof auth.$Infer.Session.user;
