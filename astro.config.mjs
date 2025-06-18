import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'val'],
    routing: {
      prefixDefaultLocale: false,
      fallbackType: 'rewrite'
    }
  }
});