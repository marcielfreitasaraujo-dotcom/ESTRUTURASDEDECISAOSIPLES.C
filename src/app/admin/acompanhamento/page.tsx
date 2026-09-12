import { savePlatformTrackingFlagAction, sendPlatformTrackingTestAction } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ds/page-header";
import { prisma } from "@/lib/db";

export default async function AdminTrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const [flag, tenants, recent] = await Promise.all([
    prisma.featureFlag.findFirst({
      where: { key: "order_tracking", scope: "platform" },
    }),
    prisma.tenant.findMany({
      where: { status: { in: ["ACTIVE", "ONBOARDING"] } },
      select: { id: true, name: true, trackingWhatsappNumber: true },
      orderBy: { name: "asc" },
    }),
    prisma.whatsAppDispatch.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { tenant: { select: { name: true } } },
    }),
  ]);
  const enabled = flag?.enabled ?? true;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Acompanhamento de pedidos"
        description="Flag global, teste de WhatsApp e log dos disparos. O número de teste fica na configuração de cada loja."
      />

      {error ? <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}
      {ok === "whatsapp-teste" ? (
        <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Mensagem de teste gerada. Confira o log abaixo.
        </p>
      ) : null}

      <section className="grid gap-3 rounded-xl border p-4">
        <h2 className="font-medium">Flag global</h2>
        <p className="text-sm text-muted-foreground">
          Desligar `order_tracking` esconde o acompanhamento para todas as lojas, mesmo com a opção local ligada.
        </p>
        <form action={savePlatformTrackingFlagAction} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="order_tracking" defaultChecked={enabled} />
            Acompanhamento ligado na plataforma
          </label>
          <Button type="submit">Salvar flag</Button>
        </form>
      </section>

      <section className="grid gap-3 rounded-xl border p-4">
        <h2 className="font-medium">Teste de WhatsApp</h2>
        <p className="text-sm text-muted-foreground">
          Usa o número configurado na loja. Sem número salvo, o teste não envia.
        </p>
        <form action={sendPlatformTrackingTestAction} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="grid gap-2 text-sm">
            Loja
            <select name="tenantId" required className="h-10 rounded-lg border bg-background px-3">
              <option value="">Escolha</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                  {tenant.trackingWhatsappNumber ? "" : " · sem número"}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="outline">
            Enviar mensagem de teste
          </Button>
        </form>
      </section>

      <section className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Quando</th>
              <th className="p-3">Loja</th>
              <th className="p-3">Evento</th>
              <th className="p-3">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={4}>
                  Nenhum disparo ainda.
                </td>
              </tr>
            ) : (
              recent.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                    {row.createdAt.toLocaleString("pt-BR")}
                  </td>
                  <td className="p-3">{row.tenant.name}</td>
                  <td className="p-3">{row.event}</td>
                  <td className="p-3">
                    <Badge variant={row.status === "SENT" ? "success" : row.status === "FAILED" ? "destructive" : "secondary"}>
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
