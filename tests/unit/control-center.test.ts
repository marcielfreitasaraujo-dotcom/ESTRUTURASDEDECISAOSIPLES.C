import { describe, expect, it } from "vitest";
import { greetingForHour, percentDelta, rangeStart } from "@/domain/dashboard/control-center";
import { TENANT_ROLE_LABELS } from "@/domain/rbac/labels";

describe("centro de controle", () => {
  it("calcula variação e saudação", () => {
    expect(percentDelta(225, 200)).toBe(12.5);
    expect(percentDelta(100, 0)).toBe(100);
    expect(percentDelta(0, 0)).toBe(0);
    expect(greetingForHour(8, "Carlos Souza")).toBe("Bom dia, Carlos.");
    expect(greetingForHour(19, "Maria")).toBe("Boa noite, Maria.");
  });

  it("distingue proprietário e gerente só no rótulo", () => {
    expect(TENANT_ROLE_LABELS.OWNER).toBe("Proprietário");
    expect(TENANT_ROLE_LABELS.MANAGER).toBe("Gerente");
  });

  it("recorta o período do gráfico", () => {
    const now = new Date("2026-09-11T15:00:00");
    expect(rangeStart("month", now).getDate()).toBe(1);
    expect(rangeStart("today", now).getHours()).toBe(0);
  });
});
