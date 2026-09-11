import Link from "next/link";

export default function AjudaPage() {
  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <div>
        <h1 className="font-heading text-3xl">Ajuda</h1>
        <p className="text-sm text-muted-foreground">Atalhos e caminhos rápidos do painel do estabelecimento.</p>
      </div>
      <ul className="grid gap-2 text-sm">
        <li>
          <kbd className="rounded bg-muted px-1.5 py-0.5">Ctrl</kbd> + <kbd className="rounded bg-muted px-1.5 py-0.5">K</kbd> busca global
        </li>
        <li>
          <kbd className="rounded bg-muted px-1.5 py-0.5">Ctrl</kbd> + <kbd className="rounded bg-muted px-1.5 py-0.5">P</kbd> novo pedido
        </li>
        <li>
          <kbd className="rounded bg-muted px-1.5 py-0.5">Ctrl</kbd> + <kbd className="rounded bg-muted px-1.5 py-0.5">M</kbd> mesas
        </li>
        <li>
          <kbd className="rounded bg-muted px-1.5 py-0.5">Ctrl</kbd> + <kbd className="rounded bg-muted px-1.5 py-0.5">F</kbd> financeiro
        </li>
      </ul>
      <p className="text-sm">
        Cardápio digital: use o menu Cardápio. PDV: <Link className="underline" href="/caixa">abrir caixa</Link>.
      </p>
    </div>
  );
}
