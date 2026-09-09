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
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Brand />
          <CardTitle className="font-heading text-2xl">Entrar no Forno</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <LoginForm error={error} />
          <p className="text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link className="underline" href="/cadastrar">
              Criar pizzaria
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
