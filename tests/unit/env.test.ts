import { afterEach, describe, expect, it } from "vitest";
import { missingRuntimeSecrets, publicAppUrl, resetEnvCache } from "@/lib/env";

const original = {
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  DEPLOY_PRIME_URL: process.env.DEPLOY_PRIME_URL,
  URL: process.env.URL,
};

afterEach(() => {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  resetEnvCache();
});

describe("env de deploy", () => {
  it("aponta a URL pública para o preview do Netlify quando BETTER_AUTH_URL falta", () => {
    delete process.env.BETTER_AUTH_URL;
    process.env.DEPLOY_PRIME_URL = "https://agent-preview--comandaia.netlify.app";
    expect(publicAppUrl()).toBe("https://agent-preview--comandaia.netlify.app");
  });

  it("lista DATABASE_URL e secret ausentes no runtime", () => {
    delete process.env.DATABASE_URL;
    delete process.env.BETTER_AUTH_SECRET;
    expect(missingRuntimeSecrets()).toEqual(["DATABASE_URL", "BETTER_AUTH_SECRET"]);
  });
});
