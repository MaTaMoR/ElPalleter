import { I18nConfig } from './i18n/config.js';

const i18n = I18nConfig.getInstance();

export async function onRequest(context, next) {
  const { url, locals } = context;
  const pathname = url.pathname;
  
  // 🔍 DEBUG: Ver qué está pasando
  console.log('🌐 Middleware para:', pathname);
  
  // Saltar middleware para rutas administrativas, API y archivos estáticos
  if (
    pathname.startsWith('/administracion') || 
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/uploads') ||
    pathname.includes('.')
  ) {
    console.log('⏭️ Saltando middleware');
    return next();
  }
  
  // Detectar idioma desde la URL
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/.*)?$/);
  
  let detectedLocale = null;
  let cleanPath = pathname;
  
  if (localeMatch) {
    const [, localeFromUrl, restOfPath] = localeMatch;
    
    if (i18n.getLocales().includes(localeFromUrl)) {
      detectedLocale = localeFromUrl;
      cleanPath = restOfPath || '/';
    }
  }
  
  // Si no se detectó idioma, usar por defecto
  const locale = detectedLocale || i18n.getDefaultLocale();
  
  console.log('🌍 Idioma detectado:', locale, 'cleanPath:', cleanPath);
  
  // Guardar información en locals (para usar en componentes)
  locals.locale = locale;
  locals.cleanPath = cleanPath;
  locals.localeInfo = i18n.getLocaleInfo(locale);
  locals.isDefaultLocale = locale === i18n.getDefaultLocale();
  
  // 🚀 SIMPLE: Solo pasar al siguiente, Astro maneja el routing
  const response = await next();
  
  // Añadir header de idioma
  response.headers.set('Content-Language', locale);
  
  console.log('✅ Middleware completado:', locale);
  return response;
}