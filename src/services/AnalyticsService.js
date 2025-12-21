import { AnalyticsRepository } from '../repositories/AnalyticsRepository.js';
import { AuthService } from './AuthService.js';

/**
 * Detecta el tipo de dispositivo real basándose en múltiples factores
 * @returns {string} 'MOBILE' | 'TABLET' | 'DESKTOP' | 'UNKNOWN'
 */
function detectDeviceType() {
    if (typeof window === 'undefined') return 'UNKNOWN';

    const ua = navigator.userAgent.toLowerCase();
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const maxScreenDimension = Math.max(screenWidth, screenHeight);
    const minScreenDimension = Math.min(screenWidth, screenHeight);

    // Patrones de móviles
    const mobilePatterns = [
        /android.*mobile/i, /iphone/i, /ipod/i, /blackberry/i,
        /windows phone/i, /opera mini/i, /iemobile/i
    ];

    // Patrones de tablets
    const tabletPatterns = [
        /ipad/i, /android(?!.*mobile)/i, /tablet/i, /kindle/i, /silk/i
    ];

    // Detectar por UA primero
    if (mobilePatterns.some(pattern => pattern.test(ua))) {
        return 'MOBILE';
    }

    if (tabletPatterns.some(pattern => pattern.test(ua))) {
        return 'TABLET';
    }

    // Si tiene touch, usar tamaño de pantalla física
    if (hasTouch) {
        if (maxScreenDimension <= 768) return 'MOBILE';
        if (maxScreenDimension <= 1366 && minScreenDimension >= 600) return 'TABLET';
    }

    // Por defecto, desktop
    return 'DESKTOP';
}

/**
 * Estado del servicio (a nivel de módulo)
 */
const state = {
    sessionId: null,
    visitStartTime: null,
    isTrackingEnabled: true,
    eventQueue: [],
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    hasStartedVisit: false,
    deviceType: typeof window !== 'undefined' ? detectDeviceType() : 'UNKNOWN',
    MIN_SESSION_DURATION: 5000, // 5 segundos mínimo
    visibilityTimeout: null,
    initialized: false
};

/**
 * Servicio de Analytics compartido
 * Maneja el tracking automático y envío de datos
 */
export class AnalyticsService {

    static initialize() {
        if (state.initialized) return;

        state.sessionId = this.generateSessionId();
        state.visitStartTime = Date.now();

        if (typeof window !== 'undefined') {
            this.setupEventListeners();
        }

        state.initialized = true;
    }

