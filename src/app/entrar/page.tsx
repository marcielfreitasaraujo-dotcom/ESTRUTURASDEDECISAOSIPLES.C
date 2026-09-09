import Link from "next/link";
import { Brand } from "@/components/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth-forms";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Brand />
          <CardTitle className="font-heading text-2xl">Entrar no Forno</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <LoginForm />
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
