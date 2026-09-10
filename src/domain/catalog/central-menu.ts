export const CENTRAL_MENU = {
  tenant: {
    slug: "central-da-pizza",
    name: "Pizzaria Central da Velha",
    tradeName: "Central da Pizza",
    phone: "(91) 99151-5550",
    whatsapp: "(91) 99151-5550",
    city: "Belém",
    state: "PA",
    neighborhood: "da Velha",
    estimatedMinutes: 40,
    minimumOrderCents: 0,
    primaryColor: "#1a1a1a",
    logoUrl: "/tenants/central-da-pizza/logo.png",
  },
  hours: {
    opensAt: "18:00",
    closesAt: "23:30",
    closedWeekday: 1,
  },
  sizes: [
    { name: "P", slug: "p", maxFlavors: 2, slices: 6, basePriceCents: 4500, sortOrder: 1, featured: false, badge: null, stockQuantity: 3 },
    { name: "M", slug: "m", maxFlavors: 2, slices: 8, basePriceCents: 5000, sortOrder: 2, featured: true, badge: "RECOMENDADO", stockQuantity: null },
    { name: "G", slug: "g", maxFlavors: 2, slices: 10, basePriceCents: 6000, sortOrder: 3, featured: false, badge: null, stockQuantity: null },
    { name: "GG", slug: "gg", maxFlavors: 2, slices: 12, basePriceCents: 6500, sortOrder: 4, featured: true, badge: "RECOMENDADO", stockQuantity: null },
  ],
  drinks: [
    {
      name: "Jarra de suco de laranja 500ml",
      slug: "suco-laranja-500ml",
      description: "Suco natural de laranja.",
      priceCents: 800,
      featured: false,
      badge: null,
      categorySlug: "sucos",
      imageUrl: "/tenants/central-da-pizza/suco-laranja.jpg",
    },
    {
      name: "Jarra de suco de laranja 1L",
      slug: "suco-laranja-1l",
      description: "Suco natural de laranja.",
      priceCents: 1500,
      featured: false,
      badge: null,
      categorySlug: "sucos",
      imageUrl: "/tenants/central-da-pizza/suco-laranja.jpg",
    },
    {
      name: "Jarra de suco de maracujá 500ml",
      slug: "suco-maracuja-500ml",
      description: "Suco natural de maracujá.",
      priceCents: 800,
      featured: false,
      badge: null,
      categorySlug: "sucos",
      imageUrl: "/tenants/central-da-pizza/suco-maracuja.jpg",
    },
    {
      name: "Jarra de suco de maracujá 1L",
      slug: "suco-maracuja-1l",
      description: "Suco natural de maracujá.",
      priceCents: 1500,
      featured: false,
      badge: null,
      categorySlug: "sucos",
      imageUrl: "/tenants/central-da-pizza/suco-maracuja.jpg",
    },
    {
      name: "Jarra de suco de acerola",
      slug: "jarra-suco-acerola",
      description: "Jarra de suco natural.",
      priceCents: 1500,
      featured: false,
      badge: null,
      categorySlug: "sucos",
      imageUrl: "/tenants/central-da-pizza/suco-acerola.jpg",
    },
    {
      name: "Coca-Cola 2L",
      slug: "coca-cola-2l",
      description: "Refrigerante 2 litros.",
      priceCents: 1500,
      featured: true,
      badge: "MAIS PEDIDO",
      categorySlug: "refrigerantes",
      imageUrl: "/tenants/central-da-pizza/coca-cola-2l.jpg",
    },
    {
      name: "Coca-Cola Zero 2L",
      slug: "coca-cola-zero-2l",
      description: "Refrigerante zero açúcar 2 litros.",
      priceCents: 1500,
      featured: false,
      badge: null,
      categorySlug: "refrigerantes",
      imageUrl: "/tenants/central-da-pizza/coca-cola-zero-2l.jpg",
    },
    {
      name: "Guaraná Antarctica 2L",
      slug: "guarana-antarctica-2l",
      description: "Refrigerante 2 litros.",
      priceCents: 1500,
      featured: false,
      badge: null,
      categorySlug: "refrigerantes",
      imageUrl: "/tenants/central-da-pizza/guarana-antarctica-2l.jpg",
    },
    {
      name: "Fanta Laranja 2L",
      slug: "fanta-laranja-2l",
      description: "Refrigerante 2 litros.",
      priceCents: 1500,
      featured: false,
      badge: null,
      categorySlug: "refrigerantes",
      imageUrl: "/tenants/central-da-pizza/fanta-laranja-2l.jpg",
    },
    {
      name: "Sprite 2L",
      slug: "sprite-2l",
      description: "Refrigerante 2 litros.",
      priceCents: 1500,
      featured: false,
      badge: null,
      categorySlug: "refrigerantes",
      imageUrl: "/tenants/central-da-pizza/sprite-2l.jpg",
    },
    {
      name: "Água Crystal 500ml",
      slug: "agua-mineral-500ml",
      description: "Água mineral sem gás.",
      priceCents: 500,
      featured: false,
      badge: null,
      categorySlug: "aguas",
      imageUrl: "/tenants/central-da-pizza/agua-mineral.jpg",
    },
    {
      name: "Água Crystal com gás 500ml",
      slug: "agua-com-gas-500ml",
      description: "Água mineral com gás.",
      priceCents: 600,
      featured: false,
      badge: null,
      categorySlug: "aguas",
      imageUrl: "/tenants/central-da-pizza/agua-com-gas.jpg",
    },
  ],
} as const;

