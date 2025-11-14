import { BaseRepository } from './BaseRepository.js';

/**
 * Repositorio para operaciones de internacionalización
 * Conecta con los endpoints /i18n del backend Spring Boot
 * 
 * RESPONSABILIDAD: Solo acceso a datos del backend
 * La lógica de negocio está en I18nService
 */
export class I18nRepository extends BaseRepository {

    /**
     * Obtiene los idiomas disponibles
     * GET /i18n/languages
     * @returns {Promise<Array>} Array de códigos de idiomas disponibles
     */
    static async getAvailableLanguages() {
        try {
            const response = await this.get('/i18n/languages');
            return response || [];
        } catch (error) {
            console.error('I18nRepository: Error getting available languages:', error);
            throw error;
        }
    }

    /**
     * Obtiene las traducciones para un idioma específico
     * GET /i18n/translations/{language}
     * @param {string} language - Código del idioma (es, en, val)
     * @returns {Promise<Array>} Array de objetos de traducción
     */
    static async getTranslationsByLanguage(language) {
        if (!language) {
            throw new Error('Language code is required');
        }

        try {
            const response = await this.get(`/i18n/translations/${language}`);
            return response || [];
        } catch (error) {
            console.error(`I18nRepository: Error getting translations for language ${language}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene todas las traducciones para múltiples idiomas
     * @param {Array} languages - Array de códigos de idiomas
     * @returns {Promise<Object>} Objeto con traducciones por idioma {es: [...], en: [...]}
     */
    static async getAllTranslations(languages = null) {
        try {
            // Si no se especifican idiomas, obtener todos los disponibles
            if (!languages) {
                languages = await this.getAvailableLanguages();
            }

            const translations = {};
            
            // Obtener traducciones para cada idioma en paralelo
            const promises = languages.map(async (language) => {
                try {
                    const langTranslations = await this.getTranslationsByLanguage(language);
                    return { language, translations: langTranslations };
                } catch (error) {
                    console.warn(`Failed to get translations for ${language}:`, error);
                    return { language, translations: [] };
                }
            });

            const results = await Promise.all(promises);
            
            results.forEach(({ language, translations: langTranslations }) => {
                translations[language] = langTranslations;
            });

            return translations;
        } catch (error) {
            console.error('I18nRepository: Error getting all translations:', error);
            throw error;
        }
    }

    /**
     * Convierte array de traducciones del backend a formato flat
     * Transforma [{translationKey: "menu.home", translationValue: "Inicio"}] 
     * a {"menu.home": "Inicio"}
     * 
     * @param {Array} translationsArray - Array de objetos de traducción del backend
     * @returns {Object} Objeto flat de traducciones {key: value}
     */
    static convertToFlatFormat(translationsArray) {
        const flatTranslations = {};
        
        if (!Array.isArray(translationsArray)) {
            return flatTranslations;
        }

        translationsArray.forEach(translation => {
            if (translation.translationKey && translation.translationValue) {
                flatTranslations[translation.translationKey] = translation.translationValue;
            }
        });

        return flatTranslations;
    }

    /**
     * Obtiene traducciones en formato flat para un idioma
     * @param {string} language - Código del idioma
     * @returns {Promise<Object>} Objeto flat de traducciones
     */
    static async getFlatTranslations(language) {
        try {
            const translationsArray = await this.getTranslationsByLanguage(language);
            return this.convertToFlatFormat(translationsArray);
        } catch (error) {
            console.error(`I18nRepository: Error getting flat translations for ${language}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene todas las traducciones en formato flat para múltiples idiomas
     * ESTE ES EL MÉTODO PRINCIPAL QUE USA I18nService
     * 
     * @param {Array} languages - Array de códigos de idiomas
     * @returns {Promise<Object>} Objeto con traducciones flat por idioma
     *                            {es: {key: value}, en: {key: value}}
     */
    static async getAllFlatTranslations(languages = null) {
        try {
            const allTranslations = await this.getAllTranslations(languages);
            const flatTranslations = {};

            Object.entries(allTranslations).forEach(([language, translationsArray]) => {
                flatTranslations[language] = this.convertToFlatFormat(translationsArray);
            });

            return flatTranslations;
        } catch (error) {
            console.error('I18nRepository: Error getting all flat translations:', error);
            throw error;
        }
    }

    /**
     * Busca traducciones por clave parcial
     * @param {string} language - Código del idioma
     * @param {string} keyPattern - Patrón de clave a buscar
     * @returns {Promise<Object>} Traducciones que coinciden con el patrón
     */
    static async searchTranslations(language, keyPattern) {
        try {
            const flatTranslations = await this.getFlatTranslations(language);
            const matchingTranslations = {};

            Object.entries(flatTranslations).forEach(([key, value]) => {
                if (key.includes(keyPattern)) {
                    matchingTranslations[key] = value;
                }
            });

            return matchingTranslations;
        } catch (error) {
            console.error(`I18nRepository: Error searching translations for pattern ${keyPattern}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene una traducción específica por clave e idioma
     * @param {string} language - Código del idioma
     * @param {string} key - Clave de traducción
     * @returns {Promise<string|null>} Valor de la traducción o null si no existe
     */
    static async getTranslationByKey(language, key) {
        try {
            const flatTranslations = await this.getFlatTranslations(language);
            return flatTranslations[key] || null;
        } catch (error) {
            console.error(`I18nRepository: Error getting translation for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Obtiene estadísticas de traducciones desde el backend
     * @returns {Promise<Object>} Estadísticas de traducciones
     */
    static async getTranslationStats() {
        try {
            const languages = await this.getAvailableLanguages();
            const stats = {
                availableLanguages: languages.length,
                languages: {},
                totalKeys: 0,
                missingTranslations: {}
            };

            const allTranslations = await this.getAllFlatTranslations(languages);

            // Obtener todas las claves únicas
            const allKeys = new Set();
            Object.values(allTranslations).forEach(langTranslations => {
                Object.keys(langTranslations).forEach(key => allKeys.add(key));
            });

            stats.totalKeys = allKeys.size;

            // Calcular estadísticas por idioma
            languages.forEach(language => {
                const langTranslations = allTranslations[language] || {};
                const translatedKeys = Object.keys(langTranslations).length;
                const missingKeys = Array.from(allKeys).filter(key => !langTranslations[key]);

                stats.languages[language] = {
                    translated: translatedKeys,
                    missing: missingKeys.length,
                    completeness: allKeys.size > 0 ? Math.round((translatedKeys / allKeys.size) * 100) : 0
                };

                if (missingKeys.length > 0) {
                    stats.missingTranslations[language] = missingKeys;
                }
            });

            return stats;
        } catch (error) {
            console.error('I18nRepository: Error getting translation stats:', error);
            throw error;
        }
    }

    /**
     * Verifica si un idioma está disponible en el backend
     * @param {string} language - Código del idioma a verificar
     * @returns {Promise<boolean>} true si el idioma está disponible
     */
    static async isLanguageAvailable(language) {
        try {
            const availableLanguages = await this.getAvailableLanguages();
            return availableLanguages.includes(language);
        } catch (error) {
            console.error(`I18nRepository: Error checking if language ${language} is available:`, error);
            return false;
        }
    }

    /**
     * Verifica el estado del servicio de i18n en el backend
     * @returns {Promise<Object>} Estado del servicio
     */
    static async healthCheck() {
        try {
            const languages = await this.getAvailableLanguages();
            
            return {
                status: 'healthy',
                service: 'I18nRepository',
                backend: this.getBaseUrl(),
                endpoints: {
                    languages: '/i18n/languages',
                    translations: '/i18n/translations/{language}'
                },
                availableLanguages: languages,
                lastCheck: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                service: 'I18nRepository',
                backend: this.getBaseUrl(),
                error: error.message,
                lastCheck: new Date().toISOString()
            };
        }
    }

    /**
     * Obtiene la configuración del repositorio
     * @returns {Object} Configuración actual
     */
    static getConfig() {
        return {
            baseUrl: this.getBaseUrl(),
            endpoints: {
                languages: '/i18n/languages',
                translations: '/i18n/translations/{language}',
                translationByKey: '/i18n/translations/{language}/{key}'
            }
        };
    }

    /**
     * Invalida la caché de traducciones (si se implementa caché)
     * Útil cuando se actualizan traducciones en el backend
     */
    static async invalidateCache() {
        // Este método se puede implementar si se añade un sistema de caché
        console.log('I18nRepository: Cache invalidation requested');
    }
}