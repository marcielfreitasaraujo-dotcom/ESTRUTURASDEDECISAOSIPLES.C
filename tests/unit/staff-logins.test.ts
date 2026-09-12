import { describe, expect, it } from "vitest";
import { STAFF_LOGINS } from "@/domain/auth/staff-logins";

describe("STAFF_LOGINS", () => {
  it("lista admin, gerente, caixa e os logins mobile", () => {
    expect(STAFF_LOGINS.map((access) => access.username)).toEqual([
      "admin",
      "gerente",
      "caixa",
      "garcom",
      "motoboy",
    ]);
    expect(STAFF_LOGINS.every((access) => access.password.length >= 8)).toBe(true);
  });
});
