import { describe, expect, it } from "vitest";
import { getStoreStatus } from "@/domain/hours/store-status";

describe("horário da loja", () => {
  it("fica aberta 24 horas com 00:00 às 23:59", () => {
    const hours = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      opensAt: "00:00",
      closesAt: "23:59",
      closed: false,
    }));
    const morning = getStoreStatus(hours, new Date("2026-09-12T14:00:00.000Z"));
    expect(morning.open).toBe(true);
    expect(morning.nextChange).toBe("24 horas");
  });

  it("fecha fora da janela normal", () => {
    const hours = [{ weekday: 6, opensAt: "18:00", closesAt: "23:30", closed: false }];
    const afternoon = getStoreStatus(hours, new Date("2026-09-12T16:00:00.000Z"));
    expect(afternoon.open).toBe(false);
  });
});
