// src/services/ContactService.js

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

        // Convertir horarios a minutos
        const lunchStart = this.timeToMinutes(contactData.hours.lunch.start);
        const lunchEnd = this.timeToMinutes(contactData.hours.lunch.end);
        const dinnerStart = this.timeToMinutes(contactData.hours.dinner.start);
        const dinnerEnd = this.timeToMinutes(contactData.hours.dinner.end);

        // Verificar si está abierto
        const isLunchTime = currentTime >= lunchStart && currentTime <= lunchEnd && todaySchedule.lunch;
        const isDinnerTime = currentTime >= dinnerStart && currentTime <= dinnerEnd && todaySchedule.dinner;

        if (isLunchTime || isDinnerTime) {
            // Verificar si está cerrando pronto (30 minutos antes del cierre)
            const lunchClosingSoon = isLunchTime && (lunchEnd - currentTime) <= 30;
            const dinnerClosingSoon = isDinnerTime && (dinnerEnd - currentTime) <= 30;
            
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
        const openingSoonLunch = todaySchedule.lunch && currentTime < lunchStart && (lunchStart - currentTime) <= 60;
        const openingSoonDinner = todaySchedule.dinner && currentTime > lunchEnd && currentTime < dinnerStart && (dinnerStart - currentTime) <= 60;

        if (openingSoonLunch) {
            return {
                status: 'openingSoon',
                translationKey: 'contact.status.openingSoon',
                params: { time: contactData.hours.lunch.start },
                openingTime: contactData.hours.lunch.start
            };
        }

        if (openingSoonDinner) {
            return {
                status: 'openingSoon',
                translationKey: 'contact.status.openingSoon', 
                params: { time: contactData.hours.dinner.start },
                openingTime: contactData.hours.dinner.start
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
     * Convierte tiempo en formato HH:MM a minutos desde medianoche
     * @param {string} time - Tiempo en formato "HH:MM"
     * @returns {number} - Minutos desde medianoche
     */
    static timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Obtiene datos de la próxima apertura del restaurante
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
            
            const lunchStart = this.timeToMinutes(contactData.hours.lunch.start);
            const dinnerStart = this.timeToMinutes(contactData.hours.dinner.start);
            
            // Si es hoy, verificar si aún no han pasado los horarios
            if (i === 0) {
                if (daySchedule.lunch && currentTime < lunchStart) {
                    return {
                        translationKey: 'contact.status.openingToday',
                        params: { time: contactData.hours.lunch.start },
                        day: checkDay,
                        time: contactData.hours.lunch.start,
                        type: 'lunch'
                    };
                }
                if (daySchedule.dinner && currentTime < dinnerStart) {
                    return {
                        translationKey: 'contact.status.openingToday', 
                        params: { time: contactData.hours.dinner.start },
                        day: checkDay,
                        time: contactData.hours.dinner.start,
                        type: 'dinner'
                    };
                }
            } else {
                // Para otros días, tomar el primer horario disponible
                if (daySchedule.lunch) {
                    return {
                        translationKey: 'contact.status.openingOn',
                        params: { 
                            day: `contact.days.${dayNames[checkDay]}`,
                            time: contactData.hours.lunch.start 
                        },
                        day: checkDay,
                        time: contactData.hours.lunch.start,
                        type: 'lunch'
                    };
                }
                if (daySchedule.dinner) {
                    return {
                        translationKey: 'contact.status.openingOn',
                        params: { 
                            day: `contact.days.${dayNames[checkDay]}`,
                            time: contactData.hours.dinner.start 
                        },
                        day: checkDay,
                        time: contactData.hours.dinner.start,
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
     * Obtiene los horarios de un día específico
     * @param {number} dayOfWeek - Día de la semana (0 = domingo)
     * @returns {Object|null} - Horarios del día o null si está cerrado
     */
    static getDaySchedule(dayOfWeek) {
        if (!this.isOpenOnDay(dayOfWeek)) return null;
        
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const daySchedule = contactData.hours.schedule[dayNames[dayOfWeek]];
        
        const schedule = [];
        
        if (daySchedule.lunch) {
            schedule.push({
                type: 'lunch',
                start: contactData.hours.lunch.start,
                end: contactData.hours.lunch.end
            });
        }
        
        if (daySchedule.dinner) {
            schedule.push({
                type: 'dinner', 
                start: contactData.hours.dinner.start,
                end: contactData.hours.dinner.end
            });
        }
        
        return schedule;
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
     * Genera especificación de horarios para JSON-LD
     * @returns {Array} - Array de especificaciones de horarios
     */
    static getOpeningHoursSpecification() {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const openingHours = [];
        
        dayNames.forEach((day, index) => {
            const schedule = contactData.hours.schedule[day];
            if (!schedule.open) return;
            
            const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index];
            
            if (schedule.lunch) {
                openingHours.push({
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": dayName,
                    "opens": contactData.hours.lunch.start,
                    "closes": contactData.hours.lunch.end
                });
            }
            
            if (schedule.dinner) {
                openingHours.push({
                    "@type": "OpeningHoursSpecification", 
                    "dayOfWeek": dayName,
                    "opens": contactData.hours.dinner.start,
                    "closes": contactData.hours.dinner.end
                });
            }
        });
        
        return openingHours;
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

/**
 * Hook para usar en el frontend (cliente)
 */
export class ContactStatusManager {
    constructor() {
        this.statusUpdateInterval = null;
        this.callbacks = [];
    }

    /**
     * Inicia el monitoreo de estado en tiempo real
     * @param {number} intervalMs - Intervalo en milisegundos (default: 60000)
     */
    startMonitoring(intervalMs = 60000) {
        this.updateStatus();
        this.statusUpdateInterval = setInterval(() => {
            this.updateStatus();
        }, intervalMs);
    }

    /**
     * Detiene el monitoreo
     */
    stopMonitoring() {
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
            this.statusUpdateInterval = null;
        }
    }

    /**
     * Añade un callback para cuando cambie el estado
     * @param {Function} callback - Función a ejecutar cuando cambie el estado
     */
    onStatusChange(callback) {
        this.callbacks.push(callback);
    }

    /**
     * Actualiza el estado y notifica a los callbacks
     */
    updateStatus() {
        const newStatus = ContactService.getRestaurantStatus();
        
        // Notificar a todos los callbacks
        this.callbacks.forEach(callback => {
            try {
                callback(newStatus);
            } catch (error) {
                console.error('Error in status callback:', error);
            }
        });
    }

    /**
     * Actualiza los elementos DOM con el nuevo estado
     * @param {Object} statusData - Datos del estado del restaurante
     * @param {Function} translateFn - Función de traducción
     */
    updateStatusElements(statusData, translateFn = null) {
        const statusElement = document.getElementById('restaurantStatus');
        const statusText = document.getElementById('statusText');
        
        if (statusElement) {
            statusElement.className = `status status-${statusData.status}`;
        }
        
        if (statusText && translateFn) {
            // Usar función de traducción si está disponible
            const translatedText = translateFn(statusData.translationKey, statusData.params);
            statusText.textContent = translatedText;
        } else if (statusText && statusData.translatedMessage) {
            // Usar mensaje ya traducido si está disponible
            statusText.textContent = statusData.translatedMessage;
        }
    }
}

export default ContactService;