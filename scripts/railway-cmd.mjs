import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const bin = (name) => path.join(root, "node_modules", ".bin", name);

export function run(command, args, timeoutMs = 0) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    const timer =
      timeoutMs > 0
        ? setTimeout(() => {
            child.kill("SIGKILL");
            reject(new Error(`${path.basename(command)} excedeu ${timeoutMs}ms`));
          }, timeoutMs)
        : null;
    child.on("error", (error) => {
      if (timer) clearTimeout(timer);
      reject(error);
    });
    child.on("exit", (code) => {
      if (timer) clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(command)} ${args.join(" ")} saiu com código ${code}`));
    });
  });
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function migrateWithRetry(tries = 8) {
  let lastError;
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      await run(bin("prisma"), ["migrate", "deploy"], 20_000);
      return;
    } catch (error) {
      lastError = error;
      console.log(`prisma migrate deploy: tentativa ${attempt}/${tries} (${error.message})`);
      if (attempt < tries) await sleep(2000);
    }
  }
  throw lastError;
}
