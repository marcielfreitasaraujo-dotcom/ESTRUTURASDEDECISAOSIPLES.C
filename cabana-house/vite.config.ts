import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Caminhos relativos ao documento em vez da raiz do host, para o build rodar
  // igual servido na raiz de um domínio ou em subpasta (githack, GitHub Pages).
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
})
