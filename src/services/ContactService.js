// src/services/ContactService.js - ACTUALIZADO para horarios por día

import contactData from '../data/contact-data.json';

/**
 * Servicio para gestionar la información de contacto del restaurante
 */
export class ContactService {
    
    /**
     * Obtiene todos los datos de contacto
     * @returns {Object} - Datos completos de contacto
     */
    static getContactData() {
        return contactData;
    }

    /**
     * Obtiene el estado actual del restaurante
     * @returns {Object} - Estado con status y clave de traducción
     */
    static getRestaurantStatus() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes(); // minutos desde medianoche
        const currentDay = now.getDay(); // 0 = domingo, 1 = lunes, etc.
        
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todaySchedule = contactData.hours.schedule[dayNames[currentDay]];
        
        // Si el restaurante está cerrado hoy
        if (!todaySchedule.open) {
            const nextOpening = this.getNextOpeningData();
            return {
                status: 'closedToday',
                translationKey: 'contact.status.closedToday',
                params: {},
                nextOpening
            };
        }

        // 🔥 NUEVO: Obtener horarios específicos del día actual
        const todayHours = this.getDaySpecificHours(dayNames[currentDay]);
        
        if (!todayHours) {
            return {
                status: 'closed',
                translationKey: 'contact.status.closed',
                params: {}
            };
        }

        // Convertir horarios a minutos usando los horarios específicos del día
        const lunchStart = todayHours.lunch ? this.timeToMinutes(todayHours.lunch.start) : null;
        const lunchEnd = todayHours.lunch ? this.timeToMinutes(todayHours.lunch.end) : null;
        const dinnerStart = todayHours.dinner ? this.timeToMinutes(todayHours.dinner.start) : null;
        const dinnerEnd = todayHours.dinner ? this.timeToMinutes(todayHours.dinner.end) : null;

        // Verificar si está abierto
        const isLunchTime = lunchStart && lunchEnd && 
                           currentTime >= lunchStart && currentTime <= lunchEnd && 
                           todaySchedule.lunch;
        const isDinnerTime = dinnerStart && dinnerEnd && 
                            currentTime >= dinnerStart && currentTime <= dinnerEnd && 
                            todaySchedule.dinner;

        if (isLunchTime || isDinnerTime) {
            // Verificar si está cerrando pronto (30 minutos antes del cierre)
            const lunchClosingSoon = isLunchTime && lunchEnd && (lunchEnd - currentTime) <= 30;
            const dinnerClosingSoon = isDinnerTime && dinnerEnd && (dinnerEnd - currentTime) <= 30;
            
            if (lunchClosingSoon || dinnerClosingSoon) {
                const minutesLeft = isLunchTime ? lunchEnd - currentTime : dinnerEnd - currentTime;
                return {
                    status: 'closingSoon',
                    translationKey: 'contact.status.closingSoon',
                    params: { minutes: minutesLeft },
                    minutesLeft
                };
            }
            
            return {
                status: 'open',
                translationKey: 'contact.status.open',
                params: {}
            };
        }

        // Verificar si abre pronto (1 hora antes)
        const openingSoonLunch = lunchStart && todaySchedule.lunch && 
                                currentTime < lunchStart && (lunchStart - currentTime) <= 60;
        const openingSoonDinner = dinnerStart && todaySchedule.dinner && 
                                 lunchEnd && currentTime > lunchEnd && 
                                 currentTime < dinnerStart && (dinnerStart - currentTime) <= 60;

        if (openingSoonLunch) {
            return {
                status: 'openingSoon',
                translationKey: 'contact.status.openingSoon',
                params: { time: todayHours.lunch.start },
                openingTime: todayHours.lunch.start
            };
        }

        if (openingSoonDinner) {
            return {
                status: 'openingSoon',
                translationKey: 'contact.status.openingSoon', 
                params: { time: todayHours.dinner.start },
                openingTime: todayHours.dinner.start
            };
        }

