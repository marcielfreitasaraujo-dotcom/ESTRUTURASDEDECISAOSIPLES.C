import { PrismaClient } from "@prisma/client";
import { bin, migrateWithRetry, run } from "./railway-cmd.mjs";

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL. No Railway: Variáveis → Add Variable Reference → Postgres → DATABASE_URL.");
  process.exit(1);
}

const port = process.env.PORT || "3000";

await migrateWithRetry();

const prisma = new PrismaClient();
try {
  const users = await prisma.user.count();
  if (users === 0) {
    console.log("Banco vazio: aplicando seed inicial (admin / Maciel.2004).");
    await run(bin("tsx"), ["prisma/seed.ts"]);
  }
} finally {
  await prisma.$disconnect();
}

await run(bin("next"), ["start", "--hostname", "0.0.0.0", "--port", port]);
