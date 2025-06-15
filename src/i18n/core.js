import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📁 Configuración de rutas
const TRANSLATIONS_DIR = path.join(__dirname, './translations');

/**
 * 🎯 CONFIGURACIÓN CENTRAL DE IDIOMAS - ÚNICA FUENTE DE VERDAD
 * Solo necesitas modificar este objeto para añadir/cambiar idiomas
 */
export const LANGUAGE_CONFIG = {
  es: {
    code: 'es',
    name: 'Español',
    nativeName: 'Español',
    shortName: 'ES',
    isDefault: true,
    flag: {
      type: 'emoji',
      value: '🇪🇸'
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
      type: 'emoji',
      value: '🇬🇧'
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
      type: 'svg',
      value: '/flags/valencia.svg'
    },
    direction: 'ltr'
  }
};

// 🔧 Constantes derivadas (se generan automáticamente)
export const LOCALES = Object.keys(LANGUAGE_CONFIG);
export const DEFAULT_LOCALE = Object.values(LANGUAGE_CONFIG).find(lang => lang.isDefault)?.code || 'es';

/**
 * 🎨 Clase para manejar banderas (emoji o SVG)
 */
export class FlagRenderer {
  static renderFlag(flagConfig, className = '', size = '1rem') {
    if (flagConfig.type === 'emoji') {
      return `<span class="flag-emoji ${className}" style="font-size: ${size};" aria-hidden="true">${flagConfig.value}</span>`;
    } else if (flagConfig.type === 'svg') {
      return `<img src="${flagConfig.value}" alt="" class="flag-svg ${className}" style="width: ${size}; height: ${size};" aria-hidden="true" />`;
    }
    return '';
  }

  static getFlagElement(flagConfig) {
    return {
      type: flagConfig.type,
      value: flagConfig.value,
      isEmoji: flagConfig.type === 'emoji',
      isSvg: flagConfig.type === 'svg'
    };
  }
}

/**
 * 🌍 CLASE PRINCIPAL I18N COMPLETAMENTE UNIFICADA
 * TODO el sistema i18n en una sola clase
 */
export class I18nCore {
  constructor() {
    // Singleton pattern
    if (I18nCore.instance) {
      return I18nCore.instance;
    }

    this.translations = new Map();
    this.languages = Object.values(LANGUAGE_CONFIG);
    this.defaultLanguage = this.languages.find(lang => lang.isDefault);
    this.loaded = false;
    this.loading = false;
    this.loadPromise = null;

    I18nCore.instance = this;
  }

  // ===============================================
  // 🚀 INICIALIZACIÓN Y CARGA
  // ===============================================

  /**
   * 🚀 Inicialización (carga las traducciones)
   */
  async init() {
    if (!this.loaded && !this.loading) {
      await this.loadAllTranslations();
    }
    return this;
  }

  /**
   * 📚 Carga todas las traducciones con protección contra carga múltiple
   */
  async loadAllTranslations() {
    if (this.loaded) return;

    if (this.loading && this.loadPromise) {
      return await this.loadPromise;
    }

    this.loading = true;
    this.loadPromise = this._performLoad();

    try {
      await this.loadPromise;
    } finally {
      this.loading = false;
      this.loadPromise = null;
    }
  }

  async _performLoad() {
    try {
      const loadPromises = LOCALES.map(async (locale) => {
        const translationPath = path.join(TRANSLATIONS_DIR, `${locale}.json`);

        try {
          const content = await fs.readFile(translationPath, 'utf-8');
          const translations = JSON.parse(content);
          const flattened = this.flattenObject(translations);
          this.translations.set(locale, flattened);

          if (import.meta.env.DEV) {
            console.log(`[I18nCore] Loaded ${Object.keys(flattened).length} translations for ${locale}`);
          }
        } catch (error) {
          console.warn(`[I18nCore] Warning: Could not load translations for ${locale}:`, error.message);
          this.translations.set(locale, {});
        }
      });

      await Promise.all(loadPromises);
      this.loaded = true;

      if (import.meta.env.DEV) {
        console.log(`[I18nCore] Initialized with ${this.languages.length} languages:`,
          this.languages.map(l => l.code).join(', '));
      }

    } catch (error) {
      console.error('[I18nCore] Error loading translations:', error);
      throw error;
    }
  }

