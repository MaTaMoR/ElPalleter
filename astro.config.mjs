import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'http://localhost:4321',
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'ca'],
    routing: {
      prefixDefaultLocale: false,
      fallbackType: "rewrite"
    }
  }
});