import { BaseRepository } from './BaseRepository.js';

/**
 * Repositorio para operaciones de analytics
 * Conecta con los endpoints /analytics del backend Spring Boot
 * Usado tanto por Astro como por React admin
 */
export class AnalyticsRepository extends BaseRepository {

    /**
     * Inicia el tracking de una visita
     * POST /analytics/visit/start
     * @param {Object} visitData - Datos de inicio de visita
     * @returns {Promise<void>}
     */
    static async trackVisitStart(visitData) {
        try {
            await this.post('/analytics/visit/start', visitData);
        } catch (error) {
            console.error('AnalyticsRepository: Error tracking visit start:', error);
            throw error;
        }
    }

    /**
     * Registra un evento de usuario
     * POST /analytics/event
     * @param {Object} eventData - Datos del evento
     * @returns {Promise<void>}
     */
    static async trackEvent(eventData) {
        try {
            await this.post('/analytics/event', eventData);
        } catch (error) {
            console.error('AnalyticsRepository: Error tracking event:', error);
            throw error;
        }
    }

    /**
     * Finaliza el tracking de una visita
     * POST /analytics/visit/end
     * @param {Object} endData - Datos de finalización
     * @returns {Promise<void>}
     */
    static async trackVisitEnd(endData) {
        try {
            await this.post('/analytics/visit/end', endData);
        } catch (error) {
            console.error('AnalyticsRepository: Error tracking visit end:', error);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas de la semana actual
     * GET /analytics/stats/weekly
     * @param {string} token - Valid token for request
     * @returns {Promise<Object>} Estadísticas semanales
     */
    static async getWeeklyStats(token) {
        try {
            console.log('Token recibido:', token);
            const headers = this.getAuthHeaders(token);
            console.log('Headers a enviar:', headers);
            
            const response = await this.get('/analytics/stats/weekly', {
                headers: headers
            });
            
            console.log('Response recibida:', response);
            return response;
        } catch (error) {
            console.error('AnalyticsRepository: Error getting weekly stats:', error);
            console.error('Error details:', error.response?.data);
            console.error('Error status:', error.response?.status);
            throw error;
        }
    }
    /**
     * Obtiene estadísticas para un período personalizado
     * GET /analytics/stats/
     * @param {string} token - Valid token for request
     * @param {string} startDate - Fecha de inicio (ISO string)
     * @param {string} endDate - Fecha de fin (ISO string)
     * @returns {Promise<Object>} Estadísticas del período
     */
    static async getCustomPeriodStats(token, startDate, endDate) {
        try {
            return await this.get('/analytics/stats/custom', {
                headers: this.getAuthHeaders(token),
                params: {
                    startDate,
                    endDate
                }
            });
        } catch (error) {
            console.error('AnalyticsRepository: Error getting custom period stats:', error);
            throw error;
        }
    }

    /**
     * Envía múltiples eventos en lote (para optimización)
     * @param {Array} events - Array de eventos
     * @returns {Promise<void>}
     */
    static async trackEventsBatch(events) {
        try {
            // Enviar eventos secuencialmente para evitar sobrecargar el servidor
            for (const event of events) {
                await this.trackEvent(event);
                // Pequeña pausa entre eventos
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        } catch (error) {
            console.error('AnalyticsRepository: Error tracking events batch:', error);
            throw error;
        }
    }

    /**
     * Verifica si el servicio de analytics está disponible
     * @returns {Promise<Object>} Estado del servicio
     */
    static async healthCheck() {
        try {
            // Hacer una petición simple para verificar conectividad
            await this.get('/analytics/stats/weekly');
            
            return {
                status: 'healthy',
                service: 'AnalyticsRepository',
                endpoints: {
                    visitStart: '/analytics/visit/start',
                    event: '/analytics/event',
                    visitEnd: '/analytics/visit/end',
                    weeklyStats: '/analytics/stats/weekly',
                    customStats: '/analytics/stats/custom'
                },
                lastCheck: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                service: 'AnalyticsRepository',
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
                visitStart: '/analytics/visit/start',
                event: '/analytics/event',
                visitEnd: '/analytics/visit/end',
                weeklyStats: '/analytics/stats/weekly',
                customStats: '/analytics/stats/custom'
            },
            eventTypes: [
                'PAGE_LOAD',
                'SECTION_VIEW', 
                'FORM_SUBMIT',
                'CONTACT_CLICK',
                'MENU_VIEW',
                'SCROLL_DEPTH',
                'PAGE_EXIT'
            ],
            deviceTypes: ['DESKTOP', 'MOBILE', 'TABLET', 'UNKNOWN']
        };
    }
}