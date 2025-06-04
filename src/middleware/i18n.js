import { defineMiddleware } from 'astro:middleware';

// Configuración de idiomas
const LOCALES = ['es', 'en', 'ca'];
const DEFAULT_LOCALE = 'es';

// Rutas que no necesitan procesamiento de i18n
const IGNORE_PATHS = [
  '/api/',
  '/images/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/_astro/',
  '/public/'
];

/**
 * Detecta el idioma de la URL
 * @param {string} pathname - La ruta de la URL
 * @returns {Object} - { locale, cleanPath }
 */
function detectLocaleFromPath(pathname) {
  // Eliminar slash inicial para análisis
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return { locale: DEFAULT_LOCALE, cleanPath: '/' };
  }

  const firstSegment = segments[0];
  
  // Verificar si el primer segmento es un idioma válido
  if (LOCALES.includes(firstSegment) && firstSegment !== DEFAULT_LOCALE) {
    const cleanPath = '/' + segments.slice(1).join('/');
    return { 
      locale: firstSegment, 
      cleanPath: cleanPath === '' ? '/' : cleanPath 
    };
  }
  
  // Si no hay prefijo de idioma, es el idioma por defecto
  return { locale: DEFAULT_LOCALE, cleanPath: pathname };
}

/**
 * Detecta el idioma preferido del usuario
 * @param {Request} request - La request
 * @returns {string} - El código del idioma
 */
function detectPreferredLocale(request) {
  const acceptLanguage = request.headers.get('Accept-Language');
  
  if (!acceptLanguage) {
    return DEFAULT_LOCALE;
  }

  // Parsear Accept-Language header
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q = '1'] = lang.trim().split(';q=');
      return { code: code.split('-')[0].toLowerCase(), quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);

  // Encontrar el primer idioma soportado
  for (const { code } of languages) {
    if (LOCALES.includes(code)) {
      return code;
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * Verifica si la ruta debe ser ignorada
 * @param {string} pathname - La ruta
 * @returns {boolean}
 */
function shouldIgnorePath(pathname) {
  return IGNORE_PATHS.some(ignorePath => pathname.startsWith(ignorePath));
}

/**
 * Construye la URL con el idioma correcto
 * @param {URL} url - URL original
 * @param {string} locale - Idioma
 * @param {string} path - Ruta limpia
 * @returns {string}
 */
function buildLocalizedUrl(url, locale, path) {
  const baseUrl = `${url.protocol}//${url.host}`;
  
  if (locale === DEFAULT_LOCALE) {
    // Para el idioma por defecto, no agregar prefijo
    return `${baseUrl}${path}${url.search}${url.hash}`;
  } else {
    // Para otros idiomas, agregar prefijo
    const localizedPath = path === '/' ? `/${locale}` : `/${locale}${path}`;
    return `${baseUrl}${localizedPath}${url.search}${url.hash}`;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url, locals, redirect } = context;
  const pathname = url.pathname;

  // Ignorar rutas específicas
  if (shouldIgnorePath(pathname)) {
    return next();
  }

  // Detectar idioma de la URL
  const { locale, cleanPath } = detectLocaleFromPath(pathname);

  // Establecer el idioma en locals para uso en componentes
  locals.locale = locale;
  locals.cleanPath = cleanPath;

  // Lógica de redirección para la página de inicio
  if (pathname === '/') {
    // Detectar idioma preferido del usuario
    const preferredLocale = detectPreferredLocale(request);
    
    // Si el idioma preferido no es el por defecto, redirigir
    if (preferredLocale !== DEFAULT_LOCALE) {
      const redirectUrl = buildLocalizedUrl(url, preferredLocale, '/');
      return redirect(redirectUrl, 302);
    }
  }

  // Verificar rutas inválidas o mal formadas
  if (locale !== DEFAULT_LOCALE) {
    // Si tenemos un prefijo de idioma válido pero la ruta está mal formada
    const segments = pathname.split('/').filter(Boolean);
    if (segments[0] === locale && segments.length === 1) {
      // Ruta como /en/ sin nada más, redirigir a /en
      const correctedUrl = buildLocalizedUrl(url, locale, '/');
      return redirect(correctedUrl, 301);
    }
  }

  // Manejar rutas 404 con idioma específico
  const isApiRoute = pathname.startsWith('/api/');
  if (!isApiRoute) {
    // Añadir información del idioma para el manejo de errores
    locals.localeInfo = {
      current: locale,
      available: LOCALES,
      default: DEFAULT_LOCALE,
      isDefault: locale === DEFAULT_LOCALE
    };
  }

  // Log para debugging (solo en desarrollo)
  if (import.meta.env.DEV) {
    console.log(`[i18n] ${pathname} -> locale: ${locale}, cleanPath: ${cleanPath}`);
  }

  // Continuar con la request
  const response = await next();

  // Añadir headers de idioma
  if (response.headers) {
    response.headers.set('Content-Language', locale);
    
    // Añadir headers de cache para diferentes idiomas
    if (locale !== DEFAULT_LOCALE) {
      response.headers.set('Vary', 'Accept-Language');
    }
  }

  return response;
});

// Función helper para uso en componentes
export function getLocaleFromUrl(url) {
  if (typeof url === 'string') {
    url = new URL(url, 'http://localhost');
  }
  return detectLocaleFromPath(url.pathname);
}

// Función helper para construir URLs localizadas
export function localizeUrl(path, locale = DEFAULT_LOCALE, baseUrl = '') {
  // Limpiar path
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  if (locale === DEFAULT_LOCALE) {
    return `${baseUrl}${cleanPath}`;
  } else {
    const localizedPath = cleanPath === '/' ? `/${locale}` : `/${locale}${cleanPath}`;
    return `${baseUrl}${localizedPath}`;
  }
}

// Función helper para obtener todas las variantes de idioma de una URL
export function getAlternateUrls(path, baseUrl = '') {
  const urls = {};
  
  LOCALES.forEach(locale => {
    urls[locale] = localizeUrl(path, locale, baseUrl);
  });
  
  return urls;
}

// Exportar constantes para uso en otros módulos
export { LOCALES, DEFAULT_LOCALE };