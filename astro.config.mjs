import { defineConfig } from 'astro/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => ({
  output: 'static',

  // Esta es la única config build que debe ir en Astro
  build: {
    inlineStylesheets: 'auto',
  },

  vite: {
    resolve: {
      alias: {
        '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      }
    },

    build: {
      // Usa esbuild como minificador (correcto)
      minify: 'esbuild',
      cssMinify: true,

      // IMPORTANTÍSIMO: aquí sí va esbuild.drop
      esbuild: {
        ...(mode === 'production' && {
          drop: ['console', 'debugger'],
        })
      },

      rollupOptions: {
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
      hmr: {
        overlay: true
      }
    }
  },

  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'val'],
    routing: {
      prefixDefaultLocale: false,
      fallbackType: 'rewrite'
    }
  },

  compressHTML: true,
}));
