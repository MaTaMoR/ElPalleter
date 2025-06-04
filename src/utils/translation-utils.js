import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const LOCALES = ['es', 'en', 'ca'];
const DEFAULT_LOCALE = 'es';
const TRANSLATIONS_DIR = path.join(__dirname, '../i18n/translations');

/**
 * Clase para gestionar las traducciones con cache optimizado
 */
class TranslationManager {
  constructor() {
    this.translations = new Map();
    this.loaded = false;
    this.loading = false; // Para evitar carga múltiple
    this.loadPromise = null; // Para reutilizar la promesa de carga
  }

  /**
   * Carga todas las traducciones (con protección contra carga múltiple)
   */
  async loadAllTranslations() {
    // Si ya está cargado, retornar inmediatamente
    if (this.loaded) return;
    
    // Si ya se está cargando, esperar a que termine
    if (this.loading && this.loadPromise) {
      return await this.loadPromise;
    }

    // Marcar como cargando y crear promesa
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
            console.log(`[i18n] Loaded ${Object.keys(flattened).length} translations for ${locale}`);
          }
        } catch (error) {
          console.warn(`[i18n] Warning: Could not load translations for ${locale}:`, error.message);
          this.translations.set(locale, {});
        }
      });

      await Promise.all(loadPromises);
      this.loaded = true;
      
    } catch (error) {
      console.error('[i18n] Error loading translations:', error);
      throw error;
    }
  }

  /**
   * Aplana un objeto anidado para facilitar el acceso
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

  /**
   * Obtiene una traducción
   */
  getTranslation(key, locale = DEFAULT_LOCALE, params = {}) {
    if (!this.loaded) {
      if (import.meta.env.DEV) {
        console.warn('[i18n] Translations not loaded yet for key:', key);
      }
      return key;
    }

    const localeTranslations = this.translations.get(locale);
    if (!localeTranslations) {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] No translations found for locale: ${locale}`);
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
        console.warn(`[i18n] Missing translation for key: ${key} (locale: ${locale})`);
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
   * Reemplaza parámetros en una traducción
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
   * Obtiene todas las traducciones para un idioma
   */
  getAllTranslations(locale) {
    return this.translations.get(locale) || {};
  }

  /**
   * Verifica si existe una traducción
   */
  hasTranslation(key, locale) {
    const translations = this.translations.get(locale);
    return translations && key in translations;
  }

  /**
   * Obtiene estadísticas de traducciones
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
}

/**
 * Instancia singleton del gestor de traducciones
 */
const translationManager = new TranslationManager();

/**
 * Función helper para obtener traducciones (para uso en componentes)
 */
export async function getTranslation(key, locale = DEFAULT_LOCALE, params = {}) {
  if (!translationManager.loaded) {
    await translationManager.loadAllTranslations();
  }
  
  return translationManager.getTranslation(key, locale, params);
}

/**
 * Hook para precargar traducciones en el servidor
 */
export async function preloadTranslations() {
  if (!translationManager.loaded) {
    await translationManager.loadAllTranslations();
  }
  return translationManager;
}

// Exportar instancia y constantes
export { 
  translationManager,
  LOCALES, 
  DEFAULT_LOCALE
};