import { BaseRepository } from './BaseRepository.js';

/**
 * Repositorio para operaciones de contenido rico
 */
export class RichContentRepository extends BaseRepository {

    // ===============================================
    // OPERACIONES PÚBLICAS (sin autenticación)
    // ===============================================

    /**
     * Obtiene todo el contenido rico de un idioma
     * GET /i18n/rich-content/{languageCode}
     * @param {string} languageCode - Código del idioma (es, en, val)
     * @returns {Promise<Array<Object>>} Array de objetos RichContentDTO
     */
    static async getContentByLanguage(languageCode) {
        if (!languageCode) {
            throw new Error('Language code is required');
        }

        try {
            return (await this.get(`/i18n/rich-content/${languageCode}`)) || [];
        } catch (error) {
            console.error(`RichContentRepository: Error getting content for language ${languageCode}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene un contenido específico por idioma y clave
     * GET /i18n/rich-content/{languageCode}/{contentKey}
     * @param {string} languageCode - Código del idioma (es, en, val)
     * @param {string} contentKey - Clave del contenido (e.g., "historia_content")
     * @returns {Promise<Object>} RichContentDTO específico
     */
    static async getContentByLanguageAndKey(languageCode, contentKey) {
        if (!languageCode || !contentKey) {
            throw new Error('Language code and content key are required');
        }

        try {
            return await this.get(`/i18n/rich-content/${languageCode}/${contentKey}`);
        } catch (error) {
            console.error(`RichContentRepository: Error getting content ${contentKey} for language ${languageCode}:`, error);
            throw error;
        }
    }

    /**
     * Busca contenido en todos los idiomas
     * GET /i18n/rich-content/search?keyPart=texto
     * @param {string} keyPart - Parte de la clave a buscar
     * @returns {Promise<Array<Object>>} Array de objetos RichContentDTO que coinciden
     */
    static async searchContent(keyPart) {
        if (!keyPart) {
            throw new Error('Search text is required');
        }

        try {
            return (await this.get('/i18n/rich-content/search', {
                params: { keyPart }
            })) || [];
        } catch (error) {
            console.error(`RichContentRepository: Error searching content with keyPart ${keyPart}:`, error);
            throw error;
        }
    }

    /**
     * Busca contenido en un idioma específico
     * GET /i18n/rich-content/{languageCode}/search?keyPart=texto
     * @param {string} languageCode - Código del idioma (es, en, val)
     * @param {string} keyPart - Parte de la clave a buscar
     * @returns {Promise<Array<Object>>} Array de objetos RichContentDTO que coinciden
     */
    static async searchContentByLanguage(languageCode, keyPart) {
        if (!languageCode || !keyPart) {
            throw new Error('Language code and search text are required');
        }

        try {
            return (await this.get(`/i18n/rich-content/${languageCode}/search`, {
                params: { keyPart }
            })) || [];
        } catch (error) {
            console.error(`RichContentRepository: Error searching content in ${languageCode} with keyPart ${keyPart}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene todo el contenido rico para múltiples idiomas
     * @param {Array<string>} languageCodes - Array de códigos de idioma
     * @returns {Promise<Object>} Objeto con contenido por idioma
     */
    static async getAllContent(languageCodes = ['es', 'en', 'val']) {
        try {
            const contentByLanguage = {};

            const promises = languageCodes.map(async (languageCode) => {
                try {
                    const content = await this.getContentByLanguage(languageCode);
                    return { languageCode, content };
                } catch (error) {
                    console.warn(`Failed to get content for ${languageCode}:`, error);
                    return { languageCode, content: [] };
                }
            });

            const results = await Promise.all(promises);

            results.forEach(({ languageCode, content }) => {
                contentByLanguage[languageCode] = content;
            });

            return contentByLanguage;
        } catch (error) {
            console.error('RichContentRepository: Error getting all content:', error);
            throw error;
        }
    }

    // ===============================================
    // OPERACIONES PROTEGIDAS (requieren autenticación)
    // ===============================================

    /**
     * Crea un nuevo contenido rico
     * POST /i18n/rich-content
     * @param {Object} richContentDTO - Objeto { language, contentKey, contentValue }
     * @param {string} token - Token de autenticación
     * @returns {Promise<Object>} RichContentDTO creado
     */
    static async createContent(richContentDTO, token) {
        if (!richContentDTO || !richContentDTO.language || !richContentDTO.contentKey) {
            throw new Error('Language, contentKey are required');
        }

        if (!token) {
            throw new Error('Authentication token is required');
        }

        try {
            return await this.post('/i18n/rich-content', richContentDTO, {
                headers: this.getAuthHeaders(token)
            });
        } catch (error) {
            console.error('RichContentRepository: Error creating content:', error);
            throw error;
        }
    }

    /**
     * Actualiza un contenido rico existente
     * PUT /i18n/rich-content
     * @param {Object} richContentDTO - Objeto { language, contentKey, contentValue }
     * @param {string} token - Token de autenticación
     * @returns {Promise<Object>} RichContentDTO actualizado
     */
    static async updateContent(richContentDTO, token) {
        if (!richContentDTO || !richContentDTO.language || !richContentDTO.contentKey) {
            throw new Error('Language, contentKey are required');
        }

        if (!token) {
            throw new Error('Authentication token is required');
        }

        try {
            return await this.put('/i18n/rich-content', richContentDTO, {
                headers: this.getAuthHeaders(token)
            });
        } catch (error) {
            console.error('RichContentRepository: Error updating content:', error);
            throw error;
        }
    }

    /**
     * Elimina un contenido rico
     * DELETE /i18n/rich-content/{languageCode}/{contentKey}
     * @param {string} languageCode - Código del idioma
     * @param {string} contentKey - Clave del contenido
     * @param {string} token - Token de autenticación
     * @returns {Promise<void>}
     */
    static async deleteContent(languageCode, contentKey, token) {
        if (!languageCode || !contentKey) {
            throw new Error('Language code and content key are required');
        }

        if (!token) {
            throw new Error('Authentication token is required');
        }

        try {
            return await this.delete(`/i18n/rich-content/${languageCode}/${contentKey}`, {
                headers: this.getAuthHeaders(token)
            });
        } catch (error) {
            console.error(`RichContentRepository: Error deleting content ${contentKey} for ${languageCode}:`, error);
            throw error;
        }
    }

    /**
     * Crea o actualiza contenido (upsert)
     * Intenta actualizar primero, si falla intenta crear
     * @param {Object} richContentDTO - Objeto { language, contentKey, contentValue }
     * @param {string} token - Token de autenticación
     * @returns {Promise<Object>} RichContentDTO creado o actualizado
     */
    static async upsertContent(richContentDTO, token) {
        try {
            // Intentar actualizar primero
            return await this.updateContent(richContentDTO, token);
        } catch (error) {
            // Si falla (404), intentar crear
            if (error.status === 404) {
                console.debug('Content not found, creating new one');
                return await this.createContent(richContentDTO, token);
            }
            throw error;
        }
    }

    // ===============================================
    // UTILIDADES
    // ===============================================

    /**
     * Convierte array de RichContentDTO a formato estructurado por clave
     * @param {Array<Object>} contentArray - Array de RichContentDTO
     * @returns {Object} Objeto con contenido organizado por contentKey
     */
    static convertToStructuredFormat(contentArray) {
        const structured = {};

        if (!Array.isArray(contentArray)) {
            return structured;
        }

        contentArray.forEach(item => {
            if (item.contentKey && item.contentValue !== undefined) {
                structured[item.contentKey] = {
                    html: item.contentValue,
                    language: item.language
                };
            }
        });

        return structured;
    }

    /**
     * Obtiene contenido en formato estructurado para un idioma
     * @param {string} languageCode - Código del idioma
     * @returns {Promise<Object>} Objeto con contenido estructurado
     */
    static async getStructuredContent(languageCode) {
        try {
            const contentArray = await this.getContentByLanguage(languageCode);
            return this.convertToStructuredFormat(contentArray);
        } catch (error) {
            console.error(`RichContentRepository: Error getting structured content for ${languageCode}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene todo el contenido en formato estructurado para múltiples idiomas
     * @param {Array<string>} languageCodes - Array de códigos de idioma
     * @returns {Promise<Object>} Objeto anidado por contentKey y language
     */
    static async getAllStructuredContent(languageCodes = ['es', 'en', 'val']) {
        try {
            const allContent = await this.getAllContent(languageCodes);
            const structured = {};

            Object.entries(allContent).forEach(([languageCode, contentArray]) => {
                contentArray.forEach(item => {
                    if (item.contentKey && item.contentValue !== undefined) {
                        if (!structured[item.contentKey]) {
                            structured[item.contentKey] = {};
                        }
                        structured[item.contentKey][languageCode] = {
                            html: item.contentValue
                        };
                    }
                });
            });

            return structured;
        } catch (error) {
            console.error('RichContentRepository: Error getting all structured content:', error);
            throw error;
        }
    }

    /**
     * Verifica el estado del servicio de rich content en el backend
     */
    static async healthCheck() {
        try {
            // Intentar obtener contenido para español como test
            const content = await this.getContentByLanguage('es');

            return {
                status: 'healthy',
                service: 'RichContentRepository',
                backend: this.getBaseUrl(),
                endpoints: {
                    byLanguage: '/i18n/rich-content/{languageCode}',
                    byLanguageAndKey: '/i18n/rich-content/{languageCode}/{contentKey}',
                    search: '/i18n/rich-content/search',
                    searchByLanguage: '/i18n/rich-content/{languageCode}/search',
                    create: 'POST /i18n/rich-content',
                    update: 'PUT /i18n/rich-content',
                    delete: 'DELETE /i18n/rich-content/{languageCode}/{contentKey}'
                },
                contentCount: content.length,
                lastCheck: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                service: 'RichContentRepository',
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
                byLanguage: '/i18n/rich-content/{languageCode}',
                byLanguageAndKey: '/i18n/rich-content/{languageCode}/{contentKey}',
                search: '/i18n/rich-content/search',
                searchByLanguage: '/i18n/rich-content/{languageCode}/search',
                create: 'POST /i18n/rich-content',
                update: 'PUT /i18n/rich-content',
                delete: 'DELETE /i18n/rich-content/{languageCode}/{contentKey}'
            }
        };
    }
}
