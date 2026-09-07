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
    description: 'O corte vai para a brasa e chega à mesa ainda quente.',
    price: 'Consulte',
    image: '/images/menu-carne.jpg',
    imageWebp: '/images/menu-carne.webp',
  },
  {
    id: 'mock-carne-2',
    mock: true,
    category: 'carnes',
    name: 'Grelhados da casa',
    description: 'Feito na grelha, servido com o acompanhamento do prato.',
    price: 'Consulte',
    image: '/images/menu-grelhados.jpg',
    imageWebp: '/images/menu-grelhados.webp',
  },
  {
    id: 'mock-espeto-1',
    mock: true,
    category: 'espetos',
    name: 'Espetos',
    description: 'Assados um a um na brasa, para comer sem pressa.',
    price: 'Consulte',
    image: '/images/menu-espeto.jpg',
    imageWebp: '/images/menu-espeto.webp',
  },
  {
    id: 'mock-espeto-2',
    mock: true,
    category: 'espetos',
    name: 'Espeto do dia',
    description: 'A escolha do churrasqueiro, conforme a carne do dia.',
    price: 'Consulte',
    image: '/images/menu-espeto2.jpg',
    imageWebp: '/images/menu-espeto2.webp',
  },
  {
    id: 'mock-acomp-1',
    mock: true,
    category: 'acompanhamentos',
    name: 'Acompanhamentos',
    description: 'As guarnições que acompanham o prato principal.',
    price: 'Consulte',
    image: '/images/menu-acomp.jpg',
    imageWebp: '/images/menu-acomp.webp',
  },
  {
    id: 'mock-acomp-2',
    mock: true,
    category: 'acompanhamentos',
    name: 'Porções',
    description: 'Para dividir enquanto a carne ainda está na brasa.',
    price: 'Consulte',
    image: '/images/menu-porcao.jpg',
    imageWebp: '/images/menu-porcao.webp',
  },
  {
    id: 'mock-bebida-1',
    mock: true,
    category: 'bebidas',
    name: 'Bebidas',
    description: 'Geladas para acompanhar a refeição do começo ao fim.',
    price: 'Consulte',
    image: '/images/menu-bebida.jpg',
    imageWebp: '/images/menu-bebida.webp',
  },
  {
    id: 'mock-bebida-2',
    mock: true,
    category: 'bebidas',
    name: 'Para a mesa',
    description: 'Opções servidas para a mesa toda, direto no salão.',
    price: 'Consulte',
    image: '/images/menu-mesa.jpg',
    imageWebp: '/images/menu-mesa.webp',
  },
]
