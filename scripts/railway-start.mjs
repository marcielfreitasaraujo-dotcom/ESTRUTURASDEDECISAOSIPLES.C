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

console.log(`Comanda IA: migrate + start em 0.0.0.0:${port}`);

await migrateWithRetry();

const prisma = new PrismaClient();
try {
  const users = await prisma.user.count();
  if (users === 0) {
    console.log("Banco vazio: aplicando seed inicial (admin / Maciel.2004).");
    await run(bin("tsx"), ["prisma/seed.ts"], 120_000);
  }
} finally {
  await prisma.$disconnect();
}

const nextCli = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
console.log(`Subindo Next.js na porta ${port}`);
await run(process.execPath, [nextCli, "start", "--hostname", "0.0.0.0", "--port", port]);
