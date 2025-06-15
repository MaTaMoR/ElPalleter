// src/utils/contactUtils.js

import ContactService from '../services/ContactService.js';
import { i18nCore } from '../i18n/core.js';

/**
 * Funciones helper para usar el componente de contacto
 */

/**
 * Obtiene datos de contacto listos para usar en componentes Astro
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Object} - Datos de contacto con traducciones
 */
export function getContactDataForAstro(Astro) {
    const { locale } = i18nCore.getI18nInfo(Astro);
    return ContactService.getContactDataWithTranslations(i18nCore, locale);
}

/**
 * Genera URL de Google Maps para la dirección del restaurante
 * @param {string} type - Tipo de enlace ('view' o 'directions')
 * @returns {string} - URL de Google Maps
 */
export function getGoogleMapsUrl(type = 'view') {
    const fullAddress = ContactService.getFullAddress();
    const encodedAddress = encodeURIComponent(fullAddress);
    
    if (type === 'directions') {
        return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    }
    
    return `https://maps.google.com/?q=${encodedAddress}`;
}

/**
 * Valida y formatea número de teléfono para enlaces tel:
 * @param {string} phone - Número de teléfono
 * @returns {string} - Número formateado para tel:
 */
export function formatPhoneForTel(phone) {
    // Remover espacios y caracteres especiales excepto +
    return phone.replace(/[^\d+]/g, '');
}

/**
 * Genera mensaje predefinido para WhatsApp
 * @param {string} locale - Idioma actual
 * @returns {string} - URL de WhatsApp con mensaje
 */
export function getWhatsAppUrl(locale = 'es') {
    // Usar claves de traducción en lugar de textos hardcodeados
    const messageKey = 'contact.whatsapp.defaultMessage';
    
    // Como fallback, usar mensajes simples si la clave no existe
    const fallbackMessages = {
        es: '¡Hola! Me gustaría hacer una reserva en El Palleter.',
        en: 'Hello! I would like to make a reservation at El Palleter.',
        val: 'Hola! M\'agradaria fer una reserva en El Palleter.'
    };
    
    // Intentar obtener traducción, si no existe usar fallback
    let message = i18nCore.getTranslation(messageKey, locale);
    if (message === messageKey) {
        message = fallbackMessages[locale] || fallbackMessages.es;
    }
    
    const encodedMessage = encodeURIComponent(message);
    const phone = formatPhoneForTel(ContactService.getContactData().contact.phone.main);
    
    return `https://wa.me/${phone.replace('+', '')}?text=${encodedMessage}`;
}

/**
 * Obtiene horarios formateados para mostrar
 * @param {string} locale - Idioma actual
 * @returns {Object} - Horarios formateados
 */
export function getFormattedSchedule(locale = 'es') {
    const contactData = ContactService.getContactData();
    const schedule = contactData.hours.schedule;
    
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    return dayKeys.map((key, index) => {
        // Usar traducciones en lugar de arrays hardcodeados
        const dayNameKey = `contact.days.${key}`;
        const dayName = i18nCore.getTranslation(dayNameKey, locale, key);
        
        return {
            day: dayName,
            schedule: schedule[key],
            isOpen: schedule[key].open,
            lunch: schedule[key].lunch ? `${contactData.hours.lunch.start} - ${contactData.hours.lunch.end}` : null,
            dinner: schedule[key].dinner ? `${contactData.hours.dinner.start} - ${contactData.hours.dinner.end}` : null
        };
    });
}

/**
 * Verifica si el restaurante está abierto y retorna información amigable
 * @param {string} locale - Idioma actual
 * @returns {Object} - Estado con mensaje traducido
 */
export function getRestaurantStatusWithTranslation(locale = 'es') {
    const statusData = ContactService.getRestaurantStatus();
    
    // Obtener mensaje traducido usando el sistema i18n con parámetros
    const translatedMessage = i18nCore.getTranslation(
        statusData.translationKey,
        locale,
        statusData.translationKey, // fallback a la clave
        statusData.params
    );
    
    return {
        ...statusData,
        translatedMessage
    };
}

/**
 * Genera datos estructurados JSON-LD para el restaurante
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {string} - JSON-LD como string
 */
export function getRestaurantJsonLD(Astro) {
    const structuredData = ContactService.getStructuredData();
    const { locale } = i18nCore.getI18nInfo(Astro);
    
    // Añadir URL actual
    const currentUrl = i18nCore.getAbsoluteUrl('/', locale, Astro);
    structuredData.url = currentUrl;
    
    return JSON.stringify(structuredData, null, 2);
}

/**
 * Genera metadatos Open Graph para la página de contacto
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Object} - Metadatos Open Graph
 */
export function getContactOpenGraph(Astro) {
    const { locale } = i18nCore.getI18nInfo(Astro);
    const contactData = ContactService.getContactData();
    
    const title = i18nCore.getTranslation('contact.sections.contact', locale, 'Contacto') + ' | ' + contactData.restaurant.name;
    const description = i18nCore.getTranslation('contact.values.followUs', locale, 'Mantente al día con nuestras novedades');
    const url = i18nCore.getAbsoluteUrl('/contacto', locale, Astro);
    
    return {
        title,
        description,
        url,
        type: 'website',
        locale,
        site_name: contactData.restaurant.name
    };
}

/**
 * Obtiene configuración de colores y estilos del tema
 * @returns {Object} - Configuración de tema
 */
export function getContactThemeConfig() {
    return {
        colors: {
            primary: '#D4A574',
            accent: '#FF4500',
            background: '#2a2a2a',
            surface: '#333',
            text: '#ffffff',
            textSecondary: '#cccccc'
        },
        breakpoints: {
            mobile: '767px',
            tablet: '1023px',
            desktop: '1399px'
        },
        animations: {
            duration: '0.3s',
            easing: 'ease',
            hoverTransform: 'translateY(-2px)'
        }
    };
}

/**
 * Función para personalizar la configuración de contacto
 * @param {Object} customConfig - Configuración personalizada
 * @returns {Object} - Configuración combinada
 */
export function createContactConfig(customConfig = {}) {
    const defaultConfig = ContactService.getContactData().config;
    
    return {
        ...defaultConfig,
        ...customConfig,
        responsiveBreakpoints: {
            ...defaultConfig.responsiveBreakpoints,
            ...customConfig.responsiveBreakpoints
        }
    };
}

/**
 * Helper para generar clases CSS dinámicas
 * @param {string} baseClass - Clase base
 * @param {Object} modifiers - Modificadores condicionales
 * @returns {string} - String de clases CSS
 */
export function generateContactClasses(baseClass, modifiers = {}) {
    const classes = [baseClass];
    
    Object.entries(modifiers).forEach(([className, condition]) => {
        if (condition) {
            classes.push(className);
        }
    });
    
    return classes.join(' ');
}

/**
 * Función para logging de contacto en desarrollo
 * @param {string} message - Mensaje
 * @param {Object} data - Datos adicionales
 */
export function logContactInfo(message, data = {}) {
    if (import.meta.env.DEV) {
        console.log(`[Contact] ${message}`, data);
    }
}

export default {
    getContactDataForAstro,
    getGoogleMapsUrl,
    formatPhoneForTel,
    getWhatsAppUrl,
    getFormattedSchedule,
    getRestaurantStatusWithTranslation,
    getRestaurantJsonLD,
    getContactOpenGraph,
    getContactThemeConfig,
    createContactConfig,
    generateContactClasses,
    logContactInfo
};