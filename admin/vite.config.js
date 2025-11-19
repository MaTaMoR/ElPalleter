import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    sourcemap: false, // Deshabilitar source maps en producción
    minify: 'esbuild', // Asegurar minificación con esbuild
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks - separa las dependencias node_modules
          if (id.includes('node_modules')) {
            // React y React Router en un chunk separado
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // Lucide icons en su propio chunk (suelen ser grandes)
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Resto de vendors
            return 'vendor-libs';
          }

          // Servicios compartidos en un chunk separado
          if (id.includes('/src/services/')) {
            return 'shared-services';
          }

          // Repositorios compartidos en un chunk separado
          if (id.includes('/src/repositories/')) {
            return 'shared-repositories';
          }
        }
      }
    },
    chunkSizeWarningLimit: 800, // Aumentar el límite a 800 KB (más realista para apps modernas)
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  server: {
    host: '192.168.1.14',
    port: 3001,
    sourcemapIgnoreList: () => true, // Ignorar warnings de source maps en desarrollo
  },
  // Configuración para development - solo inline sourcemaps en dev
  esbuild: mode === 'development' ? {
    sourcemap: 'inline', // Source maps inline en desarrollo para evitar archivos .map rotos
  } : {
    drop: ['console', 'debugger'], // Eliminar console.log en producción
  },
  base: '/admin',
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