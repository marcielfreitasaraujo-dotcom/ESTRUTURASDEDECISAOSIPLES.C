import Link from "next/link";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="dark flex min-h-screen flex-col bg-background text-foreground">
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
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 pb-20 pt-8">
        <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
              Gestão inteligente para restaurantes
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight md:text-6xl">
              Um sistema na nuvem. Três jeitos de trabalhar.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              O garçom no celular, o caixa no computador e você no painel da plataforma — o mesmo
              pedido, o mesmo cardápio, o mesmo estabelecimento.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/entrar">Entrar no sistema</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/loja/central-da-pizza">Cardápio do cliente</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3">
            {[
              ["Celular do garçom", "/garcom", "Abre mesa, lança pizza e envia para a cozinha. Instala como app."],
              ["Computador do caixa", "/caixa", "PDV: recebe pagamento, confirma pedido e controla a fila."],
              ["Admin da plataforma", "/admin", "Sua visão: pizzarias, uso, assinaturas e suporte."],
            ].map(([title, href, body]) => (
              <Link
                key={title}
                href={href}
                className="rounded-2xl border bg-card p-5 transition hover:border-primary/50"
              >
                <p className="text-xs uppercase tracking-wide text-primary">{href}</p>
                <h2 className="mt-1 text-xl font-semibold">{title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
