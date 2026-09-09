import Link from "next/link";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <Brand />
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/entrar">Entrar</Link>
          </Button>
          <Button asChild>
            <Link href="/cadastrar">Começar</Link>
          </Button>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 pb-20 pt-10">
        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-medium text-primary">SaaS multi-tenant para pizzarias</p>
            <h1 className="font-heading mt-3 max-w-xl text-4xl leading-tight md:text-6xl">
              O sistema que a pizzaria usa no balcão, na cozinha e no celular do cliente.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Cardápio digital, montagem de pizza, pedidos, KDS e gestão do estabelecimento —
              com isolamento real entre pizzarias desde a primeira linha.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/cadastrar">Abrir minha pizzaria</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/loja/central-da-pizza">Ver cardápio piloto</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Pedido #1042</p>
            <h2 className="font-heading mt-2 text-2xl">Pizza Grande</h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li>1/2 Calabresa</li>
              <li>1/2 Frango com Catupiry</li>
              <li>Borda Catupiry</li>
              <li>Coca-Cola 2L</li>
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">Observação: pouco queijo</p>
            <div className="mt-6 flex gap-2">
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs text-primary">Preparando</span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs">8 min</span>
            </div>
          </div>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Cardápio público", "Mobile-first, SEO e montagem de pizza com preço calculado no servidor."],
            ["Operação", "Kanban de pedidos, KDS para tablet e histórico de status auditado."],
            ["Plataforma", "Multi-tenant, RBAC, assinaturas, feature flags e painel super admin."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-2xl border bg-card p-6">
              <h2 className="font-heading text-xl">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
