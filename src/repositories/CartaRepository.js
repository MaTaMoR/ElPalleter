import { BaseRepository } from './BaseRepository.js';

/**
 * Repositorio para operaciones de carta/menú
 * Conecta con los endpoints /carta del backend Spring Boot
 */
export class CartaRepository extends BaseRepository {

    /**
     * Obtiene categorías traducidas del menú
     * GET /carta/translated-categories?language={language}
     * @param {string} language - Código de idioma (es, en, val)
     * @returns {Promise<Array>} Array de categorías con subcategorías e items
     */
    static async getTranslatedCategories(language = 'es') {
        if (!language) {
            throw new Error('Language is required');
        }

        try {
            return await this.get('/carta/translated-categories', {
                params: { language }
            });
        } catch (error) {
            console.error('CartaRepository: Error getting translated categories:', error);
            throw error;
        }
    }

    /**
     * Verifica si el servicio de carta está disponible
     * @returns {Promise<Object>} Estado del servicio
     */
    static async healthCheck() {
        try {
            // Intentar obtener categorías en español como test
            await this.getTranslatedCategories('es');
            
            return {
                status: 'healthy',
                service: 'CartaRepository',
                endpoints: {
                    translatedCategories: '/carta/translated-categories'
                },
                lastCheck: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                service: 'CartaRepository',
                error: error.message,
                lastCheck: new Date().toISOString()
            };
        }
    }

    /**
     * Actualiza/guarda cambios en la carta
     * POST /carta/update?language={language}
     * REQUIERE AUTENTICACIÓN
     * @param {Array} menuData - Array de categorías con subcategorías e items
     * @param {string} language - Código de idioma
     * @param {string} token - Token de autenticación (opcional, se obtiene de AuthService)
     * @returns {Promise<Object>} Respuesta del backend
     */
    static async updateMenu(menuData, language = 'es', token) {
        if (!menuData) {
            throw new Error('MenuData is required');
        }

        if (!token) {
            throw new Error('Token is required');
        }

        try {
            // POST usa el endpoint directamente, agregamos params a la URL
            const endpoint = `/carta/update?language=${encodeURIComponent(language)}`;

            return await this.post(endpoint, menuData, { 
                headers: this.getAuthHeaders(token)
            });
        } catch (error) {
            console.error('CartaRepository: Error updating menu:', error);
            throw error;
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
                translatedCategories: '/carta/translated-categories',
                updateMenu: '/carta/update'
            },
            supportedLanguages: ['es', 'en', 'val'],
            defaultLanguage: 'es'
        };
    }
}