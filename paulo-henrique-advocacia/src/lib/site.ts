export const site = {
  name: "Paulo Henrique Advocacia Previdenciária",
  shortName: "Paulo Henrique Advocacia",
  legalName:
    "Paulo Henrique Araujo dos Santos Sociedade Individual de Advocacia",
  /** Placeholder editável — preencha se quiser exibir o CNPJ no rodapé/schema. */
  cnpj: "55.233.418/0001-30",
  tagline:
    "Advocacia especializada na defesa dos direitos previdenciários, com atendimento personalizado, estratégia jurídica e acompanhamento próximo de cada cliente.",
  description:
    "Advocacia Previdenciária em Estreito - MA. Atendimento especializado em aposentadorias, BPC/LOAS, benefícios do INSS, auxílio-doença, auxílio-acidente e demais demandas previdenciárias.",
  url: "https://paulohenriqueadvocacia.com.br",
  locale: "pt_BR",
  phoneDisplay: "(99) 98160-2780",
  phoneE164: "+5599981602780",
  whatsappNumber: "5599981602780",
  whatsappMessage:
    "Olá, gostaria de obter informações sobre atendimento jurídico previdenciário.",
  email: "advocaciapaulohenriquearaujo@gmail.com",
  instagram: "https://www.instagram.com/adv.paulohenrique_/",
  instagramHandle: "@adv.paulohenrique_",
  /**
   * Cole o link oficial da página quando estiver disponível.
   * Enquanto vazio, o ícone do Facebook não é exibido.
   */
  facebook: "",
  address: {
    street: "R. Bandeirantes, 03",
    neighborhood: "Bandeirantes",
    city: "Estreito",
    region: "MA",
    postalCode: "65975-000",
    country: "BR",
    display: "R. Bandeirantes, 03 - Bandeirantes, Estreito - MA",
  },
  hours: {
    displayLines: ["Segunda a sexta", "08:00 às 18:00"],
    display: "Segunda a sexta, 08:00 às 18:00",
    schema: "Mo-Fr 08:00-18:00",
  },
  google: {
    ratingValue: "5.0",
    ratingDisplay: "5,0",
    reviewCount: 42,
    reviewsUrl:
      "https://www.google.com/maps/search/?api=1&query=Paulo+Henrique+Advocacia+Estreito+MA",
    mapsLink:
      "https://www.google.com/maps/search/?api=1&query=Rua+Bandeirantes+03+Bandeirantes+Estreito+MA",
    mapsEmbed:
      "https://www.google.com/maps?q=Rua+Bandeirantes,+03,+Bandeirantes,+Estreito+-+MA,+65975-000&hl=pt-BR&z=17&output=embed",
  },
  founder: {
    name: "Paulo Henrique de Araújo dos Santos",
    role: "Advogado · Direito Previdenciário",
  },
} as const;

export function whatsappUrl(message: string = site.whatsappMessage): string {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function telHref(): string {
  return `tel:${site.phoneE164}`;
}

export function mapsQuery(): string {
  return site.address.display;
}

export const navItems = [
  { href: "/#inicio", label: "Início", id: "inicio" },
  { href: "/#escritorio", label: "O Escritório", id: "escritorio" },
  { href: "/#atuacao", label: "Áreas de Atuação", id: "atuacao" },
  { href: "/#diferenciais", label: "Diferenciais", id: "diferenciais" },
  { href: "/#depoimentos", label: "Depoimentos", id: "depoimentos" },
  { href: "/#conteudos", label: "Conteúdos", id: "conteudos" },
  { href: "/#contato", label: "Contato", id: "contato" },
] as const;

export const footerLinks = [
  { href: "/#inicio", label: "Início" },
  { href: "/#escritorio", label: "O Escritório" },
  { href: "/#atuacao", label: "Áreas de Atuação" },
  { href: "/conteudos", label: "Conteúdos" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#contato", label: "Contato" },
] as const;
