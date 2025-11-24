import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: '/admin/',
  
  build: {
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2022',
    
    // Eliminar console.log en producción
    ...(mode === 'production' && {
      esbuild: {
        drop: ['console', 'debugger'],
      }
    }),
    
    // Optimización de chunks simplificada
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [/node_modules/],
        }
      }
    },
    
    chunkSizeWarningLimit: 800,
    
    // Compresión adicional
    cssCodeSplit: true,
    assetsInlineLimit: 4096, // Inline assets < 4kb
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  
  server: {
    host: '0.0.0.0',
    port: 3001,
  },
  
  // CSS optimizations
  css: {
    devSourcemap: mode === 'development',
  },
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@styles': fileURLToPath(new URL('../src/styles', import.meta.url)),
      '@repositories': fileURLToPath(new URL('../src/repositories', import.meta.url)),
      '@services': fileURLToPath(new URL('../src/services', import.meta.url)),
      '@utils': fileURLToPath(new URL('../src/utils', import.meta.url)),
      '@assets': fileURLToPath(new URL('../src/assets', import.meta.url))
    }
  }
}));