import { I18nRepository } from '../repositories/I18nRepository.js';

/**
 * Configuración de idiomas disponibles
 */
export const LANGUAGE_CONFIG = {
  es: {
    code: 'es',
    name: 'Español',
    nativeName: 'Español',
    shortName: 'ES',
    isDefault: true,
    flag: {
      value: '/flags/spain.svg'
    },
    direction: 'ltr'
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    shortName: 'EN',
    isDefault: false,
    flag: {
      value: '/flags/united-kingdom.svg'
    },
    direction: 'ltr'
  },
  val: {
    code: 'val',
    name: 'Valenciano',
    nativeName: 'Valencià',
    shortName: 'VAL',
    isDefault: false,
    flag: {
      value: '/flags/valencia.svg'
    },
    direction: 'ltr'
  }
};

// Constantes derivadas
export const LOCALES = Object.keys(LANGUAGE_CONFIG);
export const DEFAULT_LOCALE = Object.values(LANGUAGE_CONFIG).find(lang => lang.isDefault)?.code || 'es';

/**
 * Clase para manejar banderas (SVG)
 */
export class FlagRenderer {
  static renderFlag(flagConfig, className = '', size = '1rem') {
    return `<img src="${flagConfig.value}" alt="" class="flag-svg ${className}" style="width: ${size}; height: ${size};" aria-hidden="true" />`;
  }

  static getFlagElement(flagConfig) {
    return {
      type: 'svg',
      value: flagConfig.value,
      isSvg: true
    };
  }
}

/**
 * Estado del servicio (a nivel de módulo)
 */
const state = {
  translations: new Map(),
  languages: Object.values(LANGUAGE_CONFIG),
  defaultLanguage: Object.values(LANGUAGE_CONFIG).find(lang => lang.isDefault),
  loaded: false,
  loading: false,
  loadPromise: null
};

/**
 * Servicio de internacionalización
 * Gestiona traducciones, URLs multiidioma, formateo y SEO
 */
export class I18nService {

  // ===============================================
  // INICIALIZACIÓN Y CARGA DESDE BACKEND
  // ===============================================

  /**
   * Inicializa el servicio cargando traducciones desde el backend
   */
  static async init() {
    if (!state.loaded && !state.loading) {
      await this.loadAllTranslations();
    }
    return this;
  }

  /**
   * Carga todas las traducciones desde el backend con protección contra carga múltiple
   */
  static async loadAllTranslations() {
    if (state.loaded) return;

    if (state.loading && state.loadPromise) {
      return await state.loadPromise;
    }

    state.loading = true;
    state.loadPromise = this._performLoad();

    try {
      await state.loadPromise;
    } finally {
      state.loading = false;
      state.loadPromise = null;
    }
  }
  
  /**
   * Ejecuta la carga real de traducciones desde el repositorio
   */
  static async _performLoad() {
    try {
      const flatTranslations = await I18nRepository.getAllFlatTranslations(LOCALES);

      Object.entries(flatTranslations).forEach(([locale, translations]) => {
        if (!translations || typeof translations !== 'object') {
          console.warn(`[I18nService] Warning: Invalid translations for ${locale}`);
          state.translations.set(locale, {});
          return;
        }

        state.translations.set(locale, translations);

        if (import.meta.env.DEV) {
          console.log(`[I18nService] Loaded ${Object.keys(translations).length} translations for ${locale}`);
        }
      });

      state.loaded = true;

      if (import.meta.env.DEV) {
        console.log(`[I18nService] Initialized with ${state.languages.length} languages:`,
          state.languages.map(l => l.code).join(', '));
      }

    } catch (error) {
      console.error('[I18nService] Error loading translations from backend:', error);
      
      LOCALES.forEach(locale => {
        state.translations.set(locale, {});
      });
      
      state.loaded = true;
      
      throw error;
    }
  }

  /**
   * Recarga las traducciones desde el backend
   */
  static async reload() {
    state.loaded = false;
    state.loading = false;
    state.loadPromise = null;
    state.translations.clear();
    
    await this.init();
    
    if (import.meta.env.DEV) {
      console.log('[I18nService] Translations reloaded from backend');
    }
  }

