/**
 * Configuração central da Realiza Consultoria Caixa
 * Altere aqui para refletir em header, footer e CTAs.
 */
export const SITE = {
  name: "Realiza Consultoria Caixa",
  shortName: "Realiza",
  tagline: "Consultoria Caixa",
  city: "Estreito — MA",
  phoneDisplay: "(99) 98468-1048",
  phoneTel: "+5599984681048",
  whatsapp: "5599984681048",
  address: "R. Graça Aranha, n° 1567 — Centro",
  addressFull: "R. Graça Aranha, n° 1567 — Centro, Estreito — MA, 65975-000",
  cep: "65975-000",
  plusCode: "CHQ5+Q4",
  hoursWeek: "Segunda a sexta · até 18h",
  hoursWeekend: "Sábado e domingo · consulte",
  googleRating: "5,0",
  googleReviewsCount: "3",
  mapsSearch:
    "https://www.google.com/maps/search/?api=1&query=R.+Gra%C3%A7a+Aranha,+1567+-+Centro,+Estreito+-+MA,+65975-000",
  mapsEmbed:
    "https://maps.google.com/maps?q=R.%20Gra%C3%A7a%20Aranha,%201567%20-%20Centro,%20Estreito%20-%20MA,%2065975-000&z=16&output=embed",
  consultant: "Eduardo",
};

export function waLink(message) {
  const text = encodeURIComponent(
    message || "Olá! Gostaria de atendimento da Realiza Consultoria Caixa."
  );
  return `https://wa.me/${SITE.whatsapp}?text=${text}`;
}

export const WA_MESSAGES = {
  general: "Olá! Gostaria de atendimento da Realiza Consultoria Caixa.",
  habitacao: "Olá, gostaria de saber mais sobre financiamento habitacional.",
  fgts: "Olá, gostaria de saber mais sobre FGTS.",
  consignado: "Olá, gostaria de saber mais sobre crédito consignado.",
  conta: "Olá, gostaria de saber mais sobre conta e produtos Caixa.",
  consultoria: "Olá, gostaria de uma consultoria financeira com a Realiza.",
};
