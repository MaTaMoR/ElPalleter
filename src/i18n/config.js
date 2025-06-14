import { translationManager, LOCALES, DEFAULT_LOCALE } from '../utils/translation-utils.js';
import { LANGUAGE_CONFIG } from '../utils/language-config.js';

/**
 * Configuración de internacionalización para Astro
 * Compatible con el middleware y las utilidades de traducción
 */
class I18nConfig {
  constructor() {
    this.defaultLocale = DEFAULT_LOCALE;
    this.locales = LOCALES;
    this.translationsLoaded = false;
    
    // Singleton pattern
    if (I18nConfig.instance) {
      return I18nConfig.instance;
    }
    I18nConfig.instance = this;
  }

  /**
   * Obtiene la instancia singleton
   * @returns {I18nConfig}
   */
  static getInstance() {
    if (!I18nConfig.instance) {
      I18nConfig.instance = new I18nConfig();
    }
    return I18nConfig.instance;
  }

  /**
   * Carga las traducciones
   * @returns {Promise<void>}
   */
  async loadTranslations() {
    if (!this.translationsLoaded) {
      await translationManager.loadAllTranslations();
      this.translationsLoaded = true;
    }
  }

  /**
   * Obtiene una traducción
   * @param {string} key - Clave de traducción
   * @param {string} locale - Idioma
   * @param {Object} params - Parámetros para reemplazar
   * @returns {string}
   */
  getTranslation(key, locale = this.defaultLocale, params = {}) {
    if (!this.translationsLoaded) {
      console.warn('[I18nConfig] Translations not loaded. Call loadTranslations() first.');
      return key;
    }
    
    return translationManager.getTranslation(key, locale, params);
  }

  /**
   * Verifica si un idioma es válido
   * @param {string} locale - Código del idioma
   * @returns {boolean}
   */
  isValidLocale(locale) {
    return this.locales.includes(locale);
  }

  /**
   * Obtiene el idioma por defecto
   * @returns {string}
   */
  getDefaultLocale() {
    return this.defaultLocale;
  }

  /**
   * Obtiene todos los idiomas disponibles
   * @returns {Array<string>}
   */
  getLocales() {
    return [...this.locales];
  }

  /**
   * Detecta el idioma de una URL
   * @param {string} pathname - Ruta de la URL
   * @returns {Object} - { locale, cleanPath }
   */
  detectLocaleFromPath(pathname) {
    const segments = pathname.split('/').filter(Boolean);
    
    if (segments.length === 0) {
      return { locale: this.defaultLocale, cleanPath: '/' };
    }

    const firstSegment = segments[0];
    
    if (this.locales.includes(firstSegment) && firstSegment !== this.defaultLocale) {
      const cleanPath = '/' + segments.slice(1).join('/');
      return { 
        locale: firstSegment, 
        cleanPath: cleanPath === '' ? '/' : cleanPath 
      };
    }
    
    return { locale: this.defaultLocale, cleanPath: pathname };
  }

  /**
   * Construye una URL localizada
   * @param {string} path - Ruta
   * @param {string} locale - Idioma
   * @param {string} baseUrl - URL base (opcional)
   * @returns {string}
   */
  localizeUrl(path, locale = this.defaultLocale, baseUrl = '') {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    if (locale === this.defaultLocale) {
      return `${baseUrl}${cleanPath}`;
    } else {
      const localizedPath = cleanPath === '/' ? `/${locale}` : `/${locale}${cleanPath}`;
      return `${baseUrl}${localizedPath}`;
    }
  }

  /**
   * Obtiene todas las variantes de URL para diferentes idiomas
   * @param {string} path - Ruta
   * @param {string} baseUrl - URL base
   * @returns {Object}
   */
  getAlternateUrls(path, baseUrl = '') {
    const urls = {};
    
    this.locales.forEach(locale => {
      urls[locale] = this.localizeUrl(path, locale, baseUrl);
    });
    
    return urls;
  }

  /**
   * Obtiene información completa del idioma
   * @param {string} locale - Código del idioma
   * @returns {Object}
   */
  getLocaleInfo(locale) {
    return LANGUAGE_CONFIG[locale] || LANGUAGE_CONFIG[this.defaultLocale];
  }

  /**
   * Obtiene todas las traducciones para un namespace específico
   * @param {string} namespace - Namespace
   * @param {string} locale - Idioma
   * @returns {Object}
   */
  getNamespaceTranslations(namespace, locale = this.defaultLocale) {
    if (!this.translationsLoaded) {
      console.warn('[I18nConfig] Translations not loaded.');
      return {};
    }

    const allTranslations = translationManager.getAllTranslations(locale);
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
   * Formatea una fecha según el idioma
   * @param {Date} date - Fecha
   * @param {string} locale - Idioma
   * @param {Object} options - Opciones de formateo
   * @returns {string}
   */
  formatDate(date, locale = this.defaultLocale, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    const formatOptions = { ...defaultOptions, ...options };
    
    try {
      return new Intl.DateTimeFormat(locale, formatOptions).format(date);
    } catch (error) {
      console.warn(`[I18nConfig] Error formatting date for locale ${locale}:`, error);
      return date.toLocaleDateString();
    }
  }

  /**
   * Formatea un número según el idioma
   * @param {number} number - Número
   * @param {string} locale - Idioma
   * @param {Object} options - Opciones de formateo
   * @returns {string}
   */
  formatNumber(number, locale = this.defaultLocale, options = {}) {
    try {
      return new Intl.NumberFormat(locale, options).format(number);
    } catch (error) {
      console.warn(`[I18nConfig] Error formatting number for locale ${locale}:`, error);
      return number.toString();
    }
  }

  /**
   * Formatea una moneda según el idioma
   * @param {number} amount - Cantidad
   * @param {string} currency - Código de moneda
   * @param {string} locale - Idioma
   * @returns {string}
   */
  formatCurrency(amount, currency = 'EUR', locale = this.defaultLocale) {
    return this.formatNumber(amount, locale, {
      style: 'currency',
      currency: currency
    });
  }

  /**
   * Obtiene las rutas localizadas para el sitemap
   * @param {Array} routes - Rutas base
   * @param {string} baseUrl - URL base
   * @returns {Array}
   */
  generateSitemapRoutes(routes, baseUrl) {
    const localizedRoutes = [];
    
    for (const route of routes) {
      for (const locale of this.locales) {
        const localizedRoute = {
          ...route,
          url: this.localizeUrl(route.path, locale, baseUrl),
          locale: locale,
          alternates: this.getAlternateUrls(route.path, baseUrl)
        };
        
        localizedRoutes.push(localizedRoute);
      }
    }
    
    return localizedRoutes;
  }

  /**
   * Obtiene estadísticas de las traducciones
   * @returns {Object}
   */
  getTranslationStats() {
    if (!this.translationsLoaded) {
      return null;
    }
    
    return translationManager.getStats();
  }
}

// Crear y exportar la instancia singleton
const i18nConfig = new I18nConfig();

export { I18nConfig, i18nConfig };
export default I18nConfig;