    static generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    static setupEventListeners() {
        // ← MODIFICAR: Agregar delay antes de reportar fin
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                // Esperar 3 segundos antes de considerar que se fue
                state.visibilityTimeout = setTimeout(() => {
                    AnalyticsService.endVisitTracking();
                }, 3000);
            } else {
                // Si vuelve, cancelar el timeout
                if (state.visibilityTimeout) {
                    clearTimeout(state.visibilityTimeout);
                    state.visibilityTimeout = null;
                }
            }
        });

        window.addEventListener('beforeunload', () => {
            // Cancelar timeout si existe
            if (state.visibilityTimeout) {
                clearTimeout(state.visibilityTimeout);
            }
            AnalyticsService.endVisitTracking();
        });

        window.addEventListener('online', () => {
            state.isOnline = true;
            AnalyticsService.processEventQueue();
        });

        window.addEventListener('offline', () => {
            state.isOnline = false;
        });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                AnalyticsService.startVisitTracking();
            });
        } else {
            setTimeout(() => AnalyticsService.startVisitTracking(), 100);
        }
    }

    static getLanguageFromUrl() {
        if (typeof window === 'undefined') return 'es';

        const path = window.location.pathname;
        if (path.startsWith('/en')) return 'en';
        if (path.startsWith('/val')) return 'val';
        if (path.startsWith('/es') || path === '/') return 'es';
        return 'es';
    }

    /**
     * Inicia el tracking de la visita
     * IMPORTANTE: Ahora incluye el deviceType detectado correctamente
     */
    static async startVisitTracking() {
        if (!state.isTrackingEnabled || state.hasStartedVisit) return;

        state.hasStartedVisit = true;

        const visitData = {
            sessionId: state.sessionId,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
            languageCode: this.getLanguageFromUrl(),
            referrer: typeof document !== 'undefined' ? document.referrer || null : null,
            screenWidth: typeof window !== 'undefined' ? window.screen?.width : null,
            screenHeight: typeof window !== 'undefined' ? window.screen?.height : null,
            deviceType: state.deviceType  // ← Añadido: tipo de dispositivo real
        };

        await this.sendToRepository('trackVisitStart', visitData);

        // Track initial page load event
        this.trackEvent('PAGE_LOAD', null, {
            url: typeof window !== 'undefined' ? window.location.href : 'unknown',
            deviceType: state.deviceType,
            viewport: typeof window !== 'undefined' ? {
                width: window.innerWidth,
                height: window.innerHeight
            } : null
        });
    }

    static async trackEvent(eventType, sectionName = null, eventData = {}) {
        if (!state.isTrackingEnabled) return;

        const event = {
            sessionId: state.sessionId,
            eventType: eventType,
            sectionName: sectionName,
            timestamp: new Date().toISOString(),
            eventData: {
                ...eventData,
                url: typeof window !== 'undefined' ? window.location.href : 'unknown',
                deviceType: state.deviceType  // Incluir en todos los eventos
            }
        };

        await this.sendToRepository('trackEvent', event);
    }

    static async trackSectionView(sectionName) {
        await this.trackEvent('SECTION_VIEW', sectionName, {
            scrollPosition: typeof window !== 'undefined' ? window.scrollY : 0,
            sectionVisible: this.isSectionVisible(sectionName)
        });
    }

    static async trackFormSubmit(formType, sectionName) {
        await this.trackEvent('FORM_SUBMIT', sectionName, {
            formType: formType
        });
    }

    static async trackContactClick(contactType, sectionName) {
        await this.trackEvent('CONTACT_CLICK', sectionName, {
            contactType: contactType
        });
    }

    static async trackMenuView(menuSection) {
        await this.trackEvent('MENU_VIEW', 'carta', {
            menuSection: menuSection
        });
    }

    static isSectionVisible(sectionName) {
        if (typeof window === 'undefined') return false;

        const element = document.getElementById(sectionName) ||
                       document.querySelector(`[data-section="${sectionName}"]`);

        if (!element) return false;

        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        const sectionHeight = rect.height;

        return visibleHeight / sectionHeight > 0.5;
    }

    static async endVisitTracking() {
        if (!state.isTrackingEnabled || !state.hasStartedVisit) return;

        const duration = Math.floor((Date.now() - state.visitStartTime) / 1000);

        if (duration * 1000 < state.MIN_SESSION_DURATION) {
            console.debug('Session too short, not tracking end', { duration });
            return;
        }

        const endData = {
            sessionId: state.sessionId,
            durationSeconds: duration
        };

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

    static async sendToRepository(method, data) {
        if (!state.isOnline) {
            state.eventQueue.push({ method, data });
            return;
        }

        try {
            await AnalyticsRepository[method](data, AuthService.getToken());
        } catch (error) {
            console.warn('Analytics tracking failed:', error);
            state.eventQueue.push({ method, data });
        }
    }

    static async processEventQueue() {
        if (!state.isOnline || state.eventQueue.length === 0) return;

        const queue = [...state.eventQueue];
        state.eventQueue = [];

        for (const { method, data } of queue) {
            await this.sendToRepository(method, data);
        }
    }

    static disableTracking() {
        state.isTrackingEnabled = false;
    }

    static enableTracking() {
        state.isTrackingEnabled = true;
    }

    static async getMonthlyStats(year = null, month = null) {
        try {
            return await AnalyticsRepository.getMonthlyStats(AuthService.getToken(), year, month);
        } catch (error) {
            console.error('AnalyticsService: Error getting monthly stats:', error);
            throw error;
        }
    }

    static async getStartDate() {
        try {
            return await AnalyticsRepository.getStartDate(AuthService.getToken());
        } catch (error) {
            console.error('AnalyticsService: Error getting start date:', error);
            throw error;
        }
    }

    static async getYearlyStats() {
        try {
            return await AnalyticsRepository.getYearlyStats(AuthService.getToken());
        } catch (error) {
            console.error('AnalyticsService: Error getting yearly stats:', error);
            throw error;
        }
    }

    /**
     * @deprecated - Usar getMonthlyStats en su lugar
     */
    static async getWeeklyStats() {
        try {
            return await AnalyticsRepository.getWeeklyStats(AuthService.getToken());
        } catch (error) {
            console.error('AnalyticsService: Error getting weekly stats:', error);
            throw error;
        }
    }

    /**
     * @deprecated - Usar getMonthlyStats en su lugar
     */
    static async getPreviousWeekStats() {
        try {
            return await AnalyticsRepository.getLastWeekStats(AuthService.getToken());
        } catch (error) {
            console.error('AnalyticsService: Error getting last week stats:', error);
            throw error;
        }
    }

    /**
     * @deprecated - Usar getMonthlyStats en su lugar
     */
    static async getCustomPeriodStats(startDate, endDate) {
        try {
            return await AnalyticsRepository.getCustomPeriodStats(AuthService.getToken(), startDate, endDate);
        } catch (error) {
            console.error('AnalyticsService: Error getting custom period stats:', error);
            throw error;
        }
    }

    static async healthCheck() {
        try {
            const repoHealth = await AnalyticsRepository.healthCheck();

            return {
                ...repoHealth,
                service: 'AnalyticsService',
                sessionId: state.sessionId,
                trackingEnabled: state.isTrackingEnabled,
                hasStartedVisit: state.hasStartedVisit,
                deviceType: state.deviceType,
                queueLength: state.eventQueue.length,
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

    static setupSectionTracking(sectionIds = []) {
        if (typeof window === 'undefined' || !window.IntersectionObserver) return;

        // Set para trackear secciones ya vistas
        const viewedSections = new Set();

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                        const sectionName = entry.target.id ||
                                           entry.target.getAttribute('data-section');

                        // Solo trackear si NO fue vista antes
                        if (sectionName && !viewedSections.has(sectionName)) {
                            viewedSections.add(sectionName);
                            AnalyticsService.trackSectionView(sectionName);
                            console.debug('Section viewed (first time):', sectionName);
                        }
                    }
                });
            },
            {
                threshold: 0.5,
                rootMargin: '0px'
            }
        );

        const sectionsToObserve = sectionIds.length > 0
            ? sectionIds.map(id => document.getElementById(id)).filter(Boolean)
            : Array.from(document.querySelectorAll('[id], [data-section]'));

        sectionsToObserve.forEach(section => {
            observer.observe(section);
        });

        return observer;
    }

    static getConfig() {
        return {
            repository: AnalyticsRepository.getConfig(),
            sessionId: state.sessionId,
            trackingEnabled: state.isTrackingEnabled,
            deviceType: state.deviceType,
            supportedLanguages: ['es', 'en', 'val'],
            defaultLanguage: 'es'
        };
    }
}

// Inicializar el servicio automáticamente cuando se carga el módulo
if (typeof window !== 'undefined') {
    AnalyticsService.initialize();
}

export default AnalyticsService;