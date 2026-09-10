import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bin = (name) => path.join(root, "node_modules", ".bin", name);

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(command)} ${args.join(" ")} saiu com código ${code}`));
    });
  });
}

const port = process.env.PORT || "3000";

await run(bin("prisma"), ["migrate", "deploy"]);

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
