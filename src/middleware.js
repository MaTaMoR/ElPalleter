// src/middleware.js
import { defineMiddleware } from 'astro:middleware';
import { verifyToken } from './lib/auth.js';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  
  // Rutas que requieren autenticación
  if (pathname.startsWith('/administracion/dashboard')) {
    const token = context.cookies.get('admin-token')?.value;
    
    if (!token || !await verifyToken(token)) {
      return context.redirect('/administracion');
    }
  }
  
  return next();
});

