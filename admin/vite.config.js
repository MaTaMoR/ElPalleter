import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
   build: {
    sourcemap: process.env.NODE_ENV === 'development' ? false : false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  server: {
    port: 3001,
    host: true
  },
  base: '/admin',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@styles': fileURLToPath(new URL('../src/styles', import.meta.url)),
      '@repositories': fileURLToPath(new URL('../src/repositories', import.meta.url)),
      '@services': fileURLToPath(new URL('../src/services', import.meta.url)),
      '@utils': fileURLToPath(new URL('../src/utils', import.meta.url))
    }
  }
});