  getBaseUrl(Astro) {
    return Astro.site?.toString() || '';
  }

  /**
   * 🔧 Aplana un objeto anidado para facilitar el acceso
   */
  flattenObject(obj, prefix = '') {
    const flattened = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  // ===============================================
  // 🔤 GESTIÓN DE TRADUCCIONES
  // ===============================================

  /**
   * 🔤 Obtiene una traducción
   */
  getTranslation(key, locale = DEFAULT_LOCALE, params = {}) {
    if (!this.loaded) {
      if (import.meta.env.DEV) {
        console.warn('[I18nCore] Translations not loaded yet for key:', key);
      }
      return key;
    }

    const localeTranslations = this.translations.get(locale);
    if (!localeTranslations) {
      if (import.meta.env.DEV) {
        console.warn(`[I18nCore] No translations found for locale: ${locale}`);
      }
      return key;
    }

    let translation = localeTranslations[key];

    // Fallback al idioma por defecto
    if (!translation && locale !== DEFAULT_LOCALE) {
      const defaultTranslations = this.translations.get(DEFAULT_LOCALE);
      translation = defaultTranslations?.[key];
    }

    // Si aún no hay traducción, usar la clave
    if (!translation) {
      if (import.meta.env.DEV) {
        console.warn(`[I18nCore] Missing translation for key: ${key} (locale: ${locale})`);
      }
      return key;
    }

    // Reemplazar parámetros
    if (params && Object.keys(params).length > 0) {
      translation = this.replaceParams(translation, params);
    }

    return translation;
  }

  /**
   * 🔄 Reemplaza parámetros en una traducción
   */
  replaceParams(text, params) {
    let result = text;

    for (const [key, value] of Object.entries(params)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  /**
   * 📊 Obtiene todas las traducciones para un idioma
   */
  getAllTranslations(locale) {
    return this.translations.get(locale) || {};
  }

  /**
   * ✅ Verifica si existe una traducción
   */
  hasTranslation(key, locale) {
    const translations = this.translations.get(locale);
    return translations && key in translations;
  }

  /**
   * 📈 Obtiene estadísticas de traducciones
   */
  getStats() {
    const stats = {};

    for (const locale of LOCALES) {
      const translations = this.translations.get(locale) || {};
      stats[locale] = {
        total: Object.keys(translations).length,
        missing: []
      };
    }

    // Encontrar claves faltantes comparando con el idioma por defecto
    const defaultKeys = Object.keys(this.translations.get(DEFAULT_LOCALE) || {});

    for (const locale of LOCALES) {
      if (locale === DEFAULT_LOCALE) continue;

      const localeKeys = Object.keys(this.translations.get(locale) || {});
      const missing = defaultKeys.filter(key => !localeKeys.includes(key));
      stats[locale].missing = missing;
    }

    return stats;
  }

  /**
   * 📁 Obtiene todas las traducciones para un namespace específico
   */
  getNamespaceTranslations(namespace, locale = DEFAULT_LOCALE) {
    if (!this.loaded) {
      console.warn('[I18nCore] Translations not loaded.');
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

  // ===============================================
  // 🌐 GESTIÓN DE IDIOMAS
  // ===============================================

  /**
   * 🌐 Obtiene lista de idiomas disponibles
   */
  getAvailableLanguages() {
    return this.languages;
  }

  /**
   * 🏠 Obtiene el idioma por defecto
   */
  getDefaultLanguage() {
    return this.defaultLanguage;
  }

  /**
   * 🔍 Obtiene información de un idioma específico
   */
  getLanguage(code) {
    return this.languages.find(lang => lang.code === code);
  }

  /**
   * 📝 Obtiene códigos de idiomas disponibles
   */
  getLanguageCodes() {
    return LOCALES;
  }

  /**
   * ✅ Verifica si un código de idioma es válido
   */
  isValidLanguage(code) {
    return LOCALES.includes(code);
  }

  /**
   * 📖 Obtiene información completa del idioma
   */
  getLocaleInfo(locale) {
    return LANGUAGE_CONFIG[locale] || LANGUAGE_CONFIG[DEFAULT_LOCALE];
  }

  /**
   * 🔗 Construye una URL localizada (maneja strings y objetos URL)
   * @param {string|URL|null|undefined} path - Ruta a localizar
   * @param {string} locale - Idioma de destino
   * @param {string} baseUrl - URL base del sitio
   * @returns {string} - URL localizada
   */
  localizeUrl(path, locale = DEFAULT_LOCALE, baseUrl = '') {
    // 🛡️ Manejar diferentes tipos de path
    let cleanPath;


    if (!path) {
      cleanPath = '/';
    } else if (path instanceof URL) {
      // 🔗 Si es un objeto URL, usar pathname
      cleanPath = path.pathname;
    } else if (typeof path === 'string') {
      // 📝 Si es string, usarlo directamente
      cleanPath = path.startsWith('/') ? path : `/${path}`;
    } else {
      // 🔄 Convertir cualquier otra cosa a string
      console.warn(`[I18nCore] Unexpected path type: ${typeof path}, converting to string`);
      cleanPath = String(path);
      cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

      console.log(path);
    }

    // 🧹 Asegurar que cleanPath empiece con /
    if (!cleanPath.startsWith('/')) {
      cleanPath = `/${cleanPath}`;
    }

    if (locale === DEFAULT_LOCALE) {
      return `${baseUrl}${cleanPath}`;
    } else {
      const localizedPath = cleanPath === '/' ? `/${locale}` : `/${locale}${cleanPath}`;
      return `${baseUrl}${localizedPath}`;
    }
  }

  /**
   * 🌍 Obtiene todas las variantes de URL para diferentes idiomas
   */
  getAlternateUrls(path, baseUrl = '') {
    const urls = {};

    LOCALES.forEach(locale => {
      urls[locale] = this.localizeUrl(path, locale, baseUrl);
    });

    return urls;
  }

  /**
   * 🧭 Detecta el idioma de una URL
   */
  detectLocaleFromPath(pathname) {
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
  // 📅 FORMATEO
  // ===============================================

  /**
   * 📅 Formatea una fecha según el idioma
   */
  formatDate(date, locale = DEFAULT_LOCALE, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    const formatOptions = { ...defaultOptions, ...options };

    try {
      return new Intl.DateTimeFormat(locale, formatOptions).format(date);
    } catch (error) {
      console.warn(`[I18nCore] Error formatting date for locale ${locale}:`, error);
      return date.toLocaleDateString();
    }
  }

  /**
   * 🔢 Formatea un número según el idioma
   */
  formatNumber(number, locale = DEFAULT_LOCALE, options = {}) {
    try {
      return new Intl.NumberFormat(locale, options).format(number);
    } catch (error) {
      console.warn(`[I18nCore] Error formatting number for locale ${locale}:`, error);
      return number.toString();
    }
  }

  /**
   * 💰 Formatea una moneda según el idioma
   */
  formatCurrency(amount, currency = 'EUR', locale = DEFAULT_LOCALE) {
    return this.formatNumber(amount, locale, {
      style: 'currency',
      currency: currency
    });
  }

  // ===============================================
  // 🔧 HELPERS PARA ASTRO
  // ===============================================

  /**
   * 🌍 Helper principal para obtener información de i18n en componentes Astro
   */
  getI18nInfo(Astro) {
    // Obtener locale desde Astro (nativo)
    const locale = Astro.currentLocale || DEFAULT_LOCALE;

    // Extraer cleanPath de la URL actual
    let cleanPath = Astro.url.pathname;

    // Si es una URL con prefijo de idioma, extraer la ruta limpia
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
   * 🔗 Helper para generar enlaces localizados con Astro
   */
  localizeUrlWithAstro(path, targetLocale = null, Astro) {
    const { locale: currentLocale } = this.getI18nInfo(Astro);
    const locale = targetLocale || currentLocale;

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return this.localizeUrl(cleanPath, locale, this.getBaseUrl(Astro));
  }

  /**
   * 🌐 Helper para obtener URLs alternativas con Astro
   */
  getAlternateUrlsWithAstro(Astro) {
    const { cleanPath } = this.getI18nInfo(Astro);

    return this.getAlternateUrls(cleanPath, this.getBaseUrl(Astro));
  }

  /**
   * 🔄 Helper para cambiar idioma manteniendo la misma página
   */
  switchLanguageUrl(targetLocale, Astro) {
    const { cleanPath } = this.getI18nInfo(Astro);
    return this.localizeUrlWithAstro(cleanPath, targetLocale, Astro);
  }

  /**
   * 🔤 Helper robusto para obtener traducciones con Astro
   */
  safeTranslation(key, Astro, fallback, params = {}) {
    try {
      const { locale } = this.getI18nInfo(Astro);

      const translation = this.getTranslation(key, locale, params);
      if (translation && translation !== key) {
        return translation;
      }

      return fallback || key;

    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn(`[I18nCore] Error getting translation for key: ${key}`, error);
      }
      return fallback || key;
    }
  }

  /**
   * 📅 Helper para formatear fechas con Astro
   */
  formatDateWithAstro(date, Astro, options = {}) {
    const { locale } = this.getI18nInfo(Astro);
    return this.formatDate(date, locale, options);
  }

  /**
   * 🔢 Helper para formatear números con Astro
   */
  formatNumberWithAstro(number, Astro, options = {}) {
    const { locale } = this.getI18nInfo(Astro);
    return this.formatNumber(number, locale, options);
  }

  /**
   * 💰 Helper para formatear precios con Astro
   */
  formatPriceWithAstro(amount, Astro, currency = 'EUR') {
    const { locale } = this.getI18nInfo(Astro);
    return this.formatCurrency(amount, currency, locale);
  }

  /**
   * 📖 Helper para obtener dirección del texto con Astro
   */
  getTextDirectionWithAstro(Astro) {
    const { locale } = this.getI18nInfo(Astro);
    const localeInfo = this.getLocaleInfo(locale);
    return localeInfo.direction || 'ltr';
  }

  // ===============================================
  // 🎨 LANGUAGE PICKER
  // ===============================================

  /**
   * 🎨 Genera datos para el language picker con Astro
   */
  getLanguagePickerData(currentLocale, currentPath, baseUrl = '') {
    return this.languages.map(lang => ({
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      shortName: lang.shortName,
      flag: FlagRenderer.getFlagElement(lang.flag),
      url: this.localizeUrl(currentPath, lang.code, baseUrl),
      isActive: lang.code === currentLocale,
      direction: lang.direction
    }));
  }

  /**
   * 🎨 Helper conveniente para language picker con Astro
   */
  getLanguagePickerDataWithAstro(Astro) {
    const { locale, cleanPath } = this.getI18nInfo(Astro);

    return this.getLanguagePickerData(locale, cleanPath, this.getBaseUrl(Astro));
  }

  // ===============================================
  // 🏗️ SEO Y METADATOS
  // ===============================================

  /**
   * 🏗️ Helper para generar metadatos SEO multiidioma con Astro
   */
  getSEOMetadata(pageData, Astro) {
    const { locale, cleanPath } = this.getI18nInfo(Astro);
    const alternateUrls = this.getAlternateUrlsWithAstro(Astro);

    // Obtener traducciones básicas
    const siteTitle = this.getTranslation('title', locale) || 'El Palleter';
    const siteDescription = this.getTranslation('description', locale) || 'Restaurante El Palleter en Benissa';

    const title = pageData.title ? `${pageData.title} | ${siteTitle}` : siteTitle;
    const description = pageData.description || siteDescription;
    const canonical = `${this.getBaseUrl(Astro)}${this.localizeUrl(cleanPath, locale, '')}`;

    // Generar datos estructurados
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
   * 🏗️ Helper para generar JSON-LD estructurado multiidioma
   */
  generateStructuredData(data, Astro) {
    const { locale } = this.getI18nInfo(Astro);
    const baseUrl = Astro.site || Astro.url.origin;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": data.type || "WebPage",
      "@language": locale,
      "url": `${baseUrl}${this.localizeUrl(data.path || '/', locale, '')}`,
      "name": data.nameKey
        ? this.getTranslation(data.nameKey, locale)
        : data.name,
      "description": data.descriptionKey
        ? this.getTranslation(data.descriptionKey, locale)
        : data.description,
      "inLanguage": locale,
      "potentialAction": {
        "@type": "ReadAction",
        "target": `${baseUrl}${this.localizeUrl(data.path || '/', locale, '')}`
      }
    };

    // Añadir URLs alternativas
    if (data.includeAlternates !== false) {
      const alternateUrls = this.getAlternateUrlsWithAstro(Astro);
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
  // 🔧 UTILIDADES
  // ===============================================

  /**
   * ✅ Helper para detectar si una URL corresponde al idioma actual
   */
  isCurrentLanguageUrl(url, Astro) {
    const { locale } = this.getI18nInfo(Astro);

    if (locale === DEFAULT_LOCALE) {
      return !url.match(/^\/[a-z]{2,3}\//);
    } else {
      return url.startsWith(`/${locale}/`) || url === `/${locale}`;
    }
  }

  /**
   * 🧭 Helper para detectar redirecciones automáticas de idioma
   */
  handleLanguageRedirect(Astro) {
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
      .filter(lang => lang.length >= 2);

    const availableLocales = this.getLanguageCodes();

    // Encontrar primer idioma soportado
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
   * 🎨 Renderiza una bandera
   */
  renderFlag(flagConfig, className = '', size = '1rem') {
    return FlagRenderer.renderFlag(flagConfig, className, size);
  }

  /**
   * 🔍 Helper para detectar si estamos en modo desarrollo
   */
  isDev() {
    return import.meta.env.DEV;
  }

  /**
   * 📝 Helper para logging con información de idioma
   */
  logWithLocale(message, Astro, level = 'log') {
    if (this.isDev()) {
      const { locale } = this.getI18nInfo(Astro);
      console[level](`[${locale}] ${message}`);
    }
  }
}

// ===============================================
// 🎯 INSTANCIA SINGLETON Y EXPORTS
// ===============================================

/**
 * 🎯 Instancia singleton - LA ÚNICA QUE NECESITAS
 */
export const i18nCore = new I18nCore();

// 🚀 Auto-inicialización para entornos que no usan top-level await
if (typeof window === 'undefined') { // Solo en el servidor
  i18nCore.init().catch(console.error);
}

// ===============================================
// 🔄 FUNCIONES DE CONVENIENCIA (WRAPPERS)
// ===============================================

/**
 * 🔤 Función helper para obtener traducciones
 */
export async function getTranslation(key, locale = DEFAULT_LOCALE, params = {}) {
  if (!i18nCore.loaded) {
    await i18nCore.init();
  }

  return i18nCore.getTranslation(key, locale, params);
}

/**
 * 🌐 Función helper para obtener datos del language picker con Astro
 */
export async function getLanguagePickerData(Astro) {
  if (!i18nCore.loaded) {
    await i18nCore.init();
  }

  return i18nCore.getLanguagePickerDataWithAstro(Astro);
}

/**
 * 🚀 Hook para precargar traducciones en el servidor
 */
export async function preloadTranslations() {
  await i18nCore.init();
  return i18nCore;
}

// ===============================================
// 🎨 CLASE HELPER PARA ERRORES
// ===============================================

/**
 * 🎨 Clase helper para manejo de errores de i18n
 */
export class I18nError extends Error {
  constructor(message, locale, key) {
    super(message);
    this.name = 'I18nError';
    this.locale = locale;
    this.key = key;
  }
}

// ===============================================
// 🔄 COMPATIBILIDAD CON CÓDIGO EXISTENTE
// ===============================================

/**
 * 🔄 Aliases para compatibilidad con código existente
 * @deprecated Usar i18nCore directamente
 */
export class I18nConfig {
  static getInstance() {
    return i18nCore;
  }
}

export const i18nConfig = i18nCore;
export const translationManager = i18nCore;
export const languageManager = i18nCore;

export default i18nCore;