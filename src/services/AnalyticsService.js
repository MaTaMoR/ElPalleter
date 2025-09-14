// src/services/AnalyticsService.js

import { AnalyticsRepository } from '../repositories/AnalyticsRepository.js';
import { AuthService } from './AuthService.js';

/**
 * Servicio de Analytics compartido
 * Maneja el tracking automático y envío de datos
 * Usado tanto por la web Astro como por el admin React
 */
export class AnalyticsService {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.visitStartTime = Date.now();
        this.isTrackingEnabled = true;
        this.eventQueue = [];
        this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        this.hasStartedVisit = false;
        
        // Solo configurar listeners si estamos en el browser
        if (typeof window !== 'undefined') {
            this.setupEventListeners();
        }
    }

    /**
     * Genera un ID único para la sesión
     * @returns {string} Session ID único
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Configura los event listeners del browser
     */
    setupEventListeners() {
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.endVisitTracking();
            }
        });

        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.endVisitTracking();
        });

        // Track online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processEventQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });

        // Auto-start tracking después de que la página cargue
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.startVisitTracking();
            });
        } else {
            // Ya está cargada
            setTimeout(() => this.startVisitTracking(), 100);
        }
    }

    /**
     * Obtiene el código de idioma desde la URL
     * @returns {string} Código de idioma
     */
    getLanguageFromUrl() {
        if (typeof window === 'undefined') return 'es';
        
        const path = window.location.pathname;
        if (path.startsWith('/en')) return 'en';
        if (path.startsWith('/val')) return 'val';
        if (path.startsWith('/es') || path === '/') return 'es';
        return 'es'; // default
    }

    /**
     * Inicia el tracking de la visita
     */
    async startVisitTracking() {
        if (!this.isTrackingEnabled || this.hasStartedVisit) return;
        
        this.hasStartedVisit = true;

        const visitData = {
            sessionId: this.sessionId,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
            languageCode: this.getLanguageFromUrl(),
            referrer: typeof document !== 'undefined' ? document.referrer || null : null,
            screenWidth: typeof window !== 'undefined' ? window.screen?.width : null,
            screenHeight: typeof window !== 'undefined' ? window.screen?.height : null
        };

        await this.sendToRepository('trackVisitStart', visitData);
        
        // Track initial page load event
        this.trackEvent('PAGE_LOAD', null, {
            url: typeof window !== 'undefined' ? window.location.href : 'unknown',
            timestamp: new Date().toISOString(),
            viewport: typeof window !== 'undefined' ? {
                width: window.innerWidth,
                height: window.innerHeight
            } : null
        });
    }

    /**
     * Registra un evento de usuario
     * @param {string} eventType - Tipo de evento
     * @param {string|null} sectionName - Nombre de la sección
     * @param {Object} eventData - Datos adicionales del evento
     */
    async trackEvent(eventType, sectionName = null, eventData = {}) {
        if (!this.isTrackingEnabled) return;

        const event = {
            sessionId: this.sessionId,
            eventType: eventType,
            sectionName: sectionName,
            eventData: {
                ...eventData,
                timestamp: new Date().toISOString(),
                url: typeof window !== 'undefined' ? window.location.href : 'unknown'
            }
        };

        await this.sendToRepository('trackEvent', event);
    }

    /**
     * Registra la visualización de una sección
     * @param {string} sectionName - Nombre de la sección
     */
    async trackSectionView(sectionName) {
        await this.trackEvent('SECTION_VIEW', sectionName, {
            scrollPosition: typeof window !== 'undefined' ? window.scrollY : 0,
            sectionVisible: this.isSectionVisible(sectionName)
        });
    }

    /**
     * Registra el envío de un formulario
     * @param {string} formType - Tipo de formulario
     * @param {string} sectionName - Sección donde está el formulario
     */
    async trackFormSubmit(formType, sectionName) {
        await this.trackEvent('FORM_SUBMIT', sectionName, {
            formType: formType
        });
    }

    /**
     * Registra un click de contacto
     * @param {string} contactType - Tipo de contacto (phone, email, etc.)
     * @param {string} sectionName - Sección donde se hizo click
     */
    async trackContactClick(contactType, sectionName) {
        await this.trackEvent('CONTACT_CLICK', sectionName, {
            contactType: contactType
        });
    }

    /**
     * Registra la visualización del menú
     * @param {string} menuSection - Sección del menú vista
     */
    async trackMenuView(menuSection) {
        await this.trackEvent('MENU_VIEW', 'carta', {
            menuSection: menuSection
        });
    }

    /**
     * Verifica si una sección está visible
     * @param {string} sectionName - Nombre de la sección
     * @returns {boolean} True si está visible
     */
    isSectionVisible(sectionName) {
        if (typeof window === 'undefined') return false;
        
        const element = document.getElementById(sectionName) || 
                       document.querySelector(`[data-section="${sectionName}"]`);
        
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Section is visible if at least 50% is in viewport
        const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        const sectionHeight = rect.height;
        
        return visibleHeight / sectionHeight > 0.5;
    }

    /**
     * Finaliza el tracking de la visita
     */
    async endVisitTracking() {
        if (!this.isTrackingEnabled || !this.hasStartedVisit) return;

        const duration = Math.floor((Date.now() - this.visitStartTime) / 1000);
        
        const endData = {
            sessionId: this.sessionId,
            durationSeconds: duration
        };

        // Use sendBeacon for reliable sending on page unload if available
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
            try {
                const blob = new Blob([JSON.stringify(endData)], { type: 'application/json' });
                const baseUrl = AnalyticsRepository.getBaseUrl();
                navigator.sendBeacon(`${baseUrl}/analytics/visit/end`, blob);
                return;
            } catch (error) {
                console.warn('SendBeacon failed, falling back to regular request:', error);
            }
        }

        await this.sendToRepository('trackVisitEnd', endData);
    }

    /**
     * Envía datos al repositorio con manejo de errores y queue
     * @param {string} method - Método del repositorio a llamar
     * @param {Object} data - Datos a enviar
     */
    async sendToRepository(method, data) {
        if (!this.isOnline) {
            this.eventQueue.push({ method, data });
            return;
        }

        try {
            await AnalyticsRepository[method](data);
        } catch (error) {
            console.warn('Analytics tracking failed:', error);
            // Queue for retry when back online
            this.eventQueue.push({ method, data });
        }
    }

    /**
     * Procesa la cola de eventos pendientes
     */
    async processEventQueue() {
        if (!this.isOnline || this.eventQueue.length === 0) return;

        const queue = [...this.eventQueue];
        this.eventQueue = [];

        for (const { method, data } of queue) {
            await this.sendToRepository(method, data);
        }
    }

    /**
     * Deshabilita el tracking (para privacidad)
     */
    disableTracking() {
        this.isTrackingEnabled = false;
    }

    /**
     * Habilita el tracking
     */
    enableTracking() {
        this.isTrackingEnabled = true;
    }

    /**
     * Obtiene estadísticas (para admin)
     * @returns {Promise<Object>} Estadísticas semanales
     */
    async getWeeklyStats() {
        try {
            return await AnalyticsRepository.getWeeklyStats(AuthService.getToken());
        } catch (error) {
            console.error('AnalyticsService: Error getting weekly stats:', error);
            throw error;
        }
    }

    async getPreviousWeekStats() {
        try {
            return await AnalyticsRepository.getLastWeekStats(AuthService.getToken());
        } catch (error) {
            console.error('AnalyticsService: Error getting last week stats:', error);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas para un período personalizado (para admin)
     * @param {string} startDate - Fecha de inicio
     * @param {string} endDate - Fecha de fin
     * @returns {Promise<Object>} Estadísticas del período
     */
    async getCustomPeriodStats(startDate, endDate) {
        try {
            return await AnalyticsRepository.getCustomPeriodStats(AuthService.getToken(), startDate, endDate);
        } catch (error) {
            console.error('AnalyticsService: Error getting custom period stats:', error);
            throw error;
        }
    }

    /**
     * Verifica el estado del servicio
     * @returns {Promise<Object>} Estado del servicio
     */
    async healthCheck() {
        try {
            const repoHealth = await AnalyticsRepository.healthCheck();
            
            return {
                ...repoHealth,
                service: 'AnalyticsService',
                sessionId: this.sessionId,
                trackingEnabled: this.isTrackingEnabled,
                hasStartedVisit: this.hasStartedVisit,
                queueLength: this.eventQueue.length,
                lastCheck: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                service: 'AnalyticsService',
                error: error.message,
                lastCheck: new Date().toISOString()
            };
        }
    }

    /**
     * Configura un intersection observer para tracking automático de secciones
     * @param {Array<string>} sectionIds - IDs de las secciones a observar
     */
    setupSectionTracking(sectionIds = []) {
        if (typeof window === 'undefined' || !window.IntersectionObserver) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                        const sectionName = entry.target.id || 
                                           entry.target.getAttribute('data-section');
                        if (sectionName) {
                            this.trackSectionView(sectionName);
                        }
                    }
                });
            },
            {
                threshold: 0.5,
                rootMargin: '0px'
            }
        );

        // Observar secciones especificadas o encontrar automáticamente
        const sectionsToObserve = sectionIds.length > 0 
            ? sectionIds.map(id => document.getElementById(id)).filter(Boolean)
            : Array.from(document.querySelectorAll('[id], [data-section]'));

        sectionsToObserve.forEach(section => {
            observer.observe(section);
        });

        return observer;
    }

    /**
     * Obtiene la configuración del servicio
     * @returns {Object} Configuración actual
     */
    getConfig() {
        return {
            repository: AnalyticsRepository.getConfig(),
            sessionId: this.sessionId,
            trackingEnabled: this.isTrackingEnabled,
            supportedLanguages: ['es', 'en', 'val'],
            defaultLanguage: 'es'
        };
    }
}

// Crear instancia singleton para uso global
const analyticsService = new AnalyticsService();

export default analyticsService;