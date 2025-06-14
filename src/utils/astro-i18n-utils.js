import { I18nConfig } from '../i18n/config.js';

/**
 * Helper para obtener información de i18n en componentes Astro (NATIVO)
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Object} - Información de i18n
 */
export function getI18nInfo(Astro) {
  // 🚀 USAR SOLO SISTEMA NATIVO DE ASTRO
  const locale = Astro.currentLocale || 'es';
  
  // Para cleanPath, extraerlo de la URL actual
  let cleanPath = Astro.url.pathname;
  
  // Si es una URL con prefijo de idioma, extraer la ruta limpia
  const localeMatch = cleanPath.match(/^\/([a-z]{2})(\/.*)?$/);
  if (localeMatch) {
    const [, detectedLocale, restOfPath] = localeMatch;
    if (['es', 'en', 'val'].includes(detectedLocale)) {
      cleanPath = restOfPath || '/';
    }
  }
  
  const i18n = I18nConfig.getInstance();
  
  return {
    locale,
    cleanPath,
    localeInfo: i18n.getLocaleInfo(locale),
    defaultLocale: i18n.getDefaultLocale(),
    availableLocales: i18n.getLocales(),
    isDefaultLocale: locale === i18n.getDefaultLocale(),
    i18n
  };
}

/**
 * Helper para generar enlaces localizados (NATIVO)
 * @param {string} path - Ruta
 * @param {string} targetLocale - Idioma objetivo (opcional, usa el actual por defecto)
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {string} - URL localizada
 */
export function localizeUrl(path, targetLocale = null, Astro) {
  const { locale: currentLocale, i18n } = getI18nInfo(Astro);
  const locale = targetLocale || currentLocale;
  const baseUrl = Astro.site || '';
  
  // Limpiar la ruta
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // 🚀 USAR LÓGICA DE I18NCONFIG QUE YA TIENES
  return i18n.localizeUrl(cleanPath, locale, baseUrl);
}

/**
 * Helper para obtener URLs alternativas en diferentes idiomas (NATIVO)
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Object} - URLs por idioma
 */
export function getAlternateUrls(Astro) {
  const { cleanPath, i18n } = getI18nInfo(Astro);
  const baseUrl = Astro.site || Astro.url.origin;
  
  // 🚀 USAR MÉTODO DE I18NCONFIG QUE YA TIENES
  return i18n.getAlternateUrls(cleanPath, baseUrl);
}

/**
 * Helper para cambiar idioma manteniendo la misma página
 * @param {string} targetLocale - Idioma objetivo
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {string} - URL en el idioma objetivo
 */
export function switchLanguageUrl(targetLocale, Astro) {
  const { cleanPath } = getI18nInfo(Astro);
  return localizeUrl(cleanPath, targetLocale, Astro);
}

/**
 * Helper para detectar si una URL corresponde al idioma actual
 * @param {string} url - URL a verificar
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {boolean}
 */
export function isCurrentLanguageUrl(url, Astro) {
  const { locale, i18n } = getI18nInfo(Astro);
  const defaultLocale = i18n.getDefaultLocale();
  
  if (locale === defaultLocale) {
    // Para idioma por defecto, verificar que no tenga prefijo de idioma
    return !url.match(/^\/[a-z]{2}\//);
  } else {
    // Para otros idiomas, verificar que tenga el prefijo correcto
    return url.startsWith(`/${locale}/`) || url === `/${locale}`;
  }
}

/**
 * Helper para redireccionar a la versión localizada de una página
 * @param {string} path - Ruta
 * @param {string} preferredLocale - Idioma preferido
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Response|null} - Response de redirección o null si no es necesario
 */
export function redirectToLocale(path, preferredLocale, Astro) {
  const { i18n } = getI18nInfo(Astro);
  
  if (!i18n.getLocales().includes(preferredLocale)) {
    return null;
  }
  
  const localizedUrl = localizeUrl(path, preferredLocale, Astro);
  const currentUrl = Astro.url.pathname;
  
  if (currentUrl !== localizedUrl) {
    return Astro.redirect(localizedUrl, 302);
  }
  
  return null;
}

/**
 * Helper para extraer el idioma de una URL
 * @param {string} url - URL
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Object} - { locale, cleanPath }
 */
export function parseLocaleFromUrl(url, Astro) {
  const { i18n } = getI18nInfo(Astro);
  const pathname = new URL(url, Astro.url.origin).pathname;
  
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/.*)?$/);
  
  if (localeMatch) {
    const [, localeFromUrl, restOfPath] = localeMatch;
    
    if (i18n.getLocales().includes(localeFromUrl)) {
      return {
        locale: localeFromUrl,
        cleanPath: restOfPath || '/'
      };
    }
  }
  
  return {
    locale: i18n.getDefaultLocale(),
    cleanPath: pathname
  };
}

