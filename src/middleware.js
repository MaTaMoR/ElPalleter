import { defineMiddleware } from 'astro:middleware';
import { AuthService } from './services/AuthService.js';

export const onRequest = defineMiddleware(async (context, next) => {
  // Solo aplicar middleware a rutas admin (excepto login y API)
  const url = new URL(context.request.url);
  const isAdminRoute = url.pathname.startsWith('/admin');
  const isLoginPage = url.pathname === '/admin/login';
  const isApiRoute = url.pathname.startsWith('/api');
  const isAdminIndex = url.pathname === '/admin' || url.pathname === '/admin/';

  // Si no es una ruta admin o es login/API, continuar
  if (!isAdminRoute || isLoginPage || isApiRoute || isAdminIndex) {
    return next();
  }

  // Verificar autenticación para rutas admin protegidas
  try {
    const user = AuthService.getUserFromRequest(context.request);
    
    if (!user) {
      return context.redirect('/admin/login');
    }

    // Agregar el usuario al contexto para usar en las páginas
    context.locals.user = user;
    
    return next();
  } catch (error) {
    console.error('Middleware auth error:', error);
    return context.redirect('/admin/login');
  }
});