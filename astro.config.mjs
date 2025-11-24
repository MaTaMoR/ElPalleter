import { defineConfig } from 'astro/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => ({
  output: 'static',
  
  // Configuración de build para producción
  build: {
    inlineStylesheets: 'auto', // Inline CSS pequeños
  },
  
  vite: {
    ...(mode === 'production' && {
      esbuild: {
        drop: ['console', 'debugger'],
      }
    }),
    resolve: {
      alias: {
        '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      }
    },
    
    // Optimización para producción
    build: {
      // Minificación
      minify: 'esbuild',
      cssMinify: true,
      
      // Rollup optimizations
      rollupOptions: {
        output: {
          // Mejores nombres para chunks
          manualChunks: {
            'analytics': ['./src/shared/services/AnalyticsService.js'],
            'i18n': ['./src/shared/services/I18nService.js'],
          }
        }
      },
      
      // Chunk size warning
      chunkSizeWarningLimit: 500,
    },
    
    // Compresión
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
  
  // Compresión de assets
  compressHTML: true,
}));