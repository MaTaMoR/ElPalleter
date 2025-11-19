// src/services/ContactService.js

import { ContactRepository } from '../repositories/ContactRepository.js';
import I18nService from '../services/I18nService.js';

/**
 * Servicio de contacto actualizado para usar el backend Spring Boot
 * Reemplaza los datos estáticos con llamadas a la API
 */
export class ContactService {

    /**
     * Obtiene todos los datos de contacto del restaurante
     * @param {string} language - Código de idioma (es, en, val)
     * @returns {Promise<Object>} Datos completos de contacto
     */
    static async getContactData(language = 'es') {
        try {
            return await ContactRepository.getTranslatedRestaurantInfo(language);
        } catch (error) {
            console.error('ContactService: Error getting contact data:', error);
            throw error;
        }
    }

    /**
     * Obtiene el estado actual del restaurante (abierto/cerrado)
     * @param {string} language - Código de idioma
     * @returns {Promise<Object>} Estado actual del restaurante
     */
    static async getRestaurantStatus(language = 'es') {
        try {
            return await ContactRepository.getCurrentStatus(language);
        } catch (error) {
            console.error('ContactService: Error getting restaurant status:', error);
            throw error;
        }
    }

    /**
     * Obtiene información de contacto básica
     * @param {string} language - Código de idioma
     * @returns {Promise<Object>} Información de contacto
     */
    static async getContactInfo(language = 'es') {
        try {
            return await ContactRepository.getContactInfo(language);
        } catch (error) {
            console.error('ContactService: Error getting contact info:', error);
            throw error;
        }
    }

    /**
     * Obtiene horarios del restaurante
     * @param {string} language - Código de idioma
     * @returns {Promise<Array>} Array de horarios por día
     */
    static async getSchedules(language = 'es') {
        try {
            return await ContactRepository.getSchedules(language);
        } catch (error) {
            console.error('ContactService: Error getting schedules:', error);
            throw error;
        }
    }

    /**
     * Obtiene redes sociales activas
     * @param {string} language - Código de idioma
     * @returns {Promise<Array>} Array de redes sociales habilitadas
     */
    static async getEnabledSocials(language = 'es') {
        try {
            return await ContactRepository.getActiveSocialMedias(language);
        } catch (error) {
            console.error('ContactService: Error getting enabled socials:', error);
            throw error;
        }
    }

    /**
     * Actualiza la información completa del restaurante
     * @param {Object} restaurantData - Datos del restaurante a actualizar
     * @param {string} language - Código de idioma
     * @returns {Promise<Object>} Resultado de la actualización
     */
    static async updateRestaurantInfo(restaurantData, language = 'es') {
        try {
            return await ContactRepository.updateRestaurantInfo(restaurantData, language);
        } catch (error) {
            console.error('ContactService: Error updating restaurant info:', error);
            throw error;
        }
    }

    /**
     * Genera enlaces de acción (teléfono, email, maps, etc.)
     * @param {string} language - Código de idioma
     * @returns {Promise<Object>} Enlaces de acción
     */
    static async getActionLinks(language = 'es') {
        try {
            return await ContactRepository.getActionLinks(language);
        } catch (error) {
            console.error('ContactService: Error getting action links:', error);
            throw error;
        }
    }

    /**
     * MÉTODO LEGACY: Convierte formato del backend al formato legacy para compatibilidad
     * @param {Array} schedulesFromBackend - Horarios del backend
     * @returns {Object} Horarios en formato legacy
     */
    static convertSchedulesToLegacyFormat(schedulesFromBackend) {
        const legacySchedule = {};
        const dayMapping = {
            'sunday': 'sunday',
            'monday': 'monday', 
            'tuesday': 'tuesday',
            'wednesday': 'wednesday',
            'thursday': 'thursday',
            'friday': 'friday',
            'saturday': 'saturday'
        };

        schedulesFromBackend.forEach(schedule => {
            const dayKey = dayMapping[schedule.dayOfWeek.toLowerCase()];
            if (dayKey) {
                legacySchedule[dayKey] = {
                    open: schedule.isOpen,
                    ranges: schedule.scheduleRanges?.map(range => ({
                        nameKey: range.nameKey,
                        name: range.nameKey, // Backend debería manejar las traducciones
                        start: this.formatTimeFromBackend(range.startTime),
                        end: this.formatTimeFromBackend(range.endTime)
                    })) || []
                };
            }
        });

        return legacySchedule;
    }

