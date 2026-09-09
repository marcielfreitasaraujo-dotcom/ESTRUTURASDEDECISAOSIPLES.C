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

let cached: Env | undefined;

// During `next build`, Next.js imports route modules (e.g. the Better Auth
// catch-all route) to collect page data. This only inspects the module
// shape and never issues a real request, so the runtime secrets below
// don't need to be real yet — Netlify injects the actual values into the
// deployed function's process at request time. Falling back here keeps the
// build from failing when these secrets are configured for the runtime
// environment but not for the build environment.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const buildPhaseFallbacks = {
  DATABASE_URL: "postgresql://build:build@localhost:5432/build_phase_placeholder",
  BETTER_AUTH_SECRET: "build-phase-placeholder-secret-0000000000000000",
  BETTER_AUTH_URL: "http://localhost:3000",
};

export function getEnv(): Env {
  if (cached) return cached;
  const source = isBuildPhase
    ? { ...buildPhaseFallbacks, ...process.env }
    : process.env;
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Variáveis de ambiente inválidas: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}