  // ===============================================
  // GESTIÓN DE URLs
  // ===============================================

  /**
   * Obtiene la URL base actual de forma dinámica
   */
  static getCurrentOrigin(Astro) {
    if (Astro?.url?.origin) {
      return Astro.url.origin;
    }
    
    if (Astro?.site) {
      return Astro.site.toString().replace(/\/$/, '');
    }
    
    return '';
  }

  /**
   * Genera URL relativa para navegación (SIN dominio)
   */
  static getRelativeUrl(path, locale = DEFAULT_LOCALE) {
    let cleanPath = path?.replace(/^\/+|\/+$/g, '') || '';
    
    if (locale === DEFAULT_LOCALE) {
      return cleanPath === '' ? '/' : `/${cleanPath}`;
    }
    
    return cleanPath === '' ? `/${locale}` : `/${locale}/${cleanPath}`;
  }

  /**
   * Genera URL completa (CON dominio) para SEO/metadatos
   */
  static getAbsoluteUrl(path, locale = DEFAULT_LOCALE, Astro) {
    const origin = this.getCurrentOrigin(Astro);
    const relativePath = this.getRelativeUrl(path, locale);
    
    return origin ? `${origin}${relativePath}` : relativePath;
  }

  /**
   * Obtiene todas las variantes de URL para diferentes idiomas
   */
  static getAlternateUrls(path, Astro = null, absolute = false) {
    const urls = {};

    LOCALES.forEach(locale => {
      if (absolute && Astro) {
        urls[locale] = this.getAbsoluteUrl(path, locale, Astro);
      } else {
        urls[locale] = this.getRelativeUrl(path, locale);
      }
    });

    return urls;
  }

  /**
   * Detecta el idioma de una URL
   */
  static detectLocaleFromPath(pathname) {
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
      return { locale: DEFAULT_LOCALE, cleanPath: '/' };
    }

    const firstSegment = segments[0];

    if (LOCALES.includes(firstSegment) && firstSegment !== DEFAULT_LOCALE) {
      const cleanPath = '/' + segments.slice(1).join('/');
      return {
        locale: firstSegment,
        cleanPath: cleanPath === '' ? '/' : cleanPath
      };
    }

