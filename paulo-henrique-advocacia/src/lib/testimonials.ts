export type Testimonial = {
  quote: string;
  source: string;
};

/** Depoimentos reais fornecidos pelo cliente, originados de avaliações no Google. */
export const testimonials: Testimonial[] = [
  {
    quote: "A equipe também está de parabéns, todos muito atenciosos.",
    source: "Avaliação no Google",
  },
  {
    quote:
      "Atendimento maravilhoso, profissionais capacitados e escritório bem aconchegante.",
    source: "Avaliação no Google",
  },
  {
    quote: "Seu trabalho foi fundamental para que tudo desse certo.",
    source: "Avaliação no Google",
  },
];
