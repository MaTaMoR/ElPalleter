import { defineConfig } from 'astro/config';
import strip from '@rollup/plugin-strip';
import { fileURLToPath, URL } from 'node:url';
import sitemap from '@astrojs/sitemap';

export default defineConfig(({ mode }) => ({
  site: process.env.SITE_URL || 'https://www.elpalleter.com',
  output: 'static',

  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'es',
        locales: {
          es: 'es',
          en: 'en',
          val: 'val',
        },
      },
    }),
  ],

  build: {
    inlineStylesheets: 'always',
  },

  vite: {
    resolve: {
      alias: {
        '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      }
    },

    build: {
      minify: 'esbuild',
      cssMinify: true,
      cssCodeSplit: false,

      rollupOptions: {
        plugins: [
          mode === 'production' &&
            strip({
              include: ['**/*.js', '**/*.ts', '**/*.astro'],
              functions: ['console.*'], // Borra TODOS los console.*
              debugger: true,            // Borra todos los debugger
            }),
        ],
        output: {
          manualChunks: {
            'analytics': ['./src/shared/services/AnalyticsService.js'],
            'i18n': ['./src/shared/services/I18nService.js'],
          }
        }
      },

      chunkSizeWarningLimit: 500,
    },

    server: {
      hmr: { overlay: true }
    }
  },

  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'val'],
    routing: { prefixDefaultLocale: false, fallbackType: 'rewrite' }
  },

  compressHTML: true,
}));
