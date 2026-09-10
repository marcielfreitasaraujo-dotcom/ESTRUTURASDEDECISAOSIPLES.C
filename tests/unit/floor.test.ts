import { describe, expect, it } from "vitest";
import { buildFloorTables } from "@/domain/floor/tables";

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
});
