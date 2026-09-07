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
    src: '/images/gal-7.jpg',
    srcWebp: '/images/gal-7.webp',
    alt: 'Picanha fatiada na tábua, ainda com a crosta da brasa',
    placeholder: true,
  },
  {
    id: 'g2',
    category: 'comida',
    src: '/images/gal-4.jpg',
    srcWebp: '/images/gal-4.webp',
    alt: 'Cortes servidos em pratos individuais com molhos',
    placeholder: true,
  },
  {
    id: 'g3',
    category: 'ambiente',
    src: '/images/gal-1.jpg',
    srcWebp: '/images/gal-1.webp',
    alt: 'Prato sendo servido em mesa posta, com taças e luz baixa',
    placeholder: true,
  },
  {
    id: 'g4',
    category: 'churrasco',
    src: '/images/gal-3.jpg',
    srcWebp: '/images/gal-3.webp',
    alt: 'Costela assada e fatiada sobre tábua de madeira',
    placeholder: true,
  },
  {
    id: 'g5',
    category: 'restaurante',
    src: '/images/gal-2.jpg',
    srcWebp: '/images/gal-2.webp',
    alt: 'Salão com cozinha aberta, coifas de cobre e iluminação quente',
    placeholder: true,
  },
  {
    id: 'g6',
    category: 'comida',
    src: '/images/gal-6.jpg',
    srcWebp: '/images/gal-6.webp',
    alt: 'Frango frito crocante com fritas',
    placeholder: true,
  },
  {
    id: 'g7',
    category: 'churrasco',
    src: '/images/gal-8.jpg',
    srcWebp: '/images/gal-8.webp',
    alt: 'Costela na tábua com fritas, tomate e molho',
    placeholder: true,
  },
  {
    id: 'g8',
    category: 'restaurante',
    src: '/images/gal-5.jpg',
    srcWebp: '/images/gal-5.webp',
    alt: 'Preparo dos pratos na cozinha sob lâmpadas de cobre',
    placeholder: true,
  },
  {
    id: 'g9',
    category: 'ambiente',
    src: '/images/gal-9.jpg',
    srcWebp: '/images/gal-9.webp',
    alt: 'Salão de jantar com madeira escura, ripados dourados e mesas postas',
    placeholder: true,
  },
  {
    id: 'g10',
    category: 'comida',
    src: '/images/gal-10.jpg',
    srcWebp: '/images/gal-10.webp',
    alt: 'Mesa farta com porções para dividir e bebidas',
    placeholder: true,
  },
]
