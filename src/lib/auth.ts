import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { sendTransactionalEmail } from "@/server/email";
import { writeAudit } from "@/server/audit";

const env = getEnv();

export const auth = betterAuth({
  appName: env.APP_NAME,
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    env.BETTER_AUTH_URL,
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
    process.env.DEPLOY_URL,
    "https://*.netlify.app",
  ].filter((value): value is string => Boolean(value)),
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendTransactionalEmail({
        to: user.email,
        subject: "Redefinição de senha — Comanda IA",
        text: `Olá ${user.name},\n\nPara redefinir sua senha, acesse:\n${url}\n\nSe você não pediu isso, ignore este e-mail.`,
      });
    },
  },
  user: {
    additionalFields: {
      platformRole: {
        type: ["SUPER_ADMIN", "PLATFORM_ADMIN", "USER"],
        required: false,
        defaultValue: "USER",
        input: false,
      },
    },
  },
  session: {
    additionalFields: {
      activeTenantId: {
        type: "string",
        required: false,
        input: false,
      },
    },
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 12,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  rateLimit: {
    enabled: env.NODE_ENV === "production",
    window: 60,
    max: 20,
  },
  advanced: {
    cookiePrefix: "comanda",
    useSecureCookies: env.NODE_ENV === "production",
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const membership = await prisma.tenantMembership.findFirst({
            where: { userId: session.userId },
            orderBy: { createdAt: "asc" },
          });
          return {
            data: {
              ...session,
              activeTenantId: membership?.tenantId ?? null,
            },
          };
        },
      },
    },
    user: {
      create: {
        after: async (user) => {
          await writeAudit({
            action: "CREATE",
            entity: "User",
            entityId: user.id,
            userId: user.id,
            metadata: { email: user.email },
          });
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
