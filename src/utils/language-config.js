// src/utils/language-config.js
// 🌍 SISTEMA CENTRALIZADO DE CONFIGURACIÓN DE IDIOMAS

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📁 Ruta a las traducciones
const TRANSLATIONS_DIR = path.join(__dirname, '../i18n/translations');

/**
 * 🎯 CONFIGURACIÓN CENTRAL DE IDIOMAS
 * Solo necesitas modificar este objeto para añadir/cambiar idiomas
 */
const LANGUAGE_CONFIG = {
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
      value: '/flags/valencia.svg' // Ruta al SVG
    },
    direction: 'ltr'
  }
};

/**
 * 🔍 Detecta automáticamente idiomas disponibles basándose en archivos de traducción
 */
async function detectAvailableLanguages() {
  try {
    const files = await fs.readdir(TRANSLATIONS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    const availableCodes = jsonFiles.map(file => file.replace('.json', ''));
    
    // Filtrar solo los idiomas que están en nuestra configuración
    const availableLanguages = availableCodes
      .filter(code => LANGUAGE_CONFIG[code])
      .map(code => LANGUAGE_CONFIG[code]);
    
    return availableLanguages;
  } catch (error) {
    console.warn('[Languages] Error detecting available languages:', error.message);
    // Fallback a configuración manual
    return Object.values(LANGUAGE_CONFIG);
  }
}

/**
 * 🎨 Clase para manejar banderas (emoji o SVG)
 */
class FlagRenderer {
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
 * 🌐 Clase principal para gestión de idiomas
 */
class LanguageManager {
  constructor() {
    this.languages = null;
    this.defaultLanguage = null;
    this.initialized = false;
  }
  
  async init() {
    if (this.initialized) return;
    
    this.languages = await detectAvailableLanguages();
    this.defaultLanguage = this.languages.find(lang => lang.isDefault) || this.languages[0];
    this.initialized = true;
    
    console.log(`[Languages] Initialized with ${this.languages.length} languages:`, 
      this.languages.map(l => l.code).join(', '));
  }
  
  async getAvailableLanguages() {
    if (!this.initialized) await this.init();
    return this.languages;
  }
  
  async getDefaultLanguage() {
    if (!this.initialized) await this.init();
    return this.defaultLanguage;
  }
  
  async getLanguage(code) {
    if (!this.initialized) await this.init();
    return this.languages.find(lang => lang.code === code);
  }
  
  async getLanguageCodes() {
    if (!this.initialized) await this.init();
    return this.languages.map(lang => lang.code);
  }
  
  async isValidLanguage(code) {
    const codes = await this.getLanguageCodes();
    return codes.includes(code);
  }
  
  /**
   * 🔗 Construye URL localizada correctamente (MANEJA OBJETO URL DE ASTRO)
   */
  buildLanguageUrl(targetLocale, currentPath, baseUrl = '') {
    // Manejar si baseUrl es un objeto URL (como Astro.site)
    let cleanBaseUrl = '';
    if (baseUrl) {
      if (typeof baseUrl === 'object' && baseUrl.origin) {
        // Es un objeto URL
        cleanBaseUrl = baseUrl.origin;
      } else if (typeof baseUrl === 'string') {
        // Es un string
        cleanBaseUrl = baseUrl.replace(/\/$/, '');
      }
    }
    
    // Limpiar el path actual de cualquier prefijo de idioma
    let cleanPath = currentPath;
    const localeMatch = cleanPath.match(/^\/([a-z]{2,3})(\/.*)?$/);
    
    if (localeMatch) {
      const detectedLocale = localeMatch[1];
      // Solo limpiar si es un idioma válido conocido
      if (Object.keys(LANGUAGE_CONFIG).includes(detectedLocale)) {
        cleanPath = localeMatch[2] || '/';
      }
    }
    
    // Asegurar que cleanPath empiece con /
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }
    
    // Construir la nueva URL
    if (this.defaultLanguage && targetLocale === this.defaultLanguage.code) {
      // Idioma por defecto, no necesita prefijo
      if (cleanPath === '/') {
        return cleanBaseUrl + '/';
      } else {
        return cleanBaseUrl + cleanPath;
      }
    } else {
      // Otros idiomas necesitan prefijo
      if (cleanPath === '/') {
        return cleanBaseUrl + `/${targetLocale}/`;
      } else {
        return cleanBaseUrl + `/${targetLocale}${cleanPath}`;
      }
    }
  }
  
  /**
   * 🗂️ Genera configuración para componentes
   */
  async getLanguagePickerData(currentLocale, currentPath) {
    const languages = await this.getAvailableLanguages();
    
    return languages.map(lang => ({
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      shortName: lang.shortName,
      flag: FlagRenderer.getFlagElement(lang.flag),
      url: this.buildLanguageUrl(lang.code, currentPath),
      isActive: lang.code === currentLocale,
      direction: lang.direction
    }));
  }
}

// 🎯 Instancia singleton
const languageManager = new LanguageManager();

/**
 * 🚀 FUNCIONES DE UTILIDAD PARA COMPONENTES ASTRO
 */

/**
 * Obtiene datos de idiomas para el language picker
 */
export async function getLanguagePickerData(Astro) {
  const currentLocale = Astro.currentLocale || 'es';
  const currentPath = Astro.url.pathname;
  // Ya no pasamos baseUrl para evitar problemas con el objeto URL
  
  return await languageManager.getLanguagePickerData(currentLocale, currentPath);
}

/**
 * Obtiene lista de idiomas disponibles
 */
export async function getAvailableLanguages() {
  return await languageManager.getAvailableLanguages();
}

/**
 * Obtiene el idioma por defecto
 */
export async function getDefaultLanguage() {
  return await languageManager.getDefaultLanguage();
}

/**
 * Verifica si un código de idioma es válido
 */
export async function isValidLanguage(code) {
  return await languageManager.isValidLanguage(code);
}

/**
 * Obtiene códigos de idiomas disponibles
 */
export async function getLanguageCodes() {
  return await languageManager.getLanguageCodes();
}

/**
 * Construye URL para un idioma específico
 */
export function buildLanguageUrl(targetLocale, currentPath) {
  return languageManager.buildLanguageUrl(targetLocale, currentPath);
}

/**
 * Renderiza una bandera (para usar en componentes)
 */
export function renderFlag(flagConfig, className = '', size = '1rem') {
  return FlagRenderer.renderFlag(flagConfig, className, size);
}

// Exportar también las constantes para compatibilidad
export const LOCALES = Object.keys(LANGUAGE_CONFIG);
export const DEFAULT_LOCALE = Object.values(LANGUAGE_CONFIG).find(lang => lang.isDefault)?.code || 'es';

// Exportar el manager para casos avanzados
export { languageManager, FlagRenderer, LANGUAGE_CONFIG };