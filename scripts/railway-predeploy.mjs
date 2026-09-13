import { migrateWithRetry } from "./railway-cmd.mjs";

if (!process.env.DATABASE_URL) {
  console.log("Pré-deploy sem DATABASE_URL: seguindo. Ligue o Postgres e a variável no painel.");
  process.exit(0);
}

await migrateWithRetry();
