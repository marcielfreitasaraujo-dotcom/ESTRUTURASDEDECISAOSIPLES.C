"use client";

import { useMemo } from "react";
import { formatBRL } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Report = {
  from: string;
  to: string;
  orders: number;
  cancelled: number;
  salesCents: number;
  averageTicketCents: number;
  byMethod: { method: string; label: string; cents: number }[];
  topProducts: { name: string; quantity: number; cents: number }[];
  leastProducts: { name: string; quantity: number; cents: number }[];
  rows: {
    publicCode: string;
    createdAt: string;
    customerName: string;
    channel: string;
    payment: string;
    status: string;
    totalCents: number;
  }[];
};

export function ReportsPanel({ report }: { report: Report }) {
  const csv = useMemo(() => {
    const header = "pedido,data,cliente,canal,pagamento,status,total";
    const lines = report.rows.map((row) =>
      [row.publicCode, row.createdAt, row.customerName, row.channel, row.payment, row.status, (row.totalCents / 100).toFixed(2)].join(","),
    );
    return [header, ...lines].join("\n");
  }, [report.rows]);

  function downloadCsv() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "relatorio-vendas.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function printPdf() {
    window.print();
  }

  return (
    <div className="grid gap-6 print:text-black">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Vendas do mês atual, calculadas dos pedidos reais.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button type="button" variant="outline" onClick={downloadCsv}>
            Exportar CSV
          </Button>
          <Button type="button" variant="outline" onClick={printPdf}>
            Exportar PDF
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl">{formatBRL(report.salesCents)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl">{report.orders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Ticket médio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl">{formatBRL(report.averageTicketCents)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Cancelamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl">{report.cancelled}</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Formas de pagamento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {report.byMethod.map((item) => (
              <div key={item.method} className="flex justify-between">
                <span>{item.label}</span>
                <span>{formatBRL(item.cents)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Produtos mais vendidos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {report.topProducts.map((item) => (
              <div key={item.name} className="flex justify-between gap-3">
                <span>
                  {item.name} · {item.quantity}x
                </span>
                <span>{formatBRL(item.cents)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Vendas do período</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="p-2">Pedido</th>
                <th className="p-2">Quando</th>
                <th className="p-2">Cliente</th>
                <th className="p-2">Canal</th>
                <th className="p-2">Pagamento</th>
                <th className="p-2">Status</th>
                <th className="p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={row.publicCode + row.createdAt} className="border-t">
                  <td className="p-2">#{row.publicCode}</td>
                  <td className="p-2 whitespace-nowrap">{new Date(row.createdAt).toLocaleString("pt-BR")}</td>
                  <td className="p-2">{row.customerName}</td>
                  <td className="p-2">{row.channel}</td>
                  <td className="p-2">{row.payment}</td>
                  <td className="p-2">{row.status}</td>
                  <td className="p-2">{formatBRL(row.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
