import type { FloorTable } from "@/domain/floor/tables";

export type CashierPosView =
  | { kind: "home" }
  | { kind: "new-sale"; selectedTable?: string; freeTables: FloorTable[] }
  | { kind: "open-table"; selectedTable: string; table: FloorTable };

export function resolveCashierPosView(input: {
  mesa?: string;
  venda?: string;
  tables: FloorTable[];
}): CashierPosView {
  const selectedTable = input.mesa?.trim() || "";
  const table = selectedTable ? input.tables.find((item) => item.number === selectedTable) : undefined;
  const freeTables = input.tables.filter((item) => item.status === "free");

  if (table && table.status !== "free") {
    return { kind: "open-table", selectedTable, table };
  }

  if (input.venda === "1" || table?.status === "free") {
    return {
      kind: "new-sale",
      selectedTable: table?.number,
      freeTables,
    };
  }

  return { kind: "home" };
}
