const DEFAULT_LANGUAGE = 'es';

/**
 * Gestor principal de traducciones
 */
export class TranslationManager {
  constructor() {
    this.translations = new Map();
    this.languages = [];
    this.textKeys = [];
  }
  
  /**
   * Obtener instancia singleton
   * @returns {TranslationManager}
   */
  static getInstance() {
    if (!TranslationManager.instance) {
      TranslationManager.instance = new TranslationManager();
    }
    return TranslationManager.instance;
  }
  
  /**
   * Cargar todas las traducciones desde la base de datos
   */
  async loadTranslations() {
    try {
      const response = await fetch('/api/translations/all');
      const data = await response.json();
      
      this.translations.clear();
      
      data.translations.forEach(translation => {
        if (!this.translations.has(translation.languageId)) {
          this.translations.set(translation.languageId, new Map());
        }
        this.translations.get(translation.languageId).set(translation.key, translation);
      });
      
      this.languages = data.languages;
      this.textKeys = data.textKeys;
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  }
  
  /**
   * Obtener traducción por clave e idioma
   * @param {string} key - Clave de traducción
   * @param {string} languageId - ID del idioma
   * @returns {string} Traducción encontrada o clave por defecto
   */
  getTranslation(key, languageId = DEFAULT_LANGUAGE) {
    const langTranslations = this.translations.get(languageId);
    
    if (langTranslations && langTranslations.has(key)) {
      return langTranslations.get(key).translation;
    }
    
    // Fallback al español si no existe en el idioma solicitado
    if (languageId !== 'es') {
      const defaultTranslations = this.translations.get('es');
      if (defaultTranslations && defaultTranslations.has(key)) {
        return defaultTranslations.get(key).translation;
      }
    }
    
    return `[${key}]`;
  }
  
  /**
   * Verificar si una traducción existe
   * @param {string} key - Clave de traducción
   * @param {string} languageId - ID del idioma
   * @returns {boolean}
   */
  hasTranslation(key, languageId) {
    const langTranslations = this.translations.get(languageId);
    return langTranslations ? langTranslations.has(key) : false;
  }
  
  /**
   * Obtener porcentaje de completitud de un idioma
   * @param {string} languageId - ID del idioma
   * @returns {number} Porcentaje de completitud
   */
  getLanguageCompleteness(languageId) {
    const totalKeys = this.textKeys.length;
    if (totalKeys === 0) return 100;
    
    const langTranslations = this.translations.get(languageId);
    if (!langTranslations) return 0;
    
    const translatedKeys = langTranslations.size;
    return Math.round((translatedKeys / totalKeys) * 100);
  }
  
  /**
   * Obtener claves faltantes para un idioma
   * @param {string} languageId - ID del idioma
   * @returns {string[]} Array de claves faltantes
   */
  getMissingKeys(languageId) {
    const langTranslations = this.translations.get(languageId);
    const missingKeys = [];
    
    this.textKeys.forEach(textKey => {
      if (!langTranslations || !langTranslations.has(textKey.key)) {
        missingKeys.push(textKey.key);
      }
    });
    
    return missingKeys;
  }
  
  /**
   * Actualizar traducción
   * @param {string} key - Clave de texto
   * @param {string} languageId - ID del idioma
   * @param {string} translation - Traducción
   * @param {boolean} isReviewed - Si está revisada
   * @param {string} translatorNotes - Notas del traductor
   * @returns {Promise<boolean>} Éxito de la operación
   */
  async updateTranslation(key, languageId, translation, isReviewed = false, translatorNotes = '') {
    try {
      const response = await fetch(`/api/translations/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          languageId,
          translation,
          isReviewed,
          translatorNotes
        })
      });
      
      if (response.ok) {
        // Actualizar cache local
        if (!this.translations.has(languageId)) {
          this.translations.set(languageId, new Map());
        }
        
        const langTranslations = this.translations.get(languageId);
        const existingTranslation = langTranslations.get(key);
        
        langTranslations.set(key, {
          ...existingTranslation,
          key,
          languageId,
          translation,
          isReviewed,
          translatorNotes,
          updatedAt: new Date().toISOString()
        });
      }
      
      return response.ok;
    } catch (error) {
      console.error('Error updating translation:', error);
      return false;
    }
  }
}

/**
 * Constructor de traducciones estáticas
 */
export class StaticTranslationBuilder {
  /**
   * Generar archivos de traducciones estáticas
   */
  static async generateStaticTranslations() {
    const manager = TranslationManager.getInstance();
    await manager.loadTranslations();
    
    const translations = manager.exportTranslationsForBuild();
    
    // Generar archivo JSON para cada idioma
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const translationsDir = path.join(process.cwd(), 'src/i18n/generated');
    
    try {
      await fs.mkdir(translationsDir, { recursive: true });
    } catch (error) {
      // Directorio ya existe
    }
    
    for (const [languageId, langTranslations] of Object.entries(translations)) {
      const filePath = path.join(translationsDir, `${languageId}.json`);
      await fs.writeFile(filePath, JSON.stringify(langTranslations, null, 2));
    }
    
    console.log('Static translations generated successfully');
  }
}

/**
 * Exportar traducciones para build
 * @returns {Object} Objeto con traducciones por idioma
 */
TranslationManager.prototype.exportTranslationsForBuild = function() {
  const exportData = {};
  
  this.translations.forEach((langTranslations, languageId) => {
    exportData[languageId] = {};
    langTranslations.forEach((translation, key) => {
      exportData[languageId][key] = translation.translation;
    });
  });
  
  return exportData;
};

/**
 * Utilidad para cargar traducciones estáticas en producción
 * @param {string} key - Clave de traducción
 * @param {string} languageId - ID del idioma
 * @returns {Promise<string|null>} Traducción o null
 */
export async function getStaticTranslation(key, languageId) {
  try {
    const translations = await import(`../i18n/generated/${languageId}.json`, {
      assert: { type: 'json' }
    });
    return translations.default[key] || null;
  } catch (error) {
    // Fallback al español si el archivo del idioma no existe
    if (languageId !== 'es') {
      try {
        const defaultTranslations = await import('../i18n/generated/es.json', {
          assert: { type: 'json' }
        });
        return defaultTranslations.default[key] || null;
      } catch (fallbackError) {
        return null;
      }
    }
    return null;
  }
}

/**
 * Hook para usar en componentes
 * @param {string} languageId - ID del idioma
 * @returns {Object} Objeto con funciones de traducción
 */
export function useTranslation(languageId = 'es') {
  const manager = TranslationManager.getInstance();
  
  return {
    t: (key, params = {}) => {
      let translation = manager.getTranslation(key, languageId);
      
      if (params && Object.keys(params).length > 0) {
        Object.entries(params).forEach(([param, value]) => {
          translation = translation.replace(
            new RegExp(`{{\\s*${param}\\s*}}`, 'g'), 
            String(value)
          );
        });
      }
      
      return translation;
    },
    hasTranslation: (key) => manager.hasTranslation(key, languageId),
    getLanguageCompleteness: () => manager.getLanguageCompleteness(languageId)
  };
}