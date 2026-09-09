import Link from "next/link";
import { Brand } from "@/components/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth-forms";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error =
    params.error === "credentials"
      ? "E-mail ou senha inválidos."
      : params.error === "invalid"
        ? "Informe um e-mail e senha válidos."
        : undefined;

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader className="gap-4">
          <Brand />
          <CardTitle className="text-2xl font-semibold">Entrar no Comanda IA</CardTitle>
          <p className="text-sm text-muted-foreground">
            O mesmo login na nuvem. O sistema abre o app certo: plataforma, caixa ou garçom.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <LoginForm error={error} />
          {process.env.NODE_ENV !== "production" ? (
            <div className="rounded-xl border p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Acessos de teste</p>
              <ul className="mt-2 space-y-1">
                <li>Plataforma: xavier.y@example.org</li>
                <li>Dona / gestão: maria.s@example.com</li>
                <li>Caixa: marco.r@example.org</li>
                <li>Garçom: paula.r@example.org</li>
              </ul>
            </div>
          ) : null}
          <p className="text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link className="underline" href="/cadastrar">
              Criar restaurante
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
