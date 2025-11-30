import { BaseRepository } from './BaseRepository.js';

/**
 * Repositorio para operaciones de información de contacto
 * Conecta con los endpoints /contact del backend Spring Boot
 */
export class ContactRepository extends BaseRepository {

    /**
     * Obtiene información del restaurante traducida
     * GET /contact/translated-restaurant-info?language={language}
     * @param {string} language - Código de idioma (es, en, val)
     * @returns {Promise<Object>} Información completa del restaurante
     */
    static async getTranslatedRestaurantInfo(language = 'es') {
        if (!language) {
            throw new Error('Language is required');
        }

        try {
            return await this.get('/contact/translated-restaurant-info', {
                params: { language }
            });
        } catch (error) {
            console.error('ContactRepository: Error getting translated restaurant info:', error);
            throw error;
        }
    }

    /**
     * Obtiene información del restaurante con fallback a español
     * @param {string} language - Código de idioma preferido
     * @returns {Promise<Object>} Información del restaurante
     */
    static async getRestaurantInfoWithFallback(language = 'es') {
        try {
            return await this.getTranslatedRestaurantInfo(language);
        } catch (error) {
            console.warn(`Failed to get restaurant info for language ${language}, falling back to Spanish:`, error);
            
            if (language !== 'es') {
                try {
                    return await this.getTranslatedRestaurantInfo('es');
                } catch (fallbackError) {
                    console.error('ContactRepository: Even Spanish fallback failed:', fallbackError);
                    throw fallbackError;
                }
            }
            
            throw error;
        }
    }

    /**
     * Verifica si el servicio de contacto está disponible
     * @returns {Promise<Object>} Estado del servicio
     */
    static async healthCheck() {
        try {
            // Intentar obtener información del restaurante como test
            await this.getTranslatedRestaurantInfo('es');
            
            return {
                status: 'healthy',
                service: 'ContactRepository',
                endpoints: {
                    translatedRestaurantInfo: '/contact/translated-restaurant-info'
                },
                lastCheck: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                service: 'ContactRepository',
                error: error.message,
                lastCheck: new Date().toISOString()
            };
        }
    }

    /**
     * Actualiza/guarda cambios en la información del restaurante
     * POST /contact/update?language={language}
     * REQUIERE AUTENTICACIÓN
     * @param {Object} restaurantData - Datos completos del restaurante
     * @param {string} language - Código de idioma
     * @param {string} token - Token de autenticación (opcional)
     * @returns {Promise<Object>} Respuesta del backend
     */
    static async updateRestaurantInfo(restaurantData, language = 'es', token) {
        if (!restaurantData) {
            throw new Error('RestaurantData is required');
        }

        if (!token) {
            throw new Error('Token is required');
        }

        try {
            const endpoint = `/contact/update?language=${encodeURIComponent(language)}`;

            return await this.post(endpoint, restaurantData, {
                headers: this.getAuthHeaders(token)
            });
        } catch (error) {
            console.error('ContactRepository: Error updating restaurant info:', error);
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
                translatedRestaurantInfo: '/contact/translated-restaurant-info',
                updateRestaurantInfo: '/contact/update'
            },
            supportedLanguages: ['es', 'en', 'val'],
            defaultLanguage: 'es'
        };
    }
}