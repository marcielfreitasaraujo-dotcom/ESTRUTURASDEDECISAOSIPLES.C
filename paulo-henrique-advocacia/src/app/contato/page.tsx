import type { Metadata } from "next";
import { Contact } from "@/components/sections/Contact";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com o escritório Paulo Henrique Advocacia Previdenciária em Estreito - MA pelo WhatsApp (99) 98160-2780.",
  alternates: { canonical: "/contato" },
};

export default function ContatoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Fale com o escritório"
        subtitle="Atendimento de segunda a sexta, das 08:00 às 18:00, em Estreito - MA e online."
      />
      <Contact hideHeading />
    </>
  );
}