export const PREMIUM_FLAVOR_EXTRA_CENTS = 500;
export const PIZZA_NOTES_MAX = 140;
export const PIZZA_MIN_FLAVORS = 1;
export const ADDON_GROUP_NAME = "Adicionais P / M";
export const ADDON_MAX_SELECT = 5;

export type MenuFlavor = {
  name: string;
  slug: string;
  description: string;
  premium: boolean;
  available: boolean;
};

export type MenuAddon = {
  name: string;
  slug: string;
  priceCents: number;
  available: boolean;
};

export const CENTRAL_FLAVORS: MenuFlavor[] = [
  { name: "2 Queijos", slug: "2-queijos", description: "Molho, mussarela, queijo coalho, geleia de pimenta, pimenta biquinho, orégano.", premium: true, available: true },
  { name: "4 Queijos", slug: "4-queijos", description: "Molho, queijo mussarela, provolone, cheddar, prato, tomate, orégano.", premium: true, available: true },
  { name: "Americana", slug: "americana", description: "Molho, mussarela, bacon, ovos, pimenta calabresa, orégano.", premium: false, available: true },
  { name: "Adventista", slug: "adventista", description: "Molho, mussarela, milho verde, ervilha, frango desfiado, tomate, orégano e batata palha.", premium: false, available: true },
  { name: "Apoliana", slug: "apoliana", description: "Molho, mussarela, milho verde, ervilha, frango desfiado, presunto, calabresa e orégano.", premium: false, available: true },
  { name: "Baiana", slug: "baiana", description: "Molho, mussarela, calabresa picante, cebola, orégano.", premium: false, available: true },
  { name: "Bacon c/ Cheddar", slug: "bacon-cheddar", description: "Molho, mussarela, bacon, cheddar e orégano.", premium: false, available: true },
  { name: "Bacanela", slug: "bacanela", description: "Creme de leite, mussarela, banana, leite condensado e canela.", premium: false, available: true },
  { name: "Beijinho", slug: "beijinho", description: "Creme de leite, mussarela, beijinho, leite condensado e coco ralado.", premium: false, available: true },
  { name: "Carne de Sol c/ Catupiry", slug: "carne-sol-catupiry", description: "Molho, mussarela, carne de sol, catupiry, orégano.", premium: true, available: true },
  { name: "Carne de sol c/ Cheddar", slug: "carne-sol-cheddar", description: "Molho, mussarela, carne de sol, bacon, cheddar e orégano.", premium: true, available: true },
  { name: "Carne de sol c/ Banana", slug: "carne-sol-banana", description: "Molho, mussarela, carne de sol, banana da terra, orégano.", premium: true, available: true },
  { name: "Caipira", slug: "caipira", description: "Molho, mussarela, milho verde, carne de sol, bacon, ovos, pimentão, orégano.", premium: true, available: true },
  { name: "Carne Suprema", slug: "carne-suprema", description: "Molho, mussarela, carne de sol, banana da terra, cream cheese, pimenta biquinho, orégano.", premium: true, available: true },
  { name: "Calabresa", slug: "calabresa", description: "Molho, mussarela, calabresa, cebola, orégano.", premium: false, available: true },
  { name: "Catu-bresa", slug: "catu-bresa", description: "Molho, mussarela, calabresa, catupiry e orégano.", premium: false, available: true },
  { name: "Calabresa c/ Geleia", slug: "calabresa-geleia", description: "Molho, mussarela, calabresa, geleia de pimenta, orégano.", premium: false, available: true },
  { name: "Calabresa c/ Cheddar", slug: "calabresa-cheddar", description: "Molho, mussarela, calabresa, cheddar e orégano.", premium: false, available: true },
  { name: "Churrasco", slug: "churrasco", description: "Molho, mussarela, filé de carne, cebola, tomate, pimentão e orégano.", premium: true, available: true },
  { name: "Catuperu", slug: "catuperu", description: "Molho, mussarela, peito de peru defumado, catupiry, orégano.", premium: true, available: true },
  { name: "Catupresunto", slug: "catupresunto", description: "Molho, mussarela, presunto, catupiry e orégano.", premium: false, available: false },
  { name: "Castelões", slug: "casteloes", description: "Molho, mussarela, calabresa, bacon, orégano.", premium: false, available: true },
  { name: "Churros", slug: "churros", description: "Creme de leite, mussarela, doce de leite, canela em pó.", premium: false, available: true },
  { name: "Frango c/ Catupiry", slug: "frango-catupiry", description: "Molho, mussarela, frango desfiado, catupiry, orégano.", premium: false, available: true },
  { name: "Frango c/ Bacon", slug: "frango-bacon", description: "Molho, mussarela, frango desfiado, bacon, catupiry, tomate, orégano.", premium: false, available: true },
  { name: "Frango c/ Cheddar", slug: "frango-cheddar", description: "Molho, mussarela, frango desfiado, bacon, cheddar e orégano.", premium: false, available: true },
  { name: "Frango Supremo", slug: "frango-supremo", description: "Molho, mussarela, frango, bacon, banana da terra, cream cheese, pimenta biquinho, orégano.", premium: true, available: true },
  { name: "Filé c/ Bacon", slug: "file-bacon", description: "Molho, mussarela, filé bovino, bacon, orégano.", premium: true, available: true },
  { name: "Filé c/ Banana", slug: "file-banana", description: "Molho, mussarela, filé de carne, banana da terra e orégano.", premium: true, available: true },
  { name: "Filé c/ Coalho", slug: "file-coalho", description: "Molho, mussarela, filé de carne, queijo coalho, geleia de pimenta, pimenta biquinho, orégano.", premium: true, available: true },
  { name: "Filé Supremo", slug: "file-supremo", description: "Molho, mussarela, filé de carne, banana da terra, cream cheese, pimenta biquinho, orégano.", premium: true, available: true },
  { name: "Italiana", slug: "italiana", description: "Molho, mussarela, frango desfiado, milho verde, catupiry, batata palha, orégano.", premium: false, available: true },
  { name: "Lombinho Canadense", slug: "lombinho-canadense", description: "Molho, mussarela, lombinho defumado, catupiry, cebola e orégano.", premium: true, available: false },
  { name: "Moda da Casa", slug: "moda-da-casa", description: "Molho, mussarela, milho verde, ervilha, frango desfiado, presunto, orégano.", premium: false, available: true },
  { name: "Mussarela", slug: "mussarela", description: "Molho, mussarela, tomate, orégano.", premium: false, available: true },
  { name: "Maranhense", slug: "maranhense", description: "Molho, mussarela, milho verde, presunto, calabresa, catupiry, cebola, orégano.", premium: false, available: true },
  { name: "Mexicana", slug: "mexicana", description: "Molho, mussarela, calabresa, ovos, cebola, pimentão, pimenta e orégano.", premium: false, available: true },
  { name: "M & M", slug: "m-e-m", description: "Creme de leite, mussarela, chocolate e M & M.", premium: false, available: true },
  { name: "Nordestina", slug: "nordestina", description: "Molho, mussarela, milho verde, frango, presunto, calabresa, catupiry, cebola, orégano.", premium: false, available: true },
  { name: "Paulista", slug: "paulista", description: "Molho, mussarela, milho verde, ervilha, presunto, bacon, orégano.", premium: false, available: true },
  { name: "Portuguesa", slug: "portuguesa", description: "Molho, mussarela, ervilha, presunto, ovos, cebola, orégano.", premium: false, available: true },
  { name: "Peito de Peru", slug: "peito-de-peru", description: "Molho, mussarela, peito de peru defumado, catupiry, tomate, batata palha, orégano.", premium: true, available: false },
  { name: "Romeu e Julieta", slug: "romeu-e-julieta", description: "Creme de leite, mussarela, goiabada e canela.", premium: false, available: true },
  { name: "Strogonoff de Frango", slug: "strogonoff-frango", description: "Molho, mussarela, milho verde, frango ao creme, tomate, batata palha, orégano.", premium: false, available: true },
  { name: "Super Bacon", slug: "super-bacon", description: "Molho, mussarela, bacon, tomate, orégano.", premium: false, available: true },
  { name: "Sertaneja", slug: "sertaneja", description: "Molho, mussarela, milho verde, carne de sol, ovos, queijo coalho, orégano.", premium: true, available: true },
  { name: "Vegetariana", slug: "vegetariana", description: "Molho, mussarela, milho verde, ervilha, tomate, palmito, orégano.", premium: false, available: true },
];

