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
      ? "Usuário ou senha inválidos."
      : params.error === "invalid"
        ? "Informe o usuário e a senha."
        : undefined;

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader className="gap-4">
          <Brand />
          <CardTitle className="text-2xl font-semibold">PDV da equipe</CardTitle>
          <p className="text-sm text-muted-foreground">
            Acesso de admin, dono, caixa, garçom, cozinha e motoboy. O cliente pede pela loja, sem login.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <LoginForm error={error} />
          {process.env.NODE_ENV !== "production" ? (
            <div className="rounded-xl border p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Acessos de teste</p>
              <ul className="mt-2 space-y-1">
                <li>Admin: admin / Maciel.2004</li>
                <li>Dona: dona / CentralPizza!2026</li>
                <li>Gerente: gerente / Gerente!2026</li>
                <li>Caixa: caixa / Caixa!2026</li>
                <li>Garçom: garcom / Garcom!2026</li>
                <li>Cozinha: cozinha / Cozinha!2026</li>
                <li>Motoboy: motoboy / Entrega!2026</li>
                <li>Apoio: apoio / Staff!2026</li>
              </ul>
            </div>
          ) : null}
          <p className="text-center text-sm text-muted-foreground">
            Pedido de casa ou da mesa?{" "}
            <Link className="underline" href="/loja/central-da-pizza">
              Abrir cardápio
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