    /**
     * Formatea tiempo del backend al formato esperado por el frontend
     * @param {string} backendTime - Tiempo en formato del backend (posiblemente ISO)
     * @returns {string} Tiempo en formato HH:MM
     */
    static formatTimeFromBackend(backendTime) {
        if (!backendTime) return '00:00';
        
        // Si ya está en formato HH:MM, devolverlo tal como está
        if (typeof backendTime === 'string' && backendTime.match(/^\d{2}:\d{2}$/)) {
            return backendTime;
        }
        
        // Si es un objeto Time de Java o ISO, convertirlo
        try {
            const date = new Date(`1970-01-01T${backendTime}`);
            return date.toTimeString().slice(0, 5);
        } catch (error) {
            console.warn('Could not format time from backend:', backendTime);
            return '00:00';
        }
    }

    /**
     * MÉTODO LEGACY: Agrupa días con horarios idénticos (mantenido para compatibilidad)
     * @param {string} language - Código de idioma
     * @returns {Promise<Array>} Array de grupos con días y horarios
     */
    static async getGroupedSchedule(language = 'es') {
        try {
            const schedules = await this.getSchedules(language);
            const legacySchedule = this.convertSchedulesToLegacyFormat(schedules);
            
            const scheduleGroups = new Map();
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            
            dayNames.forEach((dayName, index) => {
                const daySchedule = legacySchedule[dayName];
                
                let scheduleKey;
                if (!daySchedule || !daySchedule.open || !daySchedule.ranges || daySchedule.ranges.length === 0) {
                    scheduleKey = 'CLOSED';
                } else {
                    const sortedRanges = [...daySchedule.ranges].sort((a, b) => 
                        this.timeToMinutes(a.start) - this.timeToMinutes(b.start)
                    );
                    scheduleKey = sortedRanges.map(range => 
                        `${range.nameKey || range.name || 'Sin nombre'}:${range.start}-${range.end}`
                    ).join('|');
                }
                
                if (!scheduleGroups.has(scheduleKey)) {
                    scheduleGroups.set(scheduleKey, {
                        days: [],
                        dayIndexes: [],
                        ranges: daySchedule && daySchedule.open ? daySchedule.ranges || [] : [],
                        closed: !daySchedule || !daySchedule.open || !daySchedule.ranges || daySchedule.ranges.length === 0
                    });
                }

                // Obtener nombre traducido del día
                const dayTranslationKey = `contact.days.${dayName}`;
                const translatedDay = I18nService.getTranslation ? 
                    I18nService.getTranslation(dayTranslationKey, language, dayName) : 
                    dayName;

                scheduleGroups.get(scheduleKey).days.push(translatedDay);
                scheduleGroups.get(scheduleKey).dayIndexes.push(index);
            });
            
            const result = Array.from(scheduleGroups.values()).map(group => ({
                ...group,
                daysDisplay: this.formatDaysRange(group.days, group.dayIndexes, language),
                firstDayIndex: Math.min(...group.dayIndexes) 
            }));
            
            return result.sort((a, b) => {
                const firstDayA = a.firstDayIndex === 0 ? 7 : a.firstDayIndex;
                const firstDayB = b.firstDayIndex === 0 ? 7 : b.firstDayIndex;
                return firstDayA - firstDayB;
            });
        } catch (error) {
            console.error('ContactService: Error getting grouped schedule:', error);
            throw error;
        }
    }

    /**
     * Convierte tiempo en formato HH:MM a minutos desde medianoche
     * @param {string} time - Tiempo en formato "HH:MM"
     * @returns {number} - Minutos desde medianoche
     */
    static timeToMinutes(time) {
        if (!time) return 0;
        const [hours, minutes] = time.split(':').map(Number);
        return (hours || 0) * 60 + (minutes || 0);
    }

