import { afterEach, describe, expect, it } from "vitest";
import { getAppBuildId } from "@/lib/app-build";

const keys = ["RAILWAY_GIT_COMMIT_SHA", "COMMIT_REF", "VERCEL_GIT_COMMIT_SHA", "APP_VERSION"] as const;
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    const value = original[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("getAppBuildId", () => {
  it("usa o commit do Railway quando existe", () => {
    process.env.RAILWAY_GIT_COMMIT_SHA = "abc123def";
    expect(getAppBuildId()).toBe("abc123def");
  });

  it("cai na versão do app se não houver commit", () => {
    delete process.env.RAILWAY_GIT_COMMIT_SHA;
    delete process.env.COMMIT_REF;
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    process.env.APP_VERSION = "0.2.0";
    expect(getAppBuildId()).toBe("0.2.0");
  });
});
