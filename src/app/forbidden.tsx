export default function Forbidden() {
  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center">
        <p className="text-sm font-medium text-destructive">403</p>
        <h1 className="mt-2 text-2xl font-semibold">Acesso não autorizado.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área não faz parte da operação de caixa. Peça ao gerente se precisar de acesso.
        </p>
        <a href="/caixa" className="mt-4 inline-block text-sm text-primary underline">
          Voltar ao caixa
        </a>
      </div>
    </div>
  );
}