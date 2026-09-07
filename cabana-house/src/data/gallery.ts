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
    alt: 'Carnes grelhadas na brasa',
    placeholder: true,
  },
  {
    id: 'g2',
    category: 'ambiente',
    src: '/images/about.jpg',
    srcWebp: '/images/about.webp',
    alt: 'Salão com mesa posta',
    placeholder: true,
  },
  {
    id: 'g3',
    category: 'churrasco',
    src: '/images/brasa.jpg',
    srcWebp: '/images/brasa.webp',
    alt: 'Carne na grelha',
    placeholder: true,
  },
  {
    id: 'g4',
    category: 'restaurante',
    src: '/images/experience.jpg',
    srcWebp: '/images/experience.webp',
    alt: 'Ambiente de restaurante',
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
    alt: 'Mesas do restaurante',
    placeholder: true,
  },
  {
    id: 'g7',
    category: 'comida',
    src: '/images/gal-5.jpg',
    srcWebp: '/images/gal-5.webp',
    alt: 'Preparo na cozinha',
    placeholder: true,
  },
  {
    id: 'g8',
    category: 'ambiente',
    src: '/images/cta.jpg',
    srcWebp: '/images/cta.webp',
    alt: 'Mesa com cortes grelhados',
    placeholder: true,
  },
]
