import { describe, expect, it } from "vitest";
import { buildFloorTables, normalizeTableCount, assertSalonTableNumber } from "@/domain/floor/tables";
import { resolveCashierPosView } from "@/domain/floor/cashier-view";

describe("buildFloorTables", () => {
  it("pinta a mesa ocupada e deixa as outras livres", () => {
    const tables = buildFloorTables(
      [
        {
          id: "o1",
          tableNumber: "7",
          publicCode: "1001",
          totalCents: 6500,
          paymentStatus: "PENDING",
        },
      ],
      8,
    );
    expect(tables).toHaveLength(8);
    expect(tables[6]).toMatchObject({ number: "7", status: "bill" });
    expect(tables.filter((table) => table.status === "free")).toHaveLength(7);
  });

  it("ignora pedido sem mesa e prefere a conta em aberto", () => {
    const tables = buildFloorTables(
      [
        { id: "balcao", tableNumber: null, publicCode: "1002", totalCents: 1000, paymentStatus: "PAID" },
        { id: "pago", tableNumber: "3", publicCode: "1003", totalCents: 2000, paymentStatus: "PAID" },
        { id: "conta", tableNumber: "3", publicCode: "1004", totalCents: 4000, paymentStatus: "PENDING" },
      ],
      4,
    );
    expect(tables[2]).toMatchObject({ number: "3", status: "bill", order: { id: "conta" } });
  });

  it("respeita a quantidade de mesas do gerente", () => {
    expect(buildFloorTables([], 12)).toHaveLength(12);
    expect(normalizeTableCount(0)).toBe(1);
    expect(normalizeTableCount(999)).toBe(80);
    expect(assertSalonTableNumber("4", 10)).toBe("4");
    expect(() => assertSalonTableNumber("12", 8)).toThrow(/1 a 8/);
  });
});

describe("resolveCashierPosView", () => {
  const tables = buildFloorTables(
    [{ id: "o1", tableNumber: "2", publicCode: "1001", totalCents: 2000, paymentStatus: "PENDING" }],
    4,
  );

  it("abre a comanda ao tocar numa mesa ocupada", () => {
    expect(resolveCashierPosView({ mesa: "2", tables })).toMatchObject({
      kind: "open-table",
      selectedTable: "2",
    });
  });

  it("mostra mesas livres na nova venda", () => {
    const view = resolveCashierPosView({ venda: "1", tables });
    expect(view.kind).toBe("new-sale");
    if (view.kind !== "new-sale") throw new Error("expected new-sale");
    expect(view.freeTables.map((table) => table.number)).toEqual(["1", "3", "4"]);
  });

  it("preenche a mesa livre escolhida no mapa", () => {
    expect(resolveCashierPosView({ mesa: "3", venda: "1", tables })).toMatchObject({
      kind: "new-sale",
      selectedTable: "3",
    });
  });
});
