import Link from "next/link";
import { Brand } from "@/components/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth-forms";
import { STAFF_LOGINS } from "@/domain/auth/staff-logins";
import { missingRuntimeSecrets } from "@/lib/env";
import { getAppBuildId } from "@/lib/app-build";

export const dynamic = "force-dynamic";

const CONFIG_ERROR =
  "O site ainda não tem banco de dados. No Netlify, abra Variáveis ambientais e cadastre DATABASE_URL, BETTER_AUTH_SECRET e BETTER_AUTH_URL.";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const needsConfig = missingRuntimeSecrets().length > 0;
  const error =
    needsConfig || params.error === "config"
      ? CONFIG_ERROR
      : params.error === "credentials"
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
            Acesso de admin, gerente, caixa, garçom e motoboy. O cliente pede pela loja, sem login.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <LoginForm error={error} />
          <div className="rounded-xl border p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Acessos da equipe</p>
            <p className="mt-1">Entre com cada um para ver a tela daquele usuário.</p>
            <ul className="mt-2 space-y-1">
              {STAFF_LOGINS.map((access) => (
                <li key={access.username}>
                  {access.label}: {access.username} / {access.password}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Pedido de casa ou da mesa?{" "}
            <Link className="underline" href="/loja/central-da-pizza">
              Abrir cardápio
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Depois de um deploy, o atalho do computador e do celular busca a versão nova sozinho. Abra de novo ou toque
            em Atualizar agora; não precisa apagar o ícone.
          </p>
          <p className="text-center font-mono text-[11px] text-muted-foreground">Versão {getAppBuildId().slice(0, 8)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