    return { locale: DEFAULT_LOCALE, cleanPath: pathname };
  }

  // ===============================================
  // GESTIÓN DE TRADUCCIONES
  // ===============================================

  /**
   * Obtiene una traducción
   */
  static getTranslation(key, locale = DEFAULT_LOCALE, params = {}) {
    if (!state.loaded) {
      if (import.meta.env.DEV) {
        console.warn('[I18nService] Translations not loaded yet for key:', key);
      }
      return key;
    }

    const localeTranslations = state.translations.get(locale);
    if (!localeTranslations) {
      if (import.meta.env.DEV) {
        console.warn(`[I18nService] No translations found for locale: ${locale}`);
      }
      return key;
    }

    let translation = localeTranslations[key];

    if (!translation && locale !== DEFAULT_LOCALE) {
      const defaultTranslations = state.translations.get(DEFAULT_LOCALE);
      translation = defaultTranslations?.[key];
    }

    if (!translation) {
      if (import.meta.env.DEV) {
        console.warn(`[I18nService] Missing translation for key: ${key} (locale: ${locale})`);
      }
      return key;
    }

    if (params && Object.keys(params).length > 0) {
      translation = this.replaceParams(translation, params);
    }

    return translation;
  }

  /**
   * Reemplaza parámetros en una traducción
   */
  static replaceParams(text, params) {
    let result = text;

    for (const [key, value] of Object.entries(params)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  /**
   * Obtiene todas las traducciones para un idioma
   */
  static getAllTranslations(locale) {
    return state.translations.get(locale) || {};
  }

  /**
   * Verifica si existe una traducción
   */
  static hasTranslation(key, locale) {
    const translations = state.translations.get(locale);
    return translations && key in translations;
  }

  /**
   * Obtiene todas las traducciones para un namespace específico
   */
  static getNamespaceTranslations(namespace, locale = DEFAULT_LOCALE) {
    if (!state.loaded) {
      console.warn('[I18nService] Translations not loaded.');
      return {};
    }

    const allTranslations = this.getAllTranslations(locale);
    const namespaceTranslations = {};

    const prefix = `${namespace}.`;
    for (const [key, value] of Object.entries(allTranslations)) {
      if (key.startsWith(prefix)) {
        const shortKey = key.substring(prefix.length);
        namespaceTranslations[shortKey] = value;
      }
    }

    return namespaceTranslations;
  }

  /**
   * Obtiene estadísticas de traducciones
   */
  static getStats() {
    const stats = {};

    for (const locale of LOCALES) {
      const translations = state.translations.get(locale) || {};
      stats[locale] = {
        total: Object.keys(translations).length,
        missing: []
      };
    }

    const defaultKeys = Object.keys(state.translations.get(DEFAULT_LOCALE) || {});

    for (const locale of LOCALES) {
      if (locale === DEFAULT_LOCALE) continue;

      const localeKeys = Object.keys(state.translations.get(locale) || {});
      const missing = defaultKeys.filter(key => !localeKeys.includes(key));
      stats[locale].missing = missing;
    }

    return stats;
  }

  // ===============================================
  // GESTIÓN DE IDIOMAS
  // ===============================================

  /**
   * Obtiene lista de idiomas disponibles
   */
  static getAvailableLanguages() {
    return state.languages;
  }

  /**
   * Obtiene el idioma por defecto
   */
  static getDefaultLanguage() {
    return state.defaultLanguage;
  }

  /**
   * Obtiene información de un idioma específico
   */
  static getLanguage(code) {
    return state.languages.find(lang => lang.code === code);
  }

  /**
   * Obtiene códigos de idiomas disponibles
   */
  static getLanguageCodes() {
    return LOCALES;
  }

  /**
   * Verifica si un código de idioma es válido
   */
  static isValidLanguage(code) {
    return LOCALES.includes(code);
  }

  /**
   * Obtiene información completa del idioma
   */
  static getLocaleInfo(locale) {
    return LANGUAGE_CONFIG[locale] || LANGUAGE_CONFIG[DEFAULT_LOCALE];
  }

  // ===============================================
  // FORMATEO
  // ===============================================

  /**
   * Formatea una fecha según el idioma
   */
  static formatDate(date, locale = DEFAULT_LOCALE, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    const formatOptions = { ...defaultOptions, ...options };

    try {
      return new Intl.DateTimeFormat(locale, formatOptions).format(date);
    } catch (error) {
      console.warn(`[I18nService] Error formatting date for locale ${locale}:`, error);
      return date.toLocaleDateString();
    }
  }

  /**
   * Formatea un número según el idioma
   */
  static formatNumber(number, locale = DEFAULT_LOCALE, options = {}) {
    try {
      return new Intl.NumberFormat(locale, options).format(number);
    } catch (error) {
      console.warn(`[I18nService] Error formatting number for locale ${locale}:`, error);
      return number.toString();
    }
  }

  /**
   * Formatea una moneda según el idioma
   */
  static formatCurrency(amount, currency = 'EUR', locale = DEFAULT_LOCALE) {
    return this.formatNumber(amount, locale, {
      style: 'currency',
      currency: currency
    });
  }

  // ===============================================
  // HELPERS PARA ASTRO
  // ===============================================

  /**
   * Helper principal para obtener información de i18n en componentes Astro
   */
  static getI18nInfo(Astro) {
    const locale = Astro.currentLocale || DEFAULT_LOCALE;

    let cleanPath = Astro.url.pathname;

    const localeMatch = cleanPath.match(/^\/([a-z]{2,3})(\/.*)?$/);
    if (localeMatch) {
      const [, detectedLocale, restOfPath] = localeMatch;
      if (this.isValidLanguage(detectedLocale)) {
        cleanPath = restOfPath || '/';
      }
    }

    return {
      locale,
      cleanPath,
      localeInfo: this.getLocaleInfo(locale),
      defaultLocale: DEFAULT_LOCALE,
      availableLocales: this.getLanguageCodes(),
      isDefaultLocale: locale === DEFAULT_LOCALE,
      i18n: this
    };
  }

  /**
   * Helper para generar enlaces localizados con Astro
   */
  static localizeUrlWithAstro(path, targetLocale = null, Astro, absolute = false) {
    const { locale: currentLocale } = this.getI18nInfo(Astro);
    const locale = targetLocale || currentLocale;

    const cleanPath = path?.startsWith('/') ? path : `/${path || ''}`;
    
    if (absolute) {
      return this.getAbsoluteUrl(cleanPath, locale, Astro);
    } else {
      return this.getRelativeUrl(cleanPath, locale);
    }
  }

  /**
   * Helper para obtener URLs alternativas con Astro
   */
  static getAlternateUrlsWithAstro(Astro, absolute = false) {
    const { cleanPath } = this.getI18nInfo(Astro);
    return this.getAlternateUrls(cleanPath, Astro, absolute);
  }

  /**
   * Helper para cambiar idioma manteniendo la misma página
   */
  static switchLanguageUrl(targetLocale, Astro, absolute = false) {
    const { cleanPath } = this.getI18nInfo(Astro);
    return this.localizeUrlWithAstro(cleanPath, targetLocale, Astro, absolute);
  }

  /**
   * Helper robusto para obtener traducciones con Astro
   */
  static safeTranslation(key, Astro, fallback, params = {}) {
    try {
      const { locale } = this.getI18nInfo(Astro);

      const translation = this.getTranslation(key, locale, params);
      if (translation && translation !== key) {
        return translation;
      }

      return fallback || key;

    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn(`[I18nService] Error getting translation for key: ${key}`, error);
      }
      return fallback || key;
    }
  }

  /**
   * Helper para formatear fechas con Astro
   */
  static formatDateWithAstro(date, Astro, options = {}) {
    const { locale } = this.getI18nInfo(Astro);
    return this.formatDate(date, locale, options);
  }

  /**
   * Helper para formatear números con Astro
   */
  static formatNumberWithAstro(number, Astro, options = {}) {
    const { locale } = this.getI18nInfo(Astro);
    return this.formatNumber(number, locale, options);
  }

  /**
   * Helper para formatear precios con Astro
   */
  static formatPriceWithAstro(amount, Astro, currency = 'EUR') {
    const { locale } = this.getI18nInfo(Astro);
    return this.formatCurrency(amount, currency, locale);
  }

  /**
   * Helper para obtener dirección del texto con Astro
   */
  static getTextDirectionWithAstro(Astro) {
    const { locale } = this.getI18nInfo(Astro);
    const localeInfo = this.getLocaleInfo(locale);
    return localeInfo.direction || 'ltr';
  }

  /**
   * Genera datos para el language picker con Astro
   */
  static getLanguagePickerData(currentLocale, currentPath, absolute = false, Astro = null) {
    return state.languages.map(lang => ({
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      shortName: lang.shortName,
      flag: FlagRenderer.getFlagElement(lang.flag),
      url: absolute && Astro 
        ? this.getAbsoluteUrl(currentPath, lang.code, Astro)
        : this.getRelativeUrl(currentPath, lang.code),
      isActive: lang.code === currentLocale,
      direction: lang.direction
    }));
  }

  /**
   * Helper conveniente para language picker con Astro
   */
  static getLanguagePickerDataWithAstro(Astro, absolute = false) {
    const { locale, cleanPath } = this.getI18nInfo(Astro);
    return this.getLanguagePickerData(locale, cleanPath, absolute, Astro);
  }

  // ===============================================
  // SEO Y METADATOS
  // ===============================================

  static getSEOMetadata(pageData, Astro) {
    const { locale, cleanPath } = this.getI18nInfo(Astro);
    const alternateUrls = this.getAlternateUrlsWithAstro(Astro, true);

    const siteTitle = this.getTranslation('title', locale) || 'El Palleter';
    const siteDescription = this.getTranslation('description', locale) || 'Restaurante El Palleter en Benissa';

    const title = pageData.title ? `${pageData.title} | ${siteTitle}` : siteTitle;
    const description = pageData.description || siteDescription;
    const canonical = this.getAbsoluteUrl(cleanPath, locale, Astro);

    const structuredData = this.generateStructuredData({
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
        alternateLocales: this.getLanguageCodes().filter(l => l !== locale)
      },
      twitter: {
        title: pageData.title || siteTitle,
        description
      },
      structuredData
    };
  }

  /**
   * Helper para generar JSON-LD estructurado multiidioma
   */
  static generateStructuredData(data, Astro) {
    const { locale } = this.getI18nInfo(Astro);

    const structuredData = {
      "@context": "https://schema.org",
      "@type": data.type || "WebPage",
      "@language": locale,
      "url": this.getAbsoluteUrl(data.path || '/', locale, Astro),
      "name": data.nameKey
        ? this.getTranslation(data.nameKey, locale)
        : data.name,
      "description": data.descriptionKey
        ? this.getTranslation(data.descriptionKey, locale)
        : data.description,
      "inLanguage": locale,
      "potentialAction": {
        "@type": "ReadAction",
        "target": this.getAbsoluteUrl(data.path || '/', locale, Astro)
      }
    };

    if (data.includeAlternates !== false) {
      const alternateUrls = this.getAlternateUrlsWithAstro(Astro, true);
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

  // ===============================================
  // UTILIDADES
  // ===============================================

  /**
   * Helper para detectar si una URL corresponde al idioma actual
   */
  static isCurrentLanguageUrl(url, Astro) {
    const { locale } = this.getI18nInfo(Astro);

    if (locale === DEFAULT_LOCALE) {
      return !url.match(/^\/[a-z]{2,3}\//);
    } else {
      return url.startsWith(`/${locale}/`) || url === `/${locale}`;
    }
  }

  /**
   * Helper para detectar redirecciones automáticas de idioma
   */
  static handleLanguageRedirect(Astro) {
    const { url } = Astro;
    const pathname = url.pathname;

    if (pathname !== '/') return null;

    const acceptLanguage = Astro.request.headers.get('accept-language');
    if (!acceptLanguage) return null;

    const browserLangs = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].split('-')[0].toLowerCase())
      .filter(lang => lang.length >= 2);

    const availableLocales = this.getLanguageCodes();

    const preferredLocale = browserLangs.find(lang =>
      availableLocales.includes(lang) && lang !== DEFAULT_LOCALE
    );

    if (preferredLocale) {
      const redirectUrl = `/${preferredLocale}/`;
      return Astro.redirect(redirectUrl, 302);
    }

    return null;
  }

  /**
   * Renderiza una bandera
   */
  static renderFlag(flagConfig, className = '', size = '1rem') {
    return FlagRenderer.renderFlag(flagConfig, className, size);
  }

  /**
   * Helper para detectar si estamos en modo desarrollo
   */
  static isDev() {
    return import.meta.env.DEV;
  }

  /**
   * Helper para logging con información de idioma
   */
  static logWithLocale(message, Astro, level = 'log') {
    if (this.isDev()) {
      const { locale } = this.getI18nInfo(Astro);
      console[level](`[${locale}] ${message}`);
    }
  }
}

// Auto-inicialización en servidor
if (typeof window === 'undefined') {
  I18nService.init().catch(console.error);
}

// ===============================================
// FUNCIONES DE CONVENIENCIA
// ===============================================

/**
 * Función helper para obtener traducciones
 */
export async function getTranslation(key, locale = DEFAULT_LOCALE, params = {}) {
  if (!state.loaded) {
    await I18nService.init();
  }

  return I18nService.getTranslation(key, locale, params);
}

/**
 * Función helper para obtener datos del language picker con Astro
 */
export async function getLanguagePickerData(Astro, absolute = false) {
  if (!state.loaded) {
    await I18nService.init();
  }

  return I18nService.getLanguagePickerDataWithAstro(Astro, absolute);
}

/**
 * Hook para precargar traducciones en el servidor
 */
export async function preloadTranslations() {
  await I18nService.init();
  return I18nService;
}

export default I18nService;