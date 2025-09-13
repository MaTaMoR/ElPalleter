import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  output: 'hybrid', 
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      }
    }
  },
  server: {
    port: 3000,
    host: true
  },
  proxy: {
    '/admin': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false
    }
  },
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'val'],
    routing: {
      prefixDefaultLocale: false,
      fallbackType: 'rewrite'
    }
  }
});