import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://dpenasmi.github.io',
  base: '/demo-club-tennis',
  trailingSlash: 'always',
  output: 'static',
  // Conserva IMG como carpeta pública para las dos secuencias.
  publicDir: './IMG',
});
