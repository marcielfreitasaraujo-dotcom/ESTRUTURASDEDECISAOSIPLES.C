import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  APP_NAME: z.string().default("Comanda IA"),
  APP_VERSION: z.string().default("0.1.0"),
  SEED_SUPER_ADMIN_EMAIL: z.string().email().optional(),
  SEED_SUPER_ADMIN_USERNAME: z.string().min(2).optional(),
  SEED_SUPER_ADMIN_PASSWORD: z.string().min(8).optional(),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  PAYMENT_SECRET_KEY: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  EMAIL_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const BUILD_PLACEHOLDERS = {
  DATABASE_URL: "postgresql://build:build@localhost:5432/build_phase_placeholder",
  BETTER_AUTH_SECRET: "build-phase-placeholder-secret-0000000000000000",
  BETTER_AUTH_URL: "http://localhost:3000",
};

let cached: Env | undefined;

export function publicAppUrl() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  return process.env.DEPLOY_PRIME_URL || process.env.URL || "http://localhost:3000";
}

export function missingRuntimeSecrets() {
  const missing: string[] = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32) {
    missing.push("BETTER_AUTH_SECRET");
  }
  return missing;
}

export function isInfraError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /DATABASE_URL|Variáveis de ambiente|Can't reach database|P1001|P1017|P1010|Environment variable not found|ECONNREFUSED|ENOTFOUND/i.test(
    message,
  );
}

function envSource() {
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
  return {
    ...(isBuildPhase || missingRuntimeSecrets().length > 0 ? BUILD_PLACEHOLDERS : {}),
    ...process.env,
    BETTER_AUTH_URL: publicAppUrl(),
  };
}

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(envSource());
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Variáveis de ambiente inválidas: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function resetEnvCache() {
  cached = undefined;
}
