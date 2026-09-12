import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { bin, migrateWithRetry, run } from "./railway-cmd.mjs";

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL. No Railway: Variáveis → Add Variable Reference → Postgres → DATABASE_URL.");
  process.exit(1);
}

const port = String(process.env.PORT || "3000");
process.env.HOSTNAME = "0.0.0.0";
process.env.PORT = port;

const build =
  process.env.RAILWAY_GIT_COMMIT_SHA ||
  process.env.NEXT_PUBLIC_APP_BUILD ||
  process.env.COMMIT_REF ||
  "dev";
console.log(`Comanda IA: migrate + seed + start em 0.0.0.0:${port} (build ${build.slice(0, 12)})`);

await migrateWithRetry();

const prisma = new PrismaClient();
try {
  const users = await prisma.user.count();
  console.log(
    users === 0
      ? "Banco vazio: aplicando seed inicial (admin / Maciel.2004)."
      : "Atualizando seed do cardápio da Central da Pizza (upsert).",
  );
  await run(bin("tsx"), ["prisma/seed.ts"], 180_000);
} finally {
  await prisma.$disconnect();
}

const nextCli = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
console.log(`Subindo Next.js na porta ${port}`);
await run(process.execPath, [nextCli, "start", "--hostname", "0.0.0.0", "--port", port]);