        const nextOpening = this.getNextOpeningData();
        return {
            status: 'closed',
            translationKey: 'contact.status.nextOpening',
            params: { time: nextOpening.translationKey ? undefined : nextOpening.display },
            nextOpening
        };
    }

    /**
     * 🔥 NUEVO: Obtiene los horarios específicos de un día
     * @param {string} day - Día de la semana ('monday', 'tuesday', etc.)
     * @returns {Object|null} - Horarios específicos del día
     */
    static getDaySpecificHours(day) {
        const daySchedule = contactData.hours.schedule[day];
        if (!daySchedule || !daySchedule.open) {
            return null;
        }

        const result = {};

        // Si el día tiene horarios específicos, usarlos
        if (daySchedule.hours) {
            if (daySchedule.hours.lunch && daySchedule.lunch) {
                result.lunch = daySchedule.hours.lunch;
            }
            if (daySchedule.hours.dinner && daySchedule.dinner) {
                result.dinner = daySchedule.hours.dinner;
            }
        } else {
            // Fallback a horarios generales si no hay específicos
            if (daySchedule.lunch) {
                result.lunch = {
                    start: contactData.hours.lunch.start,
                    end: contactData.hours.lunch.end
                };
            }
            if (daySchedule.dinner) {
                result.dinner = {
                    start: contactData.hours.dinner.start,
                    end: contactData.hours.dinner.end
                };
            }
        }

        return Object.keys(result).length > 0 ? result : null;
    }

    /**
     * Convierte tiempo en formato HH:MM a minutos desde medianoche
     * @param {string} time - Tiempo en formato "HH:MM"
     * @returns {number} - Minutos desde medianoche
     */
    static timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * 🔥 ACTUALIZADO: Obtiene datos de la próxima apertura con horarios específicos por día
     * @returns {Object} - Datos estructurados de la próxima apertura
     */
    static getNextOpeningData() {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        // Buscar en los próximos 7 días
        for (let i = 0; i < 7; i++) {
            const checkDay = (currentDay + i) % 7;
            const daySchedule = contactData.hours.schedule[dayNames[checkDay]];
            
            if (!daySchedule.open) continue;
            
            const dayHours = this.getDaySpecificHours(dayNames[checkDay]);
            if (!dayHours) continue;
            
            // Si es hoy, verificar si aún no han pasado los horarios
            if (i === 0) {
                if (dayHours.lunch && daySchedule.lunch) {
                    const lunchStart = this.timeToMinutes(dayHours.lunch.start);
                    if (currentTime < lunchStart) {
                        return {
                            translationKey: 'contact.status.openingToday',
                            params: { time: dayHours.lunch.start },
                            day: checkDay,
                            time: dayHours.lunch.start,
                            type: 'lunch'
                        };
                    }
                }
                if (dayHours.dinner && daySchedule.dinner) {
                    const dinnerStart = this.timeToMinutes(dayHours.dinner.start);
                    const lunchEnd = dayHours.lunch ? this.timeToMinutes(dayHours.lunch.end) : 0;
                    if (currentTime < dinnerStart && (!dayHours.lunch || currentTime > lunchEnd)) {
                        return {
                            translationKey: 'contact.status.openingToday', 
                            params: { time: dayHours.dinner.start },
                            day: checkDay,
                            time: dayHours.dinner.start,
                            type: 'dinner'
                        };
                    }
                }
            } else {
                // Para otros días, tomar el primer horario disponible
                if (dayHours.lunch && daySchedule.lunch) {
                    return {
                        translationKey: 'contact.status.openingOn',
                        params: { 
                            day: `contact.days.${dayNames[checkDay]}`,
                            time: dayHours.lunch.start 
                        },
                        day: checkDay,
                        time: dayHours.lunch.start,
                        type: 'lunch'
                    };
                }
                if (dayHours.dinner && daySchedule.dinner) {
                    return {
                        translationKey: 'contact.status.openingOn',
                        params: { 
                            day: `contact.days.${dayNames[checkDay]}`,
                            time: dayHours.dinner.start 
                        },
                        day: checkDay,
                        time: dayHours.dinner.start,
                        type: 'dinner'
                    };
                }
            }
        }
        
        return {
            translationKey: 'contact.status.checkSchedule',
            params: {},
            day: null,
            time: null,
            type: null
        };
    }

    /**
     * Obtiene la dirección completa formateada
     * @returns {string} - Dirección completa
     */
    static getFullAddress() {
        const addr = contactData.contact.address;
        return `${addr.street}, ${addr.postalCode} ${addr.city}, ${addr.province}`;
    }

    /**
     * Obtiene las redes sociales habilitadas
     * @returns {Array} - Array de redes sociales activas
     */
    static getEnabledSocials() {
        return Object.entries(contactData.social)
            .filter(([_, social]) => social.enabled)
            .map(([key, social]) => ({ key, ...social }));
    }

    /**
     * Genera los enlaces de acción (llamar, email, maps, etc.)
     * @returns {Object} - Enlaces de acción
     */
    static getActionLinks() {
        const addr = contactData.contact.address;
        const fullAddress = this.getFullAddress();
        
        return {
            call: `tel:${contactData.contact.phone.main}`,
            email: `mailto:${contactData.contact.email.main}`,
            whatsapp: contactData.social.whatsapp.enabled ? contactData.social.whatsapp.url : null,
            maps: `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`,
            directions: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`
        };
    }

    /**
     * Verifica si el restaurante está abierto en un día específico
     * @param {number} dayOfWeek - Día de la semana (0 = domingo)
     * @returns {boolean} - True si está abierto
     */
    static isOpenOnDay(dayOfWeek) {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const daySchedule = contactData.hours.schedule[dayNames[dayOfWeek]];
        return daySchedule && daySchedule.open;
    }

    /**
     * 🔥 ACTUALIZADO: Obtiene los horarios de un día específico con horarios por día
     * @param {number} dayOfWeek - Día de la semana (0 = domingo)
     * @returns {Object|null} - Horarios del día o null si está cerrado
     */
    static getDaySchedule(dayOfWeek) {
        if (!this.isOpenOnDay(dayOfWeek)) return null;
        
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeek];
        const daySchedule = contactData.hours.schedule[dayName];
        const dayHours = this.getDaySpecificHours(dayName);
        
        if (!dayHours) return null;
        
        const schedule = [];
        
        if (dayHours.lunch && daySchedule.lunch) {
            schedule.push({
                type: 'lunch',
                start: dayHours.lunch.start,
                end: dayHours.lunch.end
            });
        }
        
        if (dayHours.dinner && daySchedule.dinner) {
            schedule.push({
                type: 'dinner', 
                start: dayHours.dinner.start,
                end: dayHours.dinner.end
            });
        }
        
        return schedule;
    }

    /**
     * 🔥 NUEVO: Obtiene horarios formateados para mostrar en UI
     * @returns {Array} - Array con horarios por día formateados
     */
    static getWeekSchedule() {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        return dayNames.map((dayName, index) => {
            const daySchedule = contactData.hours.schedule[dayName];
            const dayHours = this.getDaySpecificHours(dayName);
            
            return {
                dayName,
                dayIndex: index,
                isOpen: daySchedule.open,
                schedule: dayHours,
                formattedSchedule: this.formatDaySchedule(dayHours, daySchedule)
            };
        });
    }

    /**
     * 🔥 NUEVO: Formatea los horarios de un día para mostrar
     * @param {Object} dayHours - Horarios del día
     * @param {Object} daySchedule - Configuración del día
     * @returns {string} - Horarios formateados
     */
    static formatDaySchedule(dayHours, daySchedule) {
        if (!dayHours || !daySchedule.open) {
            return 'Cerrado';
        }

        const parts = [];
        
        if (dayHours.lunch && daySchedule.lunch) {
            parts.push(`${dayHours.lunch.start} - ${dayHours.lunch.end}`);
        }
        
        if (dayHours.dinner && daySchedule.dinner) {
            parts.push(`${dayHours.dinner.start} - ${dayHours.dinner.end}`);
        }
        
        return parts.join(' | ') || 'Cerrado';
    }

    /**
     * Obtiene información de ubicación para JSON-LD
     * @returns {Object} - Datos de ubicación estructurados
     */
    static getLocationData() {
        const addr = contactData.contact.address;
        
        return {
            "@type": "PostalAddress",
            "streetAddress": addr.street,
            "addressLocality": addr.city,
            "addressRegion": addr.province,
            "postalCode": addr.postalCode,
            "addressCountry": addr.country
        };
    }

    /**
     * 🔥 ACTUALIZADO: Genera especificación de horarios para JSON-LD con horarios específicos
     * @returns {Array} - Array de especificaciones de horarios
     */
    static getOpeningHoursSpecification() {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayNameMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const openingHours = [];
        
        dayNames.forEach((day, index) => {
            const schedule = contactData.hours.schedule[day];
            if (!schedule.open) return;
            
            const dayHours = this.getDaySpecificHours(day);
            if (!dayHours) return;
            
            const dayName = dayNameMap[index];
            
            if (dayHours.lunch && schedule.lunch) {
                openingHours.push({
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": dayName,
                    "opens": dayHours.lunch.start,
                    "closes": dayHours.lunch.end
                });
            }
            
            if (dayHours.dinner && schedule.dinner) {
                openingHours.push({
                    "@type": "OpeningHoursSpecification", 
                    "dayOfWeek": dayName,
                    "opens": dayHours.dinner.start,
                    "closes": dayHours.dinner.end
                });
            }
        });
        
        return openingHours;
    }

    /**
     * Obtiene información completa para JSON-LD de restaurante
     * @returns {Object} - Datos estructurados del restaurante
     */
    static getStructuredData() {
        const status = this.getRestaurantStatus();
        const location = this.getLocationData();
        const socials = this.getEnabledSocials();
        
        return {
            "@context": "https://schema.org",
            "@type": "Restaurant",
            "name": contactData.restaurant.name,
            "address": location,
            "telephone": contactData.contact.phone.main,
            "email": contactData.contact.email.main,
            "url": contactData.contact.website,
            "openingHours": this.getOpeningHoursSpecification(),
            "sameAs": socials.map(social => social.url),
            "servesCuisine": "Mediterranean",
            "acceptsReservations": true,
            "priceRange": "$$"
        };
    }

    /**
     * Función helper para usar en Astro con traducciones
     * @param {Object} i18nInstance - Instancia de i18n
     * @param {string} locale - Idioma actual
     * @returns {Object} - Datos de contacto con traducciones
     */
    static getContactDataWithTranslations(i18nInstance, locale) {
        const statusData = this.getRestaurantStatus();
        const socials = this.getEnabledSocials();
        const actionLinks = this.getActionLinks();
        const weekSchedule = this.getWeekSchedule();
        
        // Obtener mensaje traducido usando el sistema i18n
        let translatedMessage = i18nInstance.getTranslation(
            statusData.translationKey, 
            locale, 
            statusData.translationKey, // fallback a la clave si no hay traducción
            statusData.params
        );

        // Si hay información de próxima apertura, también traducirla
        let nextOpeningMessage = null;
        if (statusData.nextOpening && statusData.nextOpening.translationKey) {
            nextOpeningMessage = i18nInstance.getTranslation(
                statusData.nextOpening.translationKey,
                locale,
                statusData.nextOpening.translationKey,
                statusData.nextOpening.params
            );
        }
        
        return {
            restaurant: contactData.restaurant,
            contact: contactData.contact,
            hours: contactData.hours,
            weekSchedule, // 🔥 NUEVO: Horarios de la semana
            status: {
                ...statusData,
                translatedMessage,
                nextOpeningMessage
            },
            socials,
            actionLinks,
            fullAddress: this.getFullAddress(),
            config: contactData.config
        };
    }
}

// El resto de las clases se mantienen igual...
export class ContactStatusManager {
    constructor() {
        this.statusUpdateInterval = null;
        this.callbacks = [];
    }

    startMonitoring(intervalMs = 60000) {
        this.updateStatus();
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

    updateStatus() {
        const newStatus = ContactService.getRestaurantStatus();
        
        this.callbacks.forEach(callback => {
            try {
                callback(newStatus);
            } catch (error) {
                console.error('Error in status callback:', error);
            }
        });
    }

    updateStatusElements(statusData, translateFn = null) {
        const statusElement = document.getElementById('restaurantStatus');
        const statusText = document.getElementById('statusText');
        
        if (statusElement) {
            statusElement.className = `status status-${statusData.status}`;
        }
        
        if (statusText && translateFn) {
            const translatedText = translateFn(statusData.translationKey, statusData.params);
            statusText.textContent = translatedText;
        } else if (statusText && statusData.translatedMessage) {
            statusText.textContent = statusData.translatedMessage;
        }
    }
}

export default ContactService;