/**
 * Helper para detectar redirecciones automáticas de idioma (opcional)
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Response|null} - Response de redirección o null
 */
export function handleLanguageRedirect(Astro) {
  const { url } = Astro;
  const pathname = url.pathname;
  
  // Solo aplicar en la página raíz
  if (pathname !== '/') return null;
  
  // Obtener idioma preferido del navegador
  const acceptLanguage = Astro.request.headers.get('accept-language');
  if (!acceptLanguage) return null;
  
  const browserLangs = acceptLanguage
    .split(',')
    .map(lang => lang.split(';')[0].split('-')[0].toLowerCase())
    .filter(lang => lang.length === 2);
  
  const { i18n } = getI18nInfo(Astro);
  const availableLocales = i18n.getLocales();
  const defaultLocale = i18n.getDefaultLocale();
  
  // Encontrar primer idioma soportado
  const preferredLocale = browserLangs.find(lang => 
    availableLocales.includes(lang) && lang !== defaultLocale
  );
  
  if (preferredLocale) {
    const redirectUrl = `/${preferredLocale}/`;
    return Astro.redirect(redirectUrl, 302);
  }
  
  return null;
}

/**
 * Helper para obtener traducciones de un namespace
 * @param {string} namespace - Namespace
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Object} - Traducciones del namespace
 */
export function getNamespaceTranslations(namespace, Astro) {
  const { locale, i18n } = getI18nInfo(Astro);
  return i18n.getNamespaceTranslations(namespace, locale);
}

/**
 * Helper mejorado para generar metadatos SEO multiidioma
 * @param {Object} pageData - Datos de la página
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Object} - Metadatos SEO completos
 */
export function getSEOMetadata(pageData, Astro) {
  const { locale, cleanPath, i18n } = getI18nInfo(Astro);
  const baseUrl = Astro.site || Astro.url.origin;
  const alternateUrls = getAlternateUrls(Astro);
  
  // Obtener traducciones básicas
  const siteTitle = i18n.getTranslation('title', locale) || 'El Palleter';
  const siteDescription = i18n.getTranslation('description', locale) || 'Restaurante El Palleter en Benissa';
  
  const title = pageData.title ? `${pageData.title} | ${siteTitle}` : siteTitle;
  const description = pageData.description || siteDescription;
  const canonical = `${baseUrl}${localizeUrl(cleanPath, locale, Astro)}`;
  
  // Generar datos estructurados
  const structuredData = generateStructuredData({
    type: 'WebPage',
    name: title,
    description,
    path: cleanPath,
    includeAlternates: true
  }, Astro);
  
  return {
    title,
    description,
    canonical,
    locale,
    alternates: alternateUrls,
    openGraph: {
      title: pageData.title || siteTitle,
      description,
      url: canonical,
      locale,
      alternateLocales: i18n.getLocales().filter(l => l !== locale)
    },
    twitter: {
      title: pageData.title || siteTitle,
      description
    },
    structuredData
  };
}

/**
 * Helper para formatear fechas según el idioma actual
 * @param {Date} date - Fecha
 * @param {Object} Astro - Objeto Astro del componente
 * @param {Object} options - Opciones de formateo
 * @returns {string} - Fecha formateada
 */
export function formatDate(date, Astro, options = {}) {
  const { locale, i18n } = getI18nInfo(Astro);
  return i18n.formatDate(date, locale, options);
}

/**
 * Helper para formatear números según el idioma actual
 * @param {number} number - Número
 * @param {Object} Astro - Objeto Astro del componente
 * @param {Object} options - Opciones de formateo
 * @returns {string} - Número formateado
 */
export function formatNumber(number, Astro, options = {}) {
  const { locale, i18n } = getI18nInfo(Astro);
  return i18n.formatNumber(number, locale, options);
}

