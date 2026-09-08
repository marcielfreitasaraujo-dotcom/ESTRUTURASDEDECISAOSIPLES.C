/**
 * Avaliações: o agregado 4,0 / 17 é o dado atual informado.
 * Não inventar depoimentos. Quando houver textos reais, preencher `quotes`.
 */
export type ReviewQuote = {
  id: string
  mock: true
  text: string
  author: string
}

export const reviews = {
  ratingValue: 4,
  reviewCount: 17,
  /** Vazio de propósito: não inventar depoimentos. Preencher com as avaliações reais autorizadas. */
  quotes: [] as ReviewQuote[],
}
