import contactData from '../data/contact-data.json';
import i18nCore from '../i18n/core.js';

 const DAY_TRANSLATIONS = {
    'sunday': 'Domingo',
    'monday': 'Lunes', 
    'tuesday': 'Martes',
    'wednesday': 'Miércoles',
    'thursday': 'Jueves',
    'friday': 'Viernes',
    'saturday': 'Sábado'
};

const DAY_NAMES = Object.keys(DAY_TRANSLATIONS);

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
     * @returns {Object} - Estado con status separado del mensaje
     */
    static getRestaurantStatus() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes(); // minutos desde medianoche
        const currentDay = now.getDay(); // 0 = domingo, 1 = lunes, etc.
        
        const todaySchedule = contactData.hours.schedule[DAY_NAMES[currentDay]];
        
        // Si el restaurante está cerrado hoy
        if (!todaySchedule || !todaySchedule.open || !todaySchedule.ranges || todaySchedule.ranges.length === 0) {
            const nextOpening = this.getNextOpeningData();
            return {
                status: 'closed',
                statusKey: 'contact.status.states.closed',
                messageKey: nextOpening.messageKey || null,
                messageParams: nextOpening.messageParams || {},
                nextOpening
            };
        }

        // Verificar si está abierto en alguno de los rangos
        let isCurrentlyOpen = false;
        let closingSoonRange = null;
        let minutesUntilClose = null;
        let currentRange = null;

        for (const range of todaySchedule.ranges) {
            const rangeStart = this.timeToMinutes(range.start);
            const rangeEnd = this.timeToMinutes(range.end);
            
            if (currentTime >= rangeStart && currentTime <= rangeEnd) {
                isCurrentlyOpen = true;
                currentRange = range;
                
                // Verificar si está cerrando pronto (30 minutos antes del cierre)
                const minutesLeft = rangeEnd - currentTime;
                if (minutesLeft <= 30) {
                    closingSoonRange = range;
                    minutesUntilClose = minutesLeft;
                }
                break;
            }
        }

        if (isCurrentlyOpen) {
            if (closingSoonRange) {
                return {
                    status: 'closingSoon',
                    statusKey: 'contact.status.states.open',
                    messageKey: 'contact.status.messages.closingIn',
                    messageParams: { minutes: minutesUntilClose },
                    minutesLeft: minutesUntilClose,
                    currentRange: closingSoonRange
                };
            }
            
            return {
                status: 'open',
                statusKey: 'contact.status.states.open',
                messageKey: 'contact.status.messages.until',
                messageParams: { time: currentRange?.end || '' },
                openUntil: currentRange?.end,
                currentRange
            };
        }

        // Verificar si abre pronto (1 hora antes de cualquier rango)
        for (const range of todaySchedule.ranges) {
            const rangeStart = this.timeToMinutes(range.start);
            
            if (currentTime < rangeStart && (rangeStart - currentTime) <= 60) {
                return {
                    status: 'openingSoon',
                    statusKey: 'contact.status.states.closed',
                    messageKey: 'contact.status.messages.openingAt',
                    messageParams: { time: range.start },
                    openingTime: range.start,
                    nextRange: range
                };
            }
        }

        // Cerrado - obtener próxima apertura
        const nextOpening = this.getNextOpeningData();
        
        return {
            status: 'closed',
            statusKey: 'contact.status.states.closed',
            messageKey: nextOpening.messageKey || null,
            messageParams: nextOpening.messageParams || {},
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
     * Convierte minutos desde medianoche a formato HH:MM
     * @param {number} minutes - Minutos desde medianoche
     * @returns {string} - Tiempo en formato "HH:MM"
     */
    static minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    /**
     * Obtiene datos de la próxima apertura con sistema separado
     * @returns {Object} - Datos estructurados con messageKey separado
     */
    static getNextOpeningData() {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        // Buscar en los próximos 7 días
        for (let i = 0; i < 7; i++) {
            const checkDay = (currentDay + i) % 7;
            const daySchedule = contactData.hours.schedule[DAY_NAMES[checkDay]];
            
            if (!daySchedule || !daySchedule.open || !daySchedule.ranges || daySchedule.ranges.length === 0) {
                continue;
            }
            
            // Si es hoy, verificar si aún no han pasado los horarios
            if (i === 0) {
                for (const range of daySchedule.ranges) {
                    const rangeStart = this.timeToMinutes(range.start);
                    if (currentTime < rangeStart) {
                        return {
                            messageKey: 'contact.status.messages.openingToday',
                            messageParams: { time: range.start },
                            day: checkDay,
                            time: range.start,
                            range: range
                        };
                    }
                }
            } else {
                // Para otros días, tomar el primer rango disponible
                if (daySchedule.ranges.length > 0) {
                    const firstRange = daySchedule.ranges[0];
                    return {
                        messageKey: 'contact.status.messages.openingOn',
                        messageParams: { 
                            day: `contact.days.${DAY_NAMES[checkDay]}`,
                            time: firstRange.start 
                        },
                        day: checkDay,
                        time: firstRange.start,
                        range: firstRange
                    };
                }
            }
        }
        
        // No hay próxima apertura encontrada
        return {
            messageKey: null,
            messageParams: {},
            day: null,
            time: null,
            range: null
        };
    }

    /**
     * Agrupa días con horarios idénticos para mostrar de forma compacta
     * @returns {Array} - Array de grupos con días y horarios
     */
    static getGroupedSchedule(locale) {
        // Crear mapa de horarios únicos
        const scheduleGroups = new Map();
        
        DAY_NAMES.forEach((dayName, index) => {
            const daySchedule = contactData.hours.schedule[dayName];
            
            // Crear clave única para este horario
            let scheduleKey;
            if (!daySchedule || !daySchedule.open || !daySchedule.ranges || daySchedule.ranges.length === 0) {
                scheduleKey = 'CLOSED';
            } else {
                // Crear clave basada en los rangos (ordenados)
                const sortedRanges = [...daySchedule.ranges].sort((a, b) => 
                    this.timeToMinutes(a.start) - this.timeToMinutes(b.start)
                );
                scheduleKey = sortedRanges.map(range => 
                    `${range.nameKey || range.name || 'Sin nombre'}:${range.start}-${range.end}`
                ).join('|');
            }
            
            // Añadir día al grupo correspondiente
            if (!scheduleGroups.has(scheduleKey)) {
                scheduleGroups.set(scheduleKey, {
                    days: [],
                    dayIndexes: [],
                    ranges: daySchedule && daySchedule.open ? daySchedule.ranges || [] : [],
                    closed: !daySchedule || !daySchedule.open || !daySchedule.ranges || daySchedule.ranges.length === 0
                });
            }

            scheduleGroups.get(scheduleKey).days.push(i18nCore.getTranslation(`contact.days.${dayName}`, locale) || DAY_TRANSLATIONS[dayName]);
            scheduleGroups.get(scheduleKey).dayIndexes.push(index);
        });
        
        // Convertir a array y formatear nombres de días
        const result = Array.from(scheduleGroups.values()).map(group => ({
            ...group,
            daysDisplay: this.formatDaysRange(group.days, group.dayIndexes, locale),
            firstDayIndex: Math.min(...group.dayIndexes) // Para ordenar por primer día de la semana
        }));
        
        // Ordenar grupos por día de la semana (lunes=1, martes=2, etc.)
        // Convertir domingo (0) a 7 para que aparezca al final
        return result.sort((a, b) => {
            const firstDayA = a.firstDayIndex === 0 ? 7 : a.firstDayIndex;
            const firstDayB = b.firstDayIndex === 0 ? 7 : b.firstDayIndex;
            return firstDayA - firstDayB;
        });
    }

    /**
     * Obtiene horarios agrupados con traducciones aplicadas
     * @param {Object} i18nInstance - Instancia de i18n
     * @param {string} locale - Idioma actual
     * @returns {Array} - Horarios agrupados traducidos
     */
    static getGroupedScheduleWithTranslations(i18nInstance, locale) {
        const groupedSchedule = this.getGroupedSchedule(locale);
        
        return groupedSchedule.map(group => ({
            ...group,
            ranges: group.ranges.map(range => ({
                ...range,
                translatedName: range.nameKey 
                    ? i18nInstance.getTranslation(range.nameKey, locale, range.name || 'Sin nombre')
                    : (range.name || 'Sin nombre')
            }))
        }));
    }

    /**
     * Formatea rangos de días para mostrar de forma compacta
     * @param {Array} days - Array de nombres de días
     * @param {Array} dayIndexes - Array de índices de días (0=domingo)
     * @returns {string} - Rango formateado (ej: "Lunes - Viernes", "Lunes, Miércoles")
     */
    static formatDaysRange(days, dayIndexes, locale) {
        if (days.length === 0) return '';
        if (days.length === 1) return days[0];
        
        // Ordenar por día de la semana (lunes primero)
        // Convertir domingo (0) a 7 para que aparezca al final
        const sortedPairs = days.map((day, i) => ({ 
            day, 
            index: dayIndexes[i] === 0 ? 7 : dayIndexes[i] // domingo al final
        })).sort((a, b) => a.index - b.index);
        
        const sortedDays = sortedPairs.map(pair => pair.day);
        const sortedIndexes = sortedPairs.map(pair => pair.index);
        
        // Verificar si es un rango continuo
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
        
        // Si no es continuo o son pocos días, mostrar lista
        if (sortedDays.length === 2) {
            return sortedDays.join(` ${i18nCore.getTranslation('contact.status.and', locale) || 'y'} `);
        }
        
        return sortedDays.slice(0, -1).join(', ') + ` ${i18nCore.getTranslation('contact.status.and', locale) || 'y'} ` + sortedDays[sortedDays.length - 1];
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
            whatsapp: contactData.social.whatsapp?.enabled ? contactData.social.whatsapp.url : null,
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
        const daySchedule = contactData.hours.schedule[DAY_NAMES[dayOfWeek]];
        return daySchedule && daySchedule.open && daySchedule.ranges && daySchedule.ranges.length > 0;
    }

    /**
     * Obtiene los rangos de horarios de un día específico
     * @param {number} dayOfWeek - Día de la semana (0 = domingo)
     * @returns {Array|null} - Array de rangos o null si está cerrado
     */
    static getDaySchedule(dayOfWeek) {
        if (!this.isOpenOnDay(dayOfWeek)) return null;
        
        const dayName = DAY_NAMES[dayOfWeek];
        const daySchedule = contactData.hours.schedule[dayName];
        
        return daySchedule.ranges || [];
    }

    /**
     * Obtiene horarios formateados para mostrar en UI (versión detallada)
     * @returns {Array} - Array con horarios por día formateados
     */
    static getWeekSchedule(locale) {
        return DAY_NAMES.map((dayName, index) => {
            const daySchedule = contactData.hours.schedule[dayName];
            
            return {
                dayName: i18nCore.getTranslation(`contact.days.${dayName}`, locale) || DAY_TRANSLATIONS[dayName],
                dayKey: `contact.days.${dayName}`,
                dayIndex: index,
                isOpen: daySchedule && daySchedule.open && daySchedule.ranges && daySchedule.ranges.length > 0,
                ranges: daySchedule?.ranges || [],
                formattedSchedule: this.formatDaySchedule(daySchedule)
            };
        });
    }

    /**
     * Formatea los horarios de un día para mostrar
     * @param {Object} daySchedule - Horario del día
     * @returns {string} - Horarios formateados
     */
    static formatDaySchedule(daySchedule) {
        if (!daySchedule || !daySchedule.open || !daySchedule.ranges || daySchedule.ranges.length === 0) {
            return 'Cerrado';
        }

        return daySchedule.ranges
            .map(range => {
                const timeRange = `${range.start} - ${range.end}`;
                const name = range.nameKey || range.name;
                return name ? `${name}: ${timeRange}` : timeRange;
            })
            .join(' | ') || 'Cerrado';
    }

    /**
     * Verifica si un día tiene un rango específico activo
     * @param {number} dayOfWeek - Día de la semana
     * @param {string} rangeName - Nombre del rango a verificar
     * @returns {Object|null} - Rango encontrado o null
     */
    static getDayRange(dayOfWeek, rangeName) {
        const schedule = this.getDaySchedule(dayOfWeek);
        if (!schedule) return null;
        
        return schedule.find(range => 
            (range.nameKey && range.nameKey.toLowerCase() === rangeName.toLowerCase()) ||
            (range.name && range.name.toLowerCase() === rangeName.toLowerCase())
        ) || null;
    }

    /**
     * Obtiene todos los rangos únicos utilizados en la semana
     * @returns {Array} - Array de nombres de rangos únicos
     */
    static getUniqueRangeNames() {
        const rangeNames = new Set();
        
        DAY_NAMES.forEach(dayName => {
            const daySchedule = contactData.hours.schedule[dayName];
            if (daySchedule && daySchedule.ranges) {
                daySchedule.ranges.forEach(range => {
                    if (range.nameKey) {
                        rangeNames.add(range.nameKey);
                    } else if (range.name) {
                        rangeNames.add(range.name);
                    }
                });
            }
        });
        
        return Array.from(rangeNames);
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
     * Genera especificación de horarios para JSON-LD con sistema de rangos
     * @returns {Array} - Array de especificaciones de horarios
     */
    static getOpeningHoursSpecification() {
        const openingHours = [];
        
        DAY_NAMES.forEach((dayName) => {
            const schedule = contactData.hours.schedule[day];
            if (!schedule || !schedule.open || !schedule.ranges) return;
            
            schedule.ranges.forEach(range => {
                openingHours.push({
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": i18nCore.getTranslation(`contact.days.${dayName}`, locale) || DAY_TRANSLATIONS[dayName],
                    "opens": range.start,
                    "closes": range.end,
                    "name": range.nameKey || range.name || undefined
                });
            });
        });
        
        return openingHours;
    }

    /**
     * Obtiene información completa para JSON-LD de restaurante
     * @returns {Object} - Datos estructurados del restaurante
     */
    static getStructuredData(locale) {
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
            "openingHours": this.getOpeningHoursSpecification(locale),
            "sameAs": socials.map(social => social.url),
            "servesCuisine": "Mediterranean",
            "acceptsReservations": true,
            "priceRange": "$$"
        };
    }

    /**
     * 🔥 FUNCIÓN PRINCIPAL: Helper para usar en Astro con traducciones
     * Sistema separado: statusKey + messageKey = fullMessage
     * @param {Object} i18nInstance - Instancia de i18n
     * @param {string} locale - Idioma actual
     * @returns {Object} - Datos de contacto con traducciones
     */
    static getContactDataWithTranslations(i18nInstance, locale) {
        const statusData = this.getRestaurantStatus();
        const socials = this.getEnabledSocials();
        const actionLinks = this.getActionLinks();
        const weekSchedule = this.getWeekSchedule(locale);
        const groupedSchedule = this.getGroupedScheduleWithTranslations(i18nInstance, locale);
        
        // 🔥 NUEVO SISTEMA: Status y mensaje separados
        let statusText = 'No Disponible';
        let messageText = '';
        let fullMessage = 'No Disponible';
        
        try {
            // Obtener texto del status
            statusText = i18nInstance.getTranslation(statusData.statusKey, locale, 'No Disponible');
            
            // Obtener mensaje adicional si existe
            if (statusData.messageKey) {
                let processedParams = { ...statusData.messageParams };
                
                // Traducir parámetros que son claves (como días)
                if (processedParams.day && processedParams.day.startsWith('contact.days.')) {
                    processedParams.day = i18nInstance.getTranslation(processedParams.day, locale, processedParams.day);
                }
                
                messageText = i18nInstance.getTranslation(statusData.messageKey, locale, processedParams);
                
                // Combinar status + mensaje
                fullMessage = messageText !== statusData.messageKey ? `${statusText}: ${messageText}` : statusText;
            } else {
                // Solo status, sin mensaje adicional
                fullMessage = statusText;
            }
            
        } catch (error) {
            console.error('Error translating status:', error);
            fullMessage = 'No Disponible';
        }
        
        return {
            restaurant: contactData.restaurant,
            contact: contactData.contact,
            hours: contactData.hours,
            weekSchedule,
            groupedSchedule,
            status: {
                ...statusData,
                statusText,      // "Abierto", "Cerrado", etc.
                messageText,     // "Hasta las 23:30", "Abre el Lunes...", etc.
                fullMessage      // "Abierto: Hasta las 23:30"
            },
            socials,
            actionLinks,
            fullAddress: this.getFullAddress(),
            config: contactData.config
        };
    }
}

// === CLASES AUXILIARES ===

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
        
        if (statusText && statusData.fullMessage) {
            statusText.textContent = statusData.fullMessage;
        }
    }
}

export default ContactService;