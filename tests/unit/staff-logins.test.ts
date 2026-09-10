import { describe, expect, it } from "vitest";
import { STAFF_LOGINS } from "@/domain/auth/staff-logins";

describe("STAFF_LOGINS", () => {
  it("lista todos os acessos da equipe para o admin testar cada usuário", () => {
    expect(STAFF_LOGINS.map((access) => access.username)).toEqual([
      "admin",
      "dona",
      "gerente",
      "caixa",
      "garcom",
      "cozinha",
      "motoboy",
      "apoio",
    ]);
    expect(STAFF_LOGINS.every((access) => access.password.length >= 8)).toBe(true);
  });
});
