/**
 * Resolve caminhos de `public/` contra a base do build.
 *
 * Os dados guardam o caminho canônico, começando com barra. Servido na raiz de um
 * domínio isso já basta, mas em subpasta — githack, GitHub Pages de projeto — o
 * caminho absoluto apontaria para a raiz do host e a imagem sumiria. Com
 * `base: './'` no Vite, aqui ele vira relativo ao documento.
 */
const BASE = import.meta.env.BASE_URL

export function asset(caminho: string): string {
  if (/^(https?:)?\/\//.test(caminho) || caminho.startsWith('data:')) return caminho
  return `${BASE}${caminho.replace(/^\//, '')}`
}
