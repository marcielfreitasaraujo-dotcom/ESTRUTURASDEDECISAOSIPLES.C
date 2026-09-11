import { afterEach, describe, expect, it } from "vitest";
import { getAppBuildId, isStaleClientBuild, resolveDeployBuildId } from "@/lib/app-build";

const keys = [
  "NEXT_PUBLIC_APP_BUILD",
  "RAILWAY_GIT_COMMIT_SHA",
  "COMMIT_REF",
  "VERCEL_GIT_COMMIT_SHA",
  "APP_VERSION",
] as const;
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    const value = original[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("resolveDeployBuildId", () => {
  it("usa o commit do Railway quando existe", () => {
    delete process.env.NEXT_PUBLIC_APP_BUILD;
    process.env.RAILWAY_GIT_COMMIT_SHA = "abc123def";
    expect(resolveDeployBuildId()).toBe("abc123def");
  });

  it("fica vazio quando o ambiente de build não tem commit", () => {
    delete process.env.RAILWAY_GIT_COMMIT_SHA;
    delete process.env.COMMIT_REF;
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    delete process.env.APP_VERSION;
    expect(resolveDeployBuildId()).toBe("");
  });
});

describe("getAppBuildId", () => {
  it("usa o build injetado no deploy", () => {
    process.env.NEXT_PUBLIC_APP_BUILD = "deploy-sha";
    process.env.RAILWAY_GIT_COMMIT_SHA = "other";
    expect(getAppBuildId()).toBe("deploy-sha");
  });

  it("usa o commit do Railway quando existe", () => {
    delete process.env.NEXT_PUBLIC_APP_BUILD;
    process.env.RAILWAY_GIT_COMMIT_SHA = "abc123def";
    expect(getAppBuildId()).toBe("abc123def");
  });

  it("não usa APP_VERSION: 0.1.0 nunca muda entre deploys", () => {
    delete process.env.NEXT_PUBLIC_APP_BUILD;
    delete process.env.RAILWAY_GIT_COMMIT_SHA;
    delete process.env.COMMIT_REF;
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    process.env.APP_VERSION = "0.1.0";
    expect(getAppBuildId()).toBe("dev");
  });
});

describe("isStaleClientBuild", () => {
  it("detecta atalho com HTML antigo", () => {
    expect(isStaleClientBuild({ live: "novo", html: "antigo" })).toBe(true);
    expect(isStaleClientBuild({ live: "igual", html: "igual", baked: "igual", previous: "igual" })).toBe(false);
  });

  it("recarrega quando o atalho ainda guarda 0.1.0 e o servidor já tem o commit", () => {
    expect(isStaleClientBuild({ live: "4497159abc", previous: "0.1.0" })).toBe(true);
  });
});