export const CENTRAL_ADDONS: MenuAddon[] = [
  { name: "Catupiry", slug: "catupiry", priceCents: 500, available: true },
  { name: "Milho", slug: "milho", priceCents: 500, available: true },
  { name: "Ervilha", slug: "ervilha", priceCents: 500, available: true },
  { name: "Batata Palha", slug: "batata-palha", priceCents: 500, available: true },
  { name: "Banana da Terra", slug: "banana-da-terra", priceCents: 500, available: true },
  { name: "Pimenta Biquinho", slug: "pimenta-biquinho", priceCents: 500, available: true },
  { name: "Cebola", slug: "cebola", priceCents: 500, available: true },
  { name: "Presunto", slug: "presunto", priceCents: 500, available: true },
  { name: "Pimentão", slug: "pimentao", priceCents: 500, available: true },
  { name: "Ovo", slug: "ovo", priceCents: 500, available: true },
  { name: "Tomate", slug: "tomate", priceCents: 500, available: true },
  { name: "Queijo Cheddar fatiado", slug: "cheddar-fatiado", priceCents: 1000, available: true },
  { name: "Queijo Mussarela", slug: "queijo-mussarela", priceCents: 1000, available: true },
  { name: "Queijo Coalho", slug: "queijo-coalho", priceCents: 1000, available: true },
  { name: "Queijo Cheddar cremoso", slug: "cheddar-cremoso", priceCents: 1000, available: true },
  { name: "Queijo Prato", slug: "queijo-prato", priceCents: 1000, available: true },
  { name: "Filé", slug: "file", priceCents: 1000, available: true },
  { name: "Queijo Provolone", slug: "provolone", priceCents: 1000, available: true },
  { name: "Carne de sol", slug: "carne-de-sol", priceCents: 1000, available: true },
  { name: "Frango Desfiado", slug: "frango-desfiado", priceCents: 1000, available: true },
  { name: "Bacon", slug: "bacon", priceCents: 1000, available: true },
  { name: "Calabresa", slug: "calabresa-extra", priceCents: 1000, available: true },
  { name: "Geleia de Abacaxi c/ pimenta", slug: "geleia-abacaxi-pimenta", priceCents: 1000, available: true },
  { name: "Cream Cheese", slug: "cream-cheese", priceCents: 1000, available: true },
  { name: "Peito Peru Defumado", slug: "peito-peru-defumado", priceCents: 1000, available: false },
  { name: "Lombinho Canadense", slug: "lombinho-canadense-extra", priceCents: 1000, available: false },
  { name: "Azeite de Oliva", slug: "azeite-de-oliva", priceCents: 1000, available: true },
];

export function flavorExtraCents(flavor: Pick<MenuFlavor, "premium">): number {
  return flavor.premium ? PREMIUM_FLAVOR_EXTRA_CENTS : 0;
}

export function pizzaProductSlug(sizeSlug: string): string {
  return `pizza-${sizeSlug}`;
}
