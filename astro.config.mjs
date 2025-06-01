import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: process.env.SITE_URL || 'http://localhost:4321',
  
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'ca'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: true
    }
  },
  
  build: {
    format: 'directory',
    inlineStylesheets: 'auto'
  },
  
  server: {
    port: parseInt(process.env.DEV_PORT) || 4321,
    host: true
  },
  
  integrations: [
    {
      name: 'i18n-integration',
      hooks: {
        'astro:config:setup': ({ addMiddleware }) => {
          addMiddleware({
            entrypoint: './src/middleware/i18n.js',
            order: 'pre'
          });
        },
        'astro:build:start': async () => {
          const { StaticTranslationBuilder } = await import('./src/utils/translation-utils.js');
          await StaticTranslationBuilder.generateStaticTranslations();
        }
      }
    }
  ]
});