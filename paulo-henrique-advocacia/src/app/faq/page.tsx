import type { Metadata } from "next";
import { Faq } from "@/components/sections/Faq";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Perguntas frequentes",
  description:
    "Dúvidas sobre aposentadoria, BPC/LOAS, atendimento online e negativas do INSS.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title="Perguntas frequentes"
        subtitle="Respostas objetivas. Para o seu caso concreto, fale com a equipe."
      />
      <Faq hideHeading />
    </>
  );
}
