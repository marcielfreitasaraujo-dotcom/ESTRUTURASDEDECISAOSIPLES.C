import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const bin = (name) => path.join(root, "node_modules", ".bin", name);

export function run(command, args) {
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

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function migrateWithRetry(tries = 20) {
  let lastError;
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      await run(bin("prisma"), ["migrate", "deploy"]);
      return;
    } catch (error) {
      lastError = error;
      console.log(`prisma migrate deploy: tentativa ${attempt}/${tries}`);
      if (attempt < tries) await sleep(2000);
    }
  }
  throw lastError;
}
