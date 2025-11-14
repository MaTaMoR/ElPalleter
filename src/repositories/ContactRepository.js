// src/repositories/ContactRepository.js
import { BaseRepository } from './BaseRepository.js';
import { I18nService } from '../services/I18Service.js';

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
        try {
            const response = await this.get('/contact/translated-restaurant-info', {
                params: { language }
            });
            
            return response;
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
     * Obtiene solo la información de contacto básica
     * @param {string} language - Código de idioma
     * @returns {Promise<Object>} Información de contacto
     */
    static async getContactInfo(language = 'es') {
        try {
            const restaurantInfo = await this.getTranslatedRestaurantInfo(language);
            return restaurantInfo.contactInfo || null;
        } catch (error) {
            console.error('ContactRepository: Error getting contact info:', error);
            throw error;
        }
    }

    /**
     * Obtiene solo los horarios del restaurante
     * @param {string} language - Código de idioma
     * @returns {Promise<Array>} Array de horarios por día
     */
    static async getSchedules(language = 'es') {
        try {
            const restaurantInfo = await this.getTranslatedRestaurantInfo(language);
            return restaurantInfo.schedules || [];
        } catch (error) {
            console.error('ContactRepository: Error getting schedules:', error);
            throw error;
        }
    }

    /**
     * Obtiene solo las redes sociales
     * @param {string} language - Código de idioma
     * @returns {Promise<Array>} Array de redes sociales
     */
    static async getSocialMedias(language = 'es') {
        try {
            const restaurantInfo = await this.getTranslatedRestaurantInfo(language);
            return restaurantInfo.socialMedias || [];
        } catch (error) {
            console.error('ContactRepository: Error getting social medias:', error);
            throw error;
        }
    }

    /**
     * Obtiene solo las redes sociales activas/habilitadas
     * @param {string} language - Código de idioma
     * @returns {Promise<Array>} Array de redes sociales activas
     */
    static async getActiveSocialMedias(language = 'es') {
        try {
            const socialMedias = await this.getSocialMedias(language);
            return socialMedias.filter(social => social.enabled === true);
        } catch (error) {
            console.error('ContactRepository: Error getting active social medias:', error);
            throw error;
        }
    }

    /**
     * Calcula el estado actual del restaurante basado en horarios
     * @param {string} language - Código de idioma
     * @returns {Promise<Object>} Estado actual del restaurante
     */
    static async getCurrentStatus(language = 'es') {
        try {
            const schedules = await this.getSchedules(language);
            
            const now = new Date();
            const currentDay = now.getDay(); // 0 = domingo, 1 = lunes, etc.
            const currentTime = now.getHours() * 60 + now.getMinutes(); // minutos desde medianoche
            
            // Mapear días (backend podría usar nombres en inglés)
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const currentDayName = dayNames[currentDay];
            
            // Buscar horario del día actual
            const todaySchedule = schedules.find(schedule => 
                schedule.dayOfWeek.toLowerCase() === currentDayName.toLowerCase()
            );
            
            if (!todaySchedule || !todaySchedule.isOpen || !todaySchedule.scheduleRanges?.length) {
                return {
                    status: 'closed',
                    isOpen: false,
                    message: I18nService.getTranslation('contact.status.states.closed', language),
                    nextOpening: await this.getNextOpening(schedules, currentDay, currentTime)
                };
            }

            // Verificar si está abierto en algún rango actual
            for (const range of todaySchedule.scheduleRanges) {
                const startMinutes = this.timeToMinutes(range.startTime);
                const endMinutes = this.timeToMinutes(range.endTime);
                
                if (currentTime >= startMinutes && currentTime <= endMinutes) {
                    const minutesUntilClose = endMinutes - currentTime;
                    // contact.status.messages.closingIn
                    if (minutesUntilClose <= 30) {
                        return {
                            status: 'closing_soon',
                            isOpen: true,
                            message: I18nService.getTranslation('contact.status.messages.closingIn', language, { 
                                minutes: minutesUntilClose
                            }),
                            minutesUntilClose,
                            closingTime: range.endTime
                        };
                    }
                    
                    return {
                        status: 'open',
                        isOpen: true,
                        message: I18nService.getTranslation('contact.status.messages.until', language, { 
                            time: range.endTime
                        }),
                        closingTime: range.endTime
                    };
                }
            }

            // Verificar si abre pronto
            const nextRange = todaySchedule.scheduleRanges
                .filter(range => this.timeToMinutes(range.startTime) > currentTime)
                .sort((a, b) => this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime))[0];

            if (nextRange) {
                const minutesUntilOpen = this.timeToMinutes(nextRange.startTime) - currentTime;
                
                if (minutesUntilOpen <= 60) {
                    return {
                        status: 'opening_soon',
                        isOpen: false,
                        message: I18nService.getTranslation('contact.status.messages.openingAt', language, { 
                            time: minutesUntilOpen
                        }),
                        minutesUntilOpen,
                        openingTime: nextRange.startTime
                    };
                }
            }

            return {
                status: 'closed',
                isOpen: false,
                message: I18nService.getTranslation('contact.status.states.closed', language),
                nextOpening: await this.getNextOpening(schedules, currentDay, currentTime)
            };
        } catch (error) {
            console.error('ContactRepository: Error calculating current status:', error);
            return {
                status: 'unknown',
                isOpen: false,
                message: 'Estado desconocido',
                error: error.message
            };
        }
    }

    /**
     * Encuentra la próxima apertura del restaurante
     * @param {Array} schedules - Array de horarios
     * @param {number} currentDay - Día actual (0-6)
     * @param {number} currentTime - Tiempo actual en minutos
     * @returns {Promise<Object|null>} Información de la próxima apertura
     */
    static async getNextOpening(schedules, currentDay, currentTime) {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        // Buscar en los próximos 7 días
        for (let i = 0; i < 7; i++) {
            const checkDay = (currentDay + i) % 7;
            const dayName = dayNames[checkDay];
            
            const daySchedule = schedules.find(schedule => 
                schedule.dayOfWeek.toLowerCase() === dayName.toLowerCase()
            );
            
            if (!daySchedule || !daySchedule.isOpen || !daySchedule.scheduleRanges?.length) {
                continue;
            }
            
            const ranges = daySchedule.scheduleRanges
                .sort((a, b) => this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime));
                
            if (i === 0) {
                // Día actual - buscar rangos que aún no han empezado
                const futureRanges = ranges.filter(range => 
                    this.timeToMinutes(range.startTime) > currentTime
                );
                
                if (futureRanges.length > 0) {
                    return {
                        day: dayName,
                        dayIndex: checkDay,
                        time: futureRanges[0].startTime,
                        isToday: true
                    };
                }
            } else {
                // Días futuros - tomar el primer rango
                if (ranges.length > 0) {
                    return {
                        day: dayName,
                        dayIndex: checkDay,
                        time: ranges[0].startTime,
                        isToday: false
                    };
                }
            }
        }
        
        return null;
    }

    /**
     * Convierte tiempo HH:MM a minutos desde medianoche
     * @param {string} timeString - Tiempo en formato "HH:MM"
     * @returns {number} Minutos desde medianoche
     */
    static timeToMinutes(timeString) {
        if (!timeString) return 0;
        
        const [hours, minutes] = timeString.split(':').map(Number);
        return (hours || 0) * 60 + (minutes || 0);
    }

    /**
     * Genera enlaces de acción (teléfono, email, maps, etc.)
     * @param {string} language - Código de idioma
     * @returns {Promise<Object>} Enlaces de acción
     */
    static async getActionLinks(language = 'es') {
        try {
            const contactInfo = await this.getContactInfo(language);
            const restaurantInfo = await this.getTranslatedRestaurantInfo(language);
            
            if (!contactInfo) {
                throw new Error('No contact info available');
            }

            const fullAddress = `${contactInfo.street}, ${contactInfo.postalCode} ${contactInfo.city}, ${contactInfo.province}`;
            
            return {
                call: contactInfo.phoneMain ? `tel:${contactInfo.phoneMain}` : null,
                email: contactInfo.emailMain ? `mailto:${contactInfo.emailMain}` : null,
                website: contactInfo.website || null,
                maps: fullAddress ? `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}` : null,
                directions: fullAddress ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}` : null,
                fullAddress
            };
        } catch (error) {
            console.error('ContactRepository: Error generating action links:', error);
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
     * Obtiene la configuración del repositorio
     * @returns {Object} Configuración actual
     */
    static getConfig() {
        return {
            baseUrl: this.getBaseUrl(),
            endpoints: {
                translatedRestaurantInfo: '/contact/translated-restaurant-info'
            },
            supportedLanguages: ['es', 'en', 'val'],
            defaultLanguage: 'es'
        };
    }
}