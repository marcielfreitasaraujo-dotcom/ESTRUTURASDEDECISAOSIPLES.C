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
            <Link href="/loja/central-da-pizza">Cardápio</Link>
          </Button>
          <Button asChild>
            <Link href="/entrar">Entrar no PDV</Link>
          </Button>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 pb-20 pt-8">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Comanda IA</p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight md:text-6xl">
              PDV para a equipe. Cardápio para o cliente.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Admin, dono, caixa, garçom e cozinha trabalham no mesmo ponto de venda. Quem pede de
              casa ou da mesa usa a loja normal, sem login.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/entrar">Entrar no PDV</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/loja/central-da-pizza">Pedir agora</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3">
            <Link href="/entrar" className="rounded-2xl border bg-card p-5 transition hover:border-primary/50">
              <p className="text-xs uppercase tracking-wide text-primary">Equipe</p>
              <h2 className="mt-1 text-xl font-semibold">PDV completo</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Caixa, salão, cozinha, entregas e painel do dono — o mesmo sistema, cada um no seu papel.
              </p>
            </Link>
            <Link
              href="/loja/central-da-pizza"
              className="rounded-2xl border bg-card p-5 transition hover:border-primary/50"
            >
              <p className="text-xs uppercase tracking-wide text-primary">Cliente</p>
              <h2 className="mt-1 text-xl font-semibold">Pedido de casa ou da mesa</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Cardápio, pizza montada, retirada, entrega ou mesa. Sem cadastro da equipe.
              </p>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
