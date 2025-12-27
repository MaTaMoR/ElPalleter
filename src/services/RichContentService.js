import { RichContentRepository } from '../repositories/RichContentRepository.js';
import { AuthService } from './AuthService.js';

/**
 * Servicio de gestión de contenido rico
 * Proporciona una capa de abstracción sobre RichContentRepository
 */
export class RichContentService {

    // ===============================================
    // OPERACIONES DE LECTURA (públicas)
    // ===============================================

    /**
     * Obtiene todo el contenido rico de un idioma
     * @param {string} languageCode - Código del idioma (es, en, val)
     * @returns {Promise<Array<Object>>} Array de objetos RichContentDTO
     */
    static async getContentByLanguage(languageCode) {
        try {
            return await RichContentRepository.getContentByLanguage(languageCode);
        } catch (error) {
            console.error(`RichContentService: Error getting content for language ${languageCode}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene un contenido específico por idioma y clave
     * @param {string} languageCode - Código del idioma (es, en, val)
     * @param {string} contentKey - Clave del contenido (e.g., "historia_content")
     * @returns {Promise<Object>} RichContentDTO específico
     */
    static async getContentByLanguageAndKey(languageCode, contentKey) {
        try {
            return await RichContentRepository.getContentByLanguageAndKey(languageCode, contentKey);
        } catch (error) {
            console.error(`RichContentService: Error getting content ${contentKey} for language ${languageCode}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene todo el contenido rico para múltiples idiomas
     * Retorna un objeto estructurado por contentKey > languageCode > { html }
     *
     * Ejemplo de estructura de retorno:
     * {
     *   "historia_content": {
     *     "es": { html: "<p>...</p>" },
     *     "en": { html: "<p>...</p>" },
     *     "val": { html: "<p>...</p>" }
     *   }
     * }
     *
     * @param {Array<string>} languageCodes - Array de códigos de idioma
     * @returns {Promise<Object>} Objeto anidado por contentKey y language
     */
    static async getAllStructuredContent(languageCodes = ['es', 'en', 'val']) {
        try {
            return await RichContentRepository.getAllStructuredContent(languageCodes);
        } catch (error) {
            console.error('RichContentService: Error getting all structured content:', error);
            throw error;
        }
    }

    /**
     * Obtiene contenido estructurado para un contentKey específico en todos los idiomas
     * @param {string} contentKey - Clave del contenido
     * @param {Array<string>} languageCodes - Array de códigos de idioma
     * @returns {Promise<Object>} Objeto con contenido por idioma { es: {html}, en: {html}, val: {html} }
     */
    static async getContentKeyAllLanguages(contentKey, languageCodes = ['es', 'en', 'val']) {
        try {
            const result = {};

            const promises = languageCodes.map(async (languageCode) => {
                try {
                    const content = await this.getContentByLanguageAndKey(languageCode, contentKey);
                    return { languageCode, content };
                } catch (error) {
                    // Si no existe el contenido, retornar vacío
                    if (error.status === 404) {
                        return { languageCode, content: { contentValue: '' } };
                    }
                    throw error;
                }
            });

            const results = await Promise.all(promises);

            results.forEach(({ languageCode, content }) => {
                result[languageCode] = {
                    html: content.contentValue || ''
                };
            });

            return result;
        } catch (error) {
            console.error(`RichContentService: Error getting content key ${contentKey} for all languages:`, error);
            throw error;
        }
    }

    /**
     * Busca contenido en todos los idiomas
     * @param {string} keyPart - Parte de la clave a buscar
     * @returns {Promise<Array<Object>>} Array de objetos RichContentDTO que coinciden
     */
    static async searchContent(keyPart) {
        try {
            return await RichContentRepository.searchContent(keyPart);
        } catch (error) {
            console.error(`RichContentService: Error searching content with keyPart ${keyPart}:`, error);
            throw error;
        }
    }

    // ===============================================
    // OPERACIONES DE ESCRITURA (requieren autenticación)
    // ===============================================

    /**
     * Crea un nuevo contenido rico
     * @param {string} languageCode - Código del idioma
     * @param {string} contentKey - Clave del contenido
     * @param {string} contentValue - Valor HTML del contenido
     * @returns {Promise<Object>} RichContentDTO creado
     */
    static async createContent(languageCode, contentKey, contentValue) {
        try {
            const token = AuthService.getToken();
            if (!token) {
                throw new Error('No authentication token available');
            }

            const richContentDTO = {
                language: languageCode,
                contentKey,
                contentValue
            };

            return await RichContentRepository.createContent(richContentDTO, token);
        } catch (error) {
            console.error('RichContentService: Error creating content:', error);
            throw error;
        }
    }

    /**
     * Actualiza un contenido rico existente
     * @param {string} languageCode - Código del idioma
     * @param {string} contentKey - Clave del contenido
     * @param {string} contentValue - Valor HTML del contenido
     * @returns {Promise<Object>} RichContentDTO actualizado
     */
    static async updateContent(languageCode, contentKey, contentValue) {
        try {
            const token = AuthService.getToken();
            if (!token) {
                throw new Error('No authentication token available');
            }

            const richContentDTO = {
                language: languageCode,
                contentKey,
                contentValue
            };

            return await RichContentRepository.updateContent(richContentDTO, token);
        } catch (error) {
            console.error('RichContentService: Error updating content:', error);
            throw error;
        }
    }

    /**
     * Crea o actualiza contenido (upsert)
     * Intenta actualizar primero, si falla intenta crear
     * @param {string} languageCode - Código del idioma
     * @param {string} contentKey - Clave del contenido
     * @param {string} contentValue - Valor HTML del contenido
     * @returns {Promise<Object>} RichContentDTO creado o actualizado
     */
    static async upsertContent(languageCode, contentKey, contentValue) {
        try {
            const token = AuthService.getToken();
            if (!token) {
                throw new Error('No authentication token available');
            }

            const richContentDTO = {
                language: languageCode,
                contentKey,
                contentValue
            };

            return await RichContentRepository.upsertContent(richContentDTO, token);
        } catch (error) {
            console.error('RichContentService: Error upserting content:', error);
            throw error;
        }
    }

    /**
     * Elimina un contenido rico
     * @param {string} languageCode - Código del idioma
     * @param {string} contentKey - Clave del contenido
     * @returns {Promise<void>}
     */
    static async deleteContent(languageCode, contentKey) {
        try {
            const token = AuthService.getToken();
            if (!token) {
                throw new Error('No authentication token available');
            }

            return await RichContentRepository.deleteContent(languageCode, contentKey, token);
        } catch (error) {
            console.error(`RichContentService: Error deleting content ${contentKey} for ${languageCode}:`, error);
            throw error;
        }
    }

    /**
     * Guarda contenido para un contentKey en múltiples idiomas
     * @param {string} contentKey - Clave del contenido
     * @param {Object} contentByLanguage - Objeto { es: {html}, en: {html}, val: {html} }
     * @returns {Promise<Array<Object>>} Array de RichContentDTO guardados
     */
    static async saveContentAllLanguages(contentKey, contentByLanguage) {
        try {
            const promises = Object.entries(contentByLanguage).map(([languageCode, data]) => {
                return this.upsertContent(languageCode, contentKey, data.html);
            });

            return await Promise.all(promises);
        } catch (error) {
            console.error(`RichContentService: Error saving content key ${contentKey} for all languages:`, error);
            throw error;
        }
    }

    // ===============================================
    // UTILIDADES
    // ===============================================

    /**
     * Verifica el estado del servicio
     */
    static async healthCheck() {
        try {
            const repoHealth = await RichContentRepository.healthCheck();

            return {
                status: 'healthy',
                service: 'RichContentService',
                repository: repoHealth,
                lastCheck: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                service: 'RichContentService',
                error: error.message,
                lastCheck: new Date().toISOString()
            };
        }
    }

    /**
     * Obtiene la configuración del servicio
     */
    static getConfig() {
        return {
            service: 'RichContentService',
            repository: RichContentRepository.getConfig(),
            supportedLanguages: ['es', 'en', 'val']
        };
    }
}
