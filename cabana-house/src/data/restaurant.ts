export const restaurant = {
  name: 'Cabana House',
  tagline: 'Churrascaria',
  city: 'Estreito – MA',
  addressLine: 'Av. Chico Brito, s/n',
  postalCode: '65975-000',
  phoneDisplay: '(99) 99208-4455',
  phoneE164: '5599992084455',
  whatsappMessage: 'Olá! Gostaria de saber mais sobre o Cabana House.',
  mapsQuery: 'Av. Chico Brito, Estreito - MA, 65975-000',
  ratingValue: 4,
  reviewCount: 17,
  /** Sem horário oficial informado — preencher quando houver. */
  hours: null as string | null,
  /** Sem rede social oficial informada — preencher quando houver. */
  instagram: null as string | null,
} as const

export function whatsappUrl(text: string = restaurant.whatsappMessage) {
  return `https://wa.me/${restaurant.phoneE164}?text=${encodeURIComponent(text)}`
}

export function mapsUrl() {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.mapsQuery)}`
}

export function mapsEmbedSrc() {
  return `https://maps.google.com/maps?q=${encodeURIComponent(restaurant.mapsQuery)}&output=embed`
}

export function ratingLabel() {
  return `${restaurant.ratingValue.toFixed(1).replace('.', ',')}`
}
