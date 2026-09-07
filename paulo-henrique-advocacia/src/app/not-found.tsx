import { ButtonLink } from "@/components/ui/ButtonLink";

export default function NotFound() {
  return (
    <section className="flex min-h-[80svh] flex-col items-center justify-center bg-navy px-4 pt-24 text-center text-ivory">
      <p className="eyebrow">Erro 404</p>
      <h1 className="mt-4 text-4xl text-ivory">Página não encontrada</h1>
      <p className="mt-4 max-w-md text-ivory/75">
        O endereço acessado não existe ou foi alterado. Volte ao início ou fale
        com o escritório.
      </p>
      <div className="mt-8">
        <ButtonLink href="/" variant="gold">
          Ir para o início
        </ButtonLink>
      </div>
    </section>
  );
}
