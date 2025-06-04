import { I18nConfig } from '../i18n/config.js';

/**
 * Helper para obtener información de i18n en componentes Astro
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Object} - Información de i18n
 */
export function getI18nInfo(Astro) {
  // Obtener idioma desde locals (establecido por el middleware)
  const locale = Astro.locals.locale || 'es';
  const cleanPath = Astro.locals.cleanPath || Astro.url.pathname;
  const localeInfo = Astro.locals.localeInfo || {};

  const i18n = I18nConfig.getInstance();
  
  return {
    locale,
    cleanPath,
    localeInfo,
    defaultLocale: i18n.getDefaultLocale(),
    availableLocales: i18n.getLocales(),
    isDefaultLocale: locale === i18n.getDefaultLocale(),
    i18n
  };
}

/**
 * Helper para obtener URLs alternativas en diferentes idiomas
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Object} - URLs por idioma
 */
export function getAlternateUrls(Astro) {
  const { cleanPath, i18n } = getI18nInfo(Astro);
  const baseUrl = Astro.site || Astro.url.origin;
  
  return i18n.getAlternateUrls(cleanPath, baseUrl);
}

/**
 * Helper para generar enlaces localizados
 * @param {string} path - Ruta
 * @param {string} targetLocale - Idioma objetivo
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {string} - URL localizada
 */
export function localizeUrl(path, targetLocale, Astro) {
  const { i18n } = getI18nInfo(Astro);
  const baseUrl = Astro.site || '';
  
  return i18n.localizeUrl(path, targetLocale, baseUrl);
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
 * Helper para obtener metadatos de SEO multiidioma
 * @param {Object} pageData - Datos de la página
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Object} - Metadatos SEO
 */
export function getSEOMetadata(pageData, Astro) {
  const { locale, cleanPath, i18n } = getI18nInfo(Astro);
  const baseUrl = Astro.site || Astro.url.origin;
  const alternateUrls = getAlternateUrls(Astro);
  
  // Obtener traducciones básicas
  const siteTitle = i18n.getTranslation('hero.title', locale);
  const siteDescription = i18n.getTranslation('hero.description', locale);
  
  return {
    title: pageData.title ? `${pageData.title} | ${siteTitle}` : siteTitle,
    description: pageData.description || siteDescription,
    canonical: `${baseUrl}${i18n.localizeUrl(cleanPath, locale)}`,
    locale: locale,
    alternates: alternateUrls,
    openGraph: {
      title: pageData.title || siteTitle,
      description: pageData.description || siteDescription,
      url: `${baseUrl}${i18n.localizeUrl(cleanPath, locale)}`,
      locale: locale,
      alternateLocales: i18n.getLocales().filter(l => l !== locale)
    },
    twitter: {
      title: pageData.title || siteTitle,
      description: pageData.description || siteDescription
    }
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
    url: i18n.localizeUrl(crumb.path, locale),
    name: crumb.titleKey 
      ? i18n.getTranslation(crumb.titleKey, locale) 
      : crumb.name
  }));
}

/**
 * Helper para generar JSON-LD estructurado multiidioma
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
    "url": `${baseUrl}${i18n.localizeUrl(data.path || '/', locale)}`,
    "name": data.nameKey 
      ? i18n.getTranslation(data.nameKey, locale) 
      : data.name,
    "description": data.descriptionKey 
      ? i18n.getTranslation(data.descriptionKey, locale) 
      : data.description,
    "inLanguage": locale,
    "potentialAction": {
      "@type": "ReadAction",
      "target": `${baseUrl}${i18n.localizeUrl(data.path || '/', locale)}`
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
 * Helper para manejar errores de traducción de forma robusta
 * @param {string} key - Clave de traducción
 * @param {Object} Astro - Objeto Astro del componente
 * @param {string} fallback - Texto de fallback
 * @returns {string} - Traducción o fallback
 */
export function safeTranslation(key, Astro, fallback = null) {
  try {
    const { locale, i18n } = getI18nInfo(Astro);
    const translation = i18n.getTranslation(key, locale);
    
    if (translation === key && fallback) {
      return fallback;
    }
    
    return translation;
  } catch (error) {
    if (isDev()) {
      console.warn(`[i18n] Error getting translation for key: ${key}`, error);
    }
    return fallback || key;
  }
}