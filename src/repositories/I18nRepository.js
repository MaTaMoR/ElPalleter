import { BaseRepository } from './BaseRepository.js';
import ImageService from '../services/ImageService.js';

/**
 * Repositorio para operaciones de internacionalización
 */
export class I18nRepository extends BaseRepository {

    // ===============================================
    // GESTIÓN DE IDIOMAS
    // ===============================================

    /**
     * Obtiene los códigos de idiomas disponibles
     * GET /i18n/languages/codes
     * @returns {Promise<Array<string>>} Array de códigos de idiomas
     */
    static async getAvailableLanguageCodes() {
        try {
            const response = await this.get('/i18n/languages/codes');
            return response || [];
        } catch (error) {
            console.error('I18nRepository: Error getting language codes:', error);
            throw error;
        }
    }

    /**
     * Obtiene la configuración completa de todos los idiomas
     * GET /i18n/languages
     * @returns {Promise<Array<Object>>} Array de objetos de idioma con toda su configuración
     */
    static async getLanguages() {
        try {
            const response = await this.get('/i18n/languages');
            return response || [];
        } catch (error) {
            console.error('I18nRepository: Error getting languages:', error);
            throw error;
        }
    }

    /**
     * Obtiene la configuración de un idioma específico por código
     * GET /i18n/languages/{code}
     * @param {string} code - Código del idioma (es, en, val)
     * @returns {Promise<Object>} Objeto con la configuración del idioma
     */
    static async getLanguageByCode(code) {
        if (!code) {
            throw new Error('Language code is required');
        }

        try {
            const response = await this.get(`/i18n/languages/${code}`);
            return response || null;
        } catch (error) {
            console.error(`I18nRepository: Error getting language ${code}:`, error);
            throw error;
        }
    }

    /**
     * Convierte idiomas del backend a formato frontend
     * Transforma el formato DTO del backend al formato LANGUAGE_CONFIG del frontend
     * @param {Array<Object>} languagesFromBackend - Array de LanguageDTO del backend
     * @returns {Object} Objeto de idiomas en formato LANGUAGE_CONFIG
     */
    static convertLanguagesToFrontendFormat(languagesFromBackend) {
        const languageConfig = {};
        
        if (!Array.isArray(languagesFromBackend)) {
            return languageConfig;
        }

        languagesFromBackend.forEach(lang => {
            languageConfig[lang.code] = {
                code: lang.code,
                name: lang.name,
                nativeName: lang.nativeName,
                shortName: lang.shortName,
                isDefault: lang.isDefault,
                flag: {
                    value: lang.flagImagePath
                },
                direction: lang.direction,
                enabled: lang.enabled,
                displayOrder: lang.displayOrder
            };
        });

        return languageConfig;
    }

    /**
     * Obtiene los idiomas en formato LANGUAGE_CONFIG
     * @returns {Promise<Object>} Idiomas en formato frontend
     */
    static async getLanguagesConfig() {
        try {
            const languages = await this.getLanguages();
            return this.convertLanguagesToFrontendFormat(languages);
        } catch (error) {
            console.error('I18nRepository: Error getting languages config:', error);
            throw error;
        }
    }

    // ===============================================
    // GESTIÓN DE TRADUCCIONES (ya existentes)
    // ===============================================

    /**
     * Obtiene las traducciones para un idioma específico
     * GET /i18n/translations/{language}
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
     */
    static async getAllTranslations(languages = null) {
        try {
            // Si no se especifican idiomas, obtener códigos desde el backend
            if (!languages) {
                languages = await this.getAvailableLanguageCodes();
            }

            const translations = {};
            
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
     * Actualiza una traducción específica
     * PUT /i18n/translations
     * @param {Object} request - Objeto con languageCode, key y value
     * @param {string} token - Token de autenticación
     * @returns {Promise<Object>} Translation actualizada
     */
    static async updateTranslation(request, token) {
        if (!request || !request.languageCode || !request.translationKey || !request.translationValue) {
            throw new Error('Language code, translationKey and translationValue are required');
        }

        try {
            const response = await this.put('/i18n/translations', request, {
                headers: this.getAuthHeaders(token)
            });
            return response;
        } catch (error) {
            console.error('I18nRepository: Error updating translation:', error);
            throw error;
        }
    }

    // ===============================================
    // UTILIDADES
    // ===============================================

    /**
     * Verifica el estado del servicio de i18n en el backend
     */
    static async healthCheck() {
        try {
            const languageCodes = await this.getAvailableLanguageCodes();
            
            return {
                status: 'healthy',
                service: 'I18nRepository',
                backend: this.getBaseUrl(),
                endpoints: {
                    languages: '/i18n/languages',
                    languageCodes: '/i18n/languages/codes',
                    languageByCode: '/i18n/languages/{code}',
                    translations: '/i18n/translations/{language}'
                },
                availableLanguages: languageCodes,
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
     */
    static getConfig() {
        return {
            baseUrl: this.getBaseUrl(),
            endpoints: {
                languages: '/i18n/languages',
                languageCodes: '/i18n/languages/codes',
                languageByCode: '/i18n/languages/{code}',
                translations: '/i18n/translations/{language}'
            }
        };
    }
}