import { ContactRepository } from '../repositories/ContactRepository.js';
import { I18nService } from './I18nService.js';
import { AuthService } from './AuthService.js';

const DAY_NAMES = [ 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday' ];

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
            const { schedules } = await ContactRepository.getTranslatedRestaurantInfo(language);
            
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

            const validSchedule = todaySchedule && todaySchedule.isOpen && todaySchedule.scheduleRanges?.length;
            if (!validSchedule) {
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
     * Obtiene información de contacto básica
     * @param {string} language - Código de idioma
     * @returns {Promise<Object>} Información de contacto
     */
    static async getContactInfo(language = 'es') {
        try {
            return await ContactRepository.getTranslatedRestaurantInfo(language);
        } catch (error) {
            console.error('ContactService: Error getting contact info:', error);
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
            return await ContactRepository.updateRestaurantInfo(restaurantData, language, AuthService.getToken());
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
            const restaurantInfo = await ContactRepository.getTranslatedRestaurantInfo(language);
            const contactInfo = restaurantInfo.contactInfo;

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
            console.error('ContactService: Error getting action links:', error);
            throw error;
        }
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
            const { schedules } = await ContactRepository.getTranslatedRestaurantInfo(language);

            const scheduleGroups = new Map();

            DAY_NAMES.forEach((dayName, index) => { 
                const daySchedule = schedules
                    .find(schedule => schedule.dayOfWeek.toLowerCase() === dayName.toLowerCase());

                const validSchedule = daySchedule && daySchedule.isOpen && daySchedule.scheduleRanges?.length;
                let scheduleKey;
                
                if (!validSchedule) {
                    scheduleKey = 'CLOSED';
                } else {
                    const sortedRanges = [...daySchedule.scheduleRanges].sort((a, b) => 
                        this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startEnd)
                    );
                    scheduleKey = sortedRanges.map(range => 
                        `${range.startTime}-${range.endTime}`
                    ).join('|');
                }
                
                if (!scheduleGroups.has(scheduleKey)) {
                    scheduleGroups.set(scheduleKey, {
                        days: [],
                        dayIndexes: [],
                        ranges:  daySchedule?.scheduleRanges || [],
                        closed: !validSchedule || daySchedule.scheduleRanges.length === 0
                    });
                }

                // Obtener nombre traducido del día
                const dayTranslationKey = `contact.days.${dayName}`;
                const translatedDay = I18nService.getTranslation(dayTranslationKey, language, dayName);

                scheduleGroups.get(scheduleKey).days.push(translatedDay);
                scheduleGroups.get(scheduleKey).dayIndexes.push(index);
            })

            const value = Array.from(scheduleGroups.values());
            const result = Array.from(scheduleGroups.values()).map(group => ({
                ...group,
                daysDisplay: this.formatDaysRange(group.days, group.dayIndexes, language),
                firstDayIndex: Math.min(...group.dayIndexes) 
            }));
            
            const sortedResult = result.sort((a, b) => {
                const firstDayA = a.firstDayIndex === 0 ? 7 : a.firstDayIndex;
                const firstDayB = b.firstDayIndex === 0 ? 7 : b.firstDayIndex;
                return firstDayA - firstDayB;
            });

            return sortedResult;
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
     * Genera datos estructurados para JSON-LD
     * @param {string} language - Código de idioma
     * @returns {Promise<Object>} Datos estructurados del restaurante
     */
    static async getStructuredData(language = 'es') {
        try {
            const {
                name,
                contactInfo,
                schedules,
                socialMedias
            } =  await ContactRepository.getTranslatedRestaurantInfo(language);

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
                "name": name,
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
                "sameAs": socialMedias.map(social => social.url).filter(Boolean),
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
            const message = statusData.message || statusData.fullMessage || 'Estado desconocido';
            // Mantener el formato HTML con <strong>
            statusText.innerHTML = `<strong>${message}</strong>`;
        }
    }
}

export default ContactService;