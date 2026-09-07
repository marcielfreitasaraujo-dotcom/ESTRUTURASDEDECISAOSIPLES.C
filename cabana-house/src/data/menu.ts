/**
 * MOCK — cardápio demonstrativo.
 * Substituir nome, descrição, preço e foto pelos itens oficiais do Cabana House.
 * Não usar estes textos em material impresso como cardápio definitivo.
 */
export type MenuCategory = 'carnes' | 'espetos' | 'acompanhamentos' | 'bebidas'

export type MenuItem = {
  id: string
  mock: true
  category: MenuCategory
  name: string
  description: string
  price: string
  image: string
  imageWebp: string
}

export const menuFilters: { id: 'todos' | MenuCategory; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'carnes', label: 'Carnes' },
  { id: 'espetos', label: 'Espetos' },
  { id: 'acompanhamentos', label: 'Acompanhamentos' },
  { id: 'bebidas', label: 'Bebidas' },
]

export const menuItems: MenuItem[] = [
  {
    id: 'mock-carne-1',
    mock: true,
    category: 'carnes',
    name: 'Carnes na brasa',
    description: 'Cortes grelhados na hora. Ficha oficial a inserir.',
    price: 'Consulte',
    image: '/images/menu-carne.jpg',
    imageWebp: '/images/menu-carne.webp',
  },
  {
    id: 'mock-carne-2',
    mock: true,
    category: 'carnes',
    name: 'Grelhados da casa',
    description: 'Preparo na brasa. Nome e gramatura oficiais a definir.',
    price: 'Consulte',
    image: '/images/cta.jpg',
    imageWebp: '/images/cta.webp',
  },
  {
    id: 'mock-espeto-1',
    mock: true,
    category: 'espetos',
    name: 'Espetos',
    description: 'Espetos na brasa. Variedades oficiais a inserir.',
    price: 'Consulte',
    image: '/images/menu-espeto.jpg',
    imageWebp: '/images/menu-espeto.webp',
  },
  {
    id: 'mock-espeto-2',
    mock: true,
    category: 'espetos',
    name: 'Espeto do dia',
    description: 'Consulte o que está saindo na brasa.',
    price: 'Consulte',
    image: '/images/gal-3.jpg',
    imageWebp: '/images/gal-3.webp',
  },
  {
    id: 'mock-acomp-1',
    mock: true,
    category: 'acompanhamentos',
    name: 'Acompanhamentos',
    description: 'Guarnições da casa. Lista oficial a inserir.',
    price: 'Consulte',
    image: '/images/menu-acomp.jpg',
    imageWebp: '/images/menu-acomp.webp',
  },
  {
    id: 'mock-acomp-2',
    mock: true,
    category: 'acompanhamentos',
    name: 'Porções',
    description: 'Para dividir na mesa. Itens oficiais a definir.',
    price: 'Consulte',
    image: '/images/gal-6.jpg',
    imageWebp: '/images/gal-6.webp',
  },
  {
    id: 'mock-bebida-1',
    mock: true,
    category: 'bebidas',
    name: 'Bebidas',
    description: 'Carta de bebidas. Opções oficiais a inserir.',
    price: 'Consulte',
    image: '/images/menu-bebida.jpg',
    imageWebp: '/images/menu-bebida.webp',
  },
  {
    id: 'mock-bebida-2',
    mock: true,
    category: 'bebidas',
    name: 'Para a mesa',
    description: 'Consulte gelados e outras opções no salão.',
    price: 'Consulte',
    image: '/images/about.jpg',
    imageWebp: '/images/about.webp',
  },
]
