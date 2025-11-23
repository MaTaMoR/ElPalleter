import { defineConfig } from 'astro/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  output: 'static',
  vite: {
    resolve: {
      alias: {
        '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000
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