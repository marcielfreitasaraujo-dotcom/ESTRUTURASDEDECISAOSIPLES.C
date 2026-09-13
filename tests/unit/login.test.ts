import { describe, expect, it } from "vitest";
import { isEmailLogin, normalizeLogin, normalizeUsername } from "@/server/services/login";

describe("login identifier", () => {
  it("aceita usuário curto ou e-mail", () => {
    expect(normalizeLogin(" Admin ")).toBe("admin");
    expect(isEmailLogin("admin")).toBe(false);
    expect(isEmailLogin("xavier.y@example.org")).toBe(true);
    expect(normalizeUsername("Admin")).toBe("admin");
    expect(() => normalizeUsername("a")).toThrow();
  });
});
