import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'http://localhost:4321',
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'val'],
    routing: {
      prefixDefaultLocale: false,
      fallbackType: "rewrite"
    }
  }
});