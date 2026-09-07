export type GalleryCategory = 'comida' | 'ambiente' | 'churrasco' | 'restaurante'

export type GalleryItem = {
  id: string
  category: GalleryCategory
  src: string
  srcWebp: string
  alt: string
  /**
   * Fotos de acervo gastronômico até as imagens oficiais do salão e da brasa.
   * Trocar src/srcWebp pelos arquivos reais do Cabana House.
   */
  placeholder: true
}

export const galleryFilters: { id: 'todos' | GalleryCategory; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'comida', label: 'Comida' },
  { id: 'ambiente', label: 'Ambiente' },
  { id: 'churrasco', label: 'Churrasco' },
  { id: 'restaurante', label: 'Restaurante' },
]

export const galleryItems: GalleryItem[] = [
  {
    id: 'g1',
    category: 'churrasco',
    src: '/images/hero.jpg',
    srcWebp: '/images/hero.webp',
    alt: 'Carnes e espetos grelhados na brasa',
    placeholder: true,
  },
  {
    id: 'g2',
    category: 'ambiente',
    src: '/images/about.jpg',
    srcWebp: '/images/about.webp',
    alt: 'Ambiente de bar e restaurante com iluminação quente',
    placeholder: true,
  },
  {
    id: 'g3',
    category: 'churrasco',
    src: '/images/brasa.jpg',
    srcWebp: '/images/brasa.webp',
    alt: 'Carne fatiada com crosta da brasa',
    placeholder: true,
  },
  {
    id: 'g4',
    category: 'restaurante',
    src: '/images/experience.jpg',
    srcWebp: '/images/experience.webp',
    alt: 'Salão de restaurante com iluminação baixa',
    placeholder: true,
  },
  {
    id: 'g5',
    category: 'comida',
    src: '/images/gal-1.jpg',
    srcWebp: '/images/gal-1.webp',
    alt: 'Prato servido à mesa',
    placeholder: true,
  },
  {
    id: 'g6',
    category: 'restaurante',
    src: '/images/gal-2.jpg',
    srcWebp: '/images/gal-2.webp',
    alt: 'Salão com cozinha aberta e iluminação quente',
    placeholder: true,
  },
  {
    id: 'g7',
    category: 'comida',
    src: '/images/cta.jpg',
    srcWebp: '/images/cta.webp',
    alt: 'Corte grelhado fatiado na tábua',
    placeholder: true,
  },
  {
    id: 'g8',
    category: 'ambiente',
    src: '/images/gal-5.jpg',
    srcWebp: '/images/gal-5.webp',
    alt: 'Preparo na cozinha',
    placeholder: true,
  },
  {
    id: 'g9',
    category: 'comida',
    src: '/images/gal-4.jpg',
    srcWebp: '/images/gal-4.webp',
    alt: 'Corte grelhado servido no prato',
    placeholder: true,
  },
]
