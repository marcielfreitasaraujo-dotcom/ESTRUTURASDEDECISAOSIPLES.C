import Link from "next/link";
import { Brand } from "@/components/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignUpForm } from "@/components/auth-forms";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Brand />
          <CardTitle className="font-heading text-2xl">Cadastrar pizzaria</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SignUpForm />
          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link className="underline" href="/entrar">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
