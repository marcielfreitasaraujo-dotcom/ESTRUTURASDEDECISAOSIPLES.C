import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: `Política de Privacidade do ${site.shortName}.`,
  alternates: { canonical: "/privacidade" },
};

export default function PrivacidadePage() {
  return (
    <>
      <PageHero eyebrow="Institucional" title="Política de Privacidade" />
      <section className="mx-auto max-w-3xl space-y-5 px-4 py-16 text-muted leading-relaxed sm:px-6 lg:px-8">
        <p>
          Esta política descreve, de forma simples, como o site do {site.name}{" "}
          trata informações de visitantes.
        </p>
        <h2 className="text-2xl text-navy">1. Dados de contato</h2>
        <p>
          Quando você inicia uma conversa pelo WhatsApp, e-mail ou telefone, os
          dados informados por você são utilizados apenas para atendimento
          jurídico e comunicação relacionada ao seu caso. O tratamento de
          mensagens no WhatsApp também está sujeito às regras da própria
          plataforma.
        </p>
        <h2 className="text-2xl text-navy">2. Navegação no site</h2>
        <p>
          Este site não utiliza cookies de publicidade nem ferramentas de
          rastreamento de terceiros na versão entregue. Podem existir cookies
          estritamente técnicos, necessários ao funcionamento do navegador.
        </p>
        <h2 className="text-2xl text-navy">3. Direitos</h2>
        <p>
          Você pode solicitar informações, correção ou exclusão de dados
          pessoais mantidos pelo escritório, nos termos da Lei Geral de Proteção
          de Dados (Lei nº 13.709/2018), pelo e-mail {site.email} ou pelo
          WhatsApp {site.phoneDisplay}.
        </p>
        <h2 className="text-2xl text-navy">4. Atualizações</h2>
        <p>
          Esta página pode ser atualizada para refletir mudanças legais ou
          operacionais. Última revisão: setembro de 2026.
        </p>
      </section>
    </>
  );
}