/**
 * Helper para formatear precios según el idioma actual
 * @param {number} amount - Cantidad
 * @param {Object} Astro - Objeto Astro del componente
 * @param {string} currency - Moneda
 * @returns {string} - Precio formateado
 */
export function formatPrice(amount, Astro, currency = 'EUR') {
  const { locale, i18n } = getI18nInfo(Astro);
  return i18n.formatCurrency(amount, currency, locale);
}

/**
 * Helper para obtener la dirección del texto según el idioma
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {string} - 'ltr' o 'rtl'
 */
export function getTextDirection(Astro) {
  const { locale, i18n } = getI18nInfo(Astro);
  const localeInfo = i18n.getLocaleInfo(locale);
  return localeInfo.direction || 'ltr';
}

/**
 * Helper para generar breadcrumbs localizados
 * @param {Array} breadcrumbs - Array de breadcrumbs
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Array} - Breadcrumbs localizados
 */
export function localizeBreadcrumbs(breadcrumbs, Astro) {
  const { locale, i18n } = getI18nInfo(Astro);
  
  return breadcrumbs.map(crumb => ({
    ...crumb,
    url: localizeUrl(crumb.path, locale, Astro),
    name: crumb.titleKey 
      ? i18n.getTranslation(crumb.titleKey, locale) 
      : crumb.name
  }));
}

/**
 * Helper mejorado para generar JSON-LD estructurado multiidioma
 * @param {Object} data - Datos estructurados
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Object} - JSON-LD
 */
export function generateStructuredData(data, Astro) {
  const { locale, i18n } = getI18nInfo(Astro);
  const baseUrl = Astro.site || Astro.url.origin;
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": data.type || "WebPage",
    "@language": locale,
    "url": `${baseUrl}${localizeUrl(data.path || '/', locale, Astro)}`,
    "name": data.nameKey 
      ? i18n.getTranslation(data.nameKey, locale) 
      : data.name,
    "description": data.descriptionKey 
      ? i18n.getTranslation(data.descriptionKey, locale) 
      : data.description,
    "inLanguage": locale,
    "potentialAction": {
      "@type": "ReadAction",
      "target": `${baseUrl}${localizeUrl(data.path || '/', locale, Astro)}`
    }
  };

  // Añadir URLs alternativas
  if (data.includeAlternates !== false) {
    const alternateUrls = getAlternateUrls(Astro);
    structuredData.alternateName = Object.entries(alternateUrls)
      .filter(([lang]) => lang !== locale)
      .map(([lang, url]) => ({
        "@type": "URL",
        "url": url,
        "inLanguage": lang
      }));
  }

  return structuredData;
}

/**
 * Helper para detectar si estamos en modo desarrollo
 * @returns {boolean}
 */
export function isDev() {
  return import.meta.env.DEV;
}

/**
 * Helper para logging con información de idioma
 * @param {string} message - Mensaje
 * @param {Object} Astro - Objeto Astro del componente
 * @param {string} level - Nivel de log
 */
export function logWithLocale(message, Astro, level = 'log') {
  if (isDev()) {
    const { locale } = getI18nInfo(Astro);
    console[level](`[${locale}] ${message}`);
  }
}

/**
 * Clase helper para manejo de errores de i18n
 */
export class I18nError extends Error {
  constructor(message, locale, key) {
    super(message);
    this.name = 'I18nError';
    this.locale = locale;
    this.key = key;
  }
}

/**
 * Helper para detectar si estamos en modo desarrollo
 * @returns {boolean}
 */
export function isDev() {
  return import.meta.env.DEV;
}

/**
 * Helper para manejar errores de traducción de forma robusta (NATIVO)
 * @param {string} key - Clave de traducción
 * @param {Object} Astro - Objeto Astro del componente
 * @param {string} fallback - Texto de fallback
 * @returns {string} - Traducción o fallback
 */
export function safeTranslation(key, Astro, fallback = null) {
  try {
    const { locale, i18n } = getI18nInfo(Astro);
    
    // CARGAR TRADUCCIONES SI ES NECESARIO
    // Si las traducciones están cargadas, usarlas
    const translation = i18n.getTranslation(key, locale);
    if (translation && translation !== key) {
      return translation;
    }
    
    // Fallback
    return fallback || key;
    
  } catch (error) {
    if (isDev()) {
      console.warn(`[i18n] Error getting translation for key: ${key}`, error);
    }
    return fallback || key;
  }
}