    /**
     * Formatea rangos de días para mostrar de forma compacta
     * @param {Array} days - Array de nombres de días
     * @param {Array} dayIndexes - Array de índices de días (0=domingo)
     * @param {string} language - Código de idioma
     * @returns {string} - Rango formateado
     */
    static formatDaysRange(days, dayIndexes, language) {
        if (days.length === 0) return '';
        if (days.length === 1) return days[0];
        
        const sortedPairs = days.map((day, i) => ({ 
            day, 
            index: dayIndexes[i] === 0 ? 7 : dayIndexes[i] 
        })).sort((a, b) => a.index - b.index);
        
        const sortedDays = sortedPairs.map(pair => pair.day);
        const sortedIndexes = sortedPairs.map(pair => pair.index);
        
        let isContinuous = true;
        for (let i = 1; i < sortedIndexes.length; i++) {
            if (sortedIndexes[i] !== sortedIndexes[i-1] + 1) {
                isContinuous = false;
                break;
            }
        }
        
        if (isContinuous && sortedDays.length > 2) {
            return `${sortedDays[0]} - ${sortedDays[sortedDays.length - 1]}`;
        }
        
        const andWord = I18nService.getTranslation ? 
            I18nService.getTranslation('contact.status.and', language, 'y') : 'y';
    
        if (sortedDays.length === 2) {
            return sortedDays.join(` ${andWord} `);
        }
        
        return sortedDays.slice(0, -1).join(', ') + ` ${andWord} ` + sortedDays[sortedDays.length - 1];
    }

    /**
     * Obtiene la dirección completa formateada
     * @param {string} language - Código de idioma
     * @returns {Promise<string>} Dirección completa
     */
    static async getFullAddress(language = 'es') {
        try {
            const contactInfo = await this.getContactInfo(language);
            if (!contactInfo) return '';
            
            return `${contactInfo.street}, ${contactInfo.postalCode} ${contactInfo.city}, ${contactInfo.province}`;
        } catch (error) {
            console.error('ContactService: Error getting full address:', error);
            return '';
        }
    }

