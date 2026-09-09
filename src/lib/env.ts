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

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Variáveis de ambiente inválidas: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}
