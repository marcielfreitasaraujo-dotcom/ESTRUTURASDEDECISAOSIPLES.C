import Link from "next/link";
import { Brand } from "@/components/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignUpForm } from "@/components/auth-forms";

export default function SignUpPage() {
  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Brand />
          <CardTitle className="text-2xl font-semibold">Cadastrar restaurante</CardTitle>
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