    /**
     * Genera datos estructurados para JSON-LD
     * @param {string} language - Código de idioma
     * @returns {Promise<Object>} Datos estructurados del restaurante
     */
    static async getStructuredData(language = 'es') {
        try {
            const [restaurantInfo, contactInfo, schedules, socials] = await Promise.all([
                this.getContactData(language),
                this.getContactInfo(language),
                this.getSchedules(language),
                this.getEnabledSocials(language)
            ]);

            // Generar especificación de horarios para schema.org
            const openingHours = [];
            schedules.forEach(schedule => {
                if (schedule.isOpen && schedule.scheduleRanges?.length) {
                    schedule.scheduleRanges.forEach(range => {
                        openingHours.push({
                            "@type": "OpeningHoursSpecification",
                            "dayOfWeek": schedule.dayOfWeek,
                            "opens": this.formatTimeFromBackend(range.startTime),
                            "closes": this.formatTimeFromBackend(range.endTime)
                        });
                    });
                }
            });

            return {
                "@context": "https://schema.org",
                "@type": "Restaurant",
                "name": restaurantInfo.name,
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": contactInfo.street,
                    "addressLocality": contactInfo.city,
                    "addressRegion": contactInfo.province,
                    "postalCode": contactInfo.postalCode,
                    "addressCountry": contactInfo.country
                },
                "telephone": contactInfo.phoneMain,
                "email": contactInfo.emailMain,
                "url": contactInfo.website,
                "openingHours": openingHours,
                "sameAs": socials.map(social => social.url).filter(Boolean),
                "servesCuisine": "Mediterranean",
                "acceptsReservations": true,
                "priceRange": "$$"
            };
        } catch (error) {
            console.error('ContactService: Error generating structured data:', error);
            throw error;
        }
    }

    /**
     * MÉTODO PRINCIPAL: Helper para usar en Astro con traducciones
     * @param {Object} i18nInstance - Instancia de i18n
     * @param {string} language - Idioma actual
     * @returns {Promise<Object>} Datos de contacto con traducciones aplicadas
     */
    static async getContactDataWithTranslations(i18nInstance, language = 'es') {
        try {
            const [restaurantInfo, statusData, actionLinks, groupedSchedule] = await Promise.all([
                this.getContactData(language),
                this.getRestaurantStatus(language),
                this.getActionLinks(language),
                this.getGroupedSchedule(language)
            ]);

            // Formatear estado del restaurante con traducciones
            let statusText = 'No Disponible';
            let fullMessage = 'No Disponible';
            
            if (i18nInstance && i18nInstance.getTranslation) {
                try {
                    statusText = statusData.isOpen ? 
                        i18nInstance.getTranslation('contact.status.states.open', language, 'Abierto') :
                        i18nInstance.getTranslation('contact.status.states.closed', language, 'Cerrado');
                    
                    fullMessage = statusData.message || statusText;
                } catch (translationError) {
                    console.warn('Error translating status:', translationError);
                    fullMessage = statusData.message || statusText;
                }
            } else {
                fullMessage = statusData.message || statusText;
            }

            return {
                restaurant: { name: restaurantInfo.name },
                contactInfo: restaurantInfo.contactInfo,
                schedules: restaurantInfo.schedules,
                groupedSchedule,
                statusInfo: {
                    ...statusData,
                    statusText,
                    fullMessage
                },
                socials: restaurantInfo.socialMedias?.filter(social => social.enabled) || [],
                actionLinks,
                fullAddress: actionLinks.fullAddress || '',
                meta: {
                    language,
                    generatedAt: new Date().toISOString(),
                    isFromBackend: true
                }
            };
        } catch (error) {
            console.error('ContactService: Error getting contact data with translations:', error);
            throw error;
        }
    }

    /**
     * Verifica si el servicio está disponible
     * @returns {Promise<Object>} Estado del servicio
     */
    static async healthCheck() {
        try {
            const repoHealth = await ContactRepository.healthCheck();
            
            return {
                ...repoHealth,
                service: 'ContactService',
                lastCheck: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                service: 'ContactService',
                error: error.message,
                lastCheck: new Date().toISOString()
            };
        }
    }

    /**
     * Obtiene la configuración del servicio
     * @returns {Object} Configuración actual
     */
    static getConfig() {
        return {
            repository: ContactRepository.getConfig(),
            supportedLanguages: ['es', 'en', 'val'],
            defaultLanguage: 'es'
        };
    }
}

/**
 * Clase para monitoreo en tiempo real del estado del restaurante
 * Actualizada para usar el backend
 */
export class ContactStatusManager {
    constructor(language = 'es') {
        this.language = language;
        this.statusUpdateInterval = null;
        this.callbacks = [];
        this.lastStatus = null;
    }

    async startMonitoring(intervalMs = 60000) {
        await this.updateStatus();
        this.statusUpdateInterval = setInterval(() => {
            this.updateStatus();
        }, intervalMs);
    }

    stopMonitoring() {
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
            this.statusUpdateInterval = null;
        }
    }

    onStatusChange(callback) {
        this.callbacks.push(callback);
    }

    async updateStatus() {
        try {
            const newStatus = await ContactService.getRestaurantStatus(this.language);
            
            // Solo ejecutar callbacks si el estado cambió
            if (!this.lastStatus || this.lastStatus.status !== newStatus.status) {
                this.callbacks.forEach(callback => {
                    try {
                        callback(newStatus, this.lastStatus);
                    } catch (error) {
                        console.error('Error in status callback:', error);
                    }
                });
            }
            
            this.lastStatus = newStatus;
        } catch (error) {
            console.error('Error updating restaurant status:', error);
        }
    }

    updateStatusElements(statusData, translateFn = null) {
        const statusElement = document.getElementById('restaurantStatus');
        const statusText = document.getElementById('statusText');
        
        if (statusElement) {
            statusElement.className = `status status-${statusData.status}`;
        }
        
        if (statusText) {
            statusText.textContent = statusData.message || statusData.fullMessage || 'Estado desconocido';
        }
    }
}

export default ContactService;