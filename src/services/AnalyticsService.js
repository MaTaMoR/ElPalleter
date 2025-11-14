// src/services/AnalyticsService.js

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
 * Servicio de Analytics compartido
 * Maneja el tracking automático y envío de datos
 */
export class AnalyticsService {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.visitStartTime = Date.now();
        this.isTrackingEnabled = true;
        this.eventQueue = [];
        this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        this.hasStartedVisit = false;
        this.deviceType = typeof window !== 'undefined' ? detectDeviceType() : 'UNKNOWN';
        
        // Solo configurar listeners si estamos en el browser
        if (typeof window !== 'undefined') {
            this.setupEventListeners();
        }
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    setupEventListeners() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.endVisitTracking();
            }
        });

        window.addEventListener('beforeunload', () => {
            this.endVisitTracking();
        });

        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processEventQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });

        // Auto-start tracking
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.startVisitTracking();
            });
        } else {
            setTimeout(() => this.startVisitTracking(), 100);
        }
    }

    getLanguageFromUrl() {
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
    async startVisitTracking() {
        if (!this.isTrackingEnabled || this.hasStartedVisit) return;
        
        this.hasStartedVisit = true;

        const visitData = {
            sessionId: this.sessionId,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
            languageCode: this.getLanguageFromUrl(),
            referrer: typeof document !== 'undefined' ? document.referrer || null : null,
            screenWidth: typeof window !== 'undefined' ? window.screen?.width : null,
            screenHeight: typeof window !== 'undefined' ? window.screen?.height : null,
            deviceType: this.deviceType  // ← Añadido: tipo de dispositivo real
        };

        await this.sendToRepository('trackVisitStart', visitData);
        
        // Track initial page load event
        this.trackEvent('PAGE_LOAD', null, {
            url: typeof window !== 'undefined' ? window.location.href : 'unknown',
            deviceType: this.deviceType,
            viewport: typeof window !== 'undefined' ? {
                width: window.innerWidth,
                height: window.innerHeight
            } : null
        });
    }

    async trackEvent(eventType, sectionName = null, eventData = {}) {
        if (!this.isTrackingEnabled) return;

        const event = {
            sessionId: this.sessionId,
            eventType: eventType,
            sectionName: sectionName,
            timestamp: new Date().toISOString(),
            eventData: {
                ...eventData,
                url: typeof window !== 'undefined' ? window.location.href : 'unknown',
                deviceType: this.deviceType  // Incluir en todos los eventos
            }
        };

        await this.sendToRepository('trackEvent', event);
    }

    async trackSectionView(sectionName) {
        await this.trackEvent('SECTION_VIEW', sectionName, {
            scrollPosition: typeof window !== 'undefined' ? window.scrollY : 0,
            sectionVisible: this.isSectionVisible(sectionName)
        });
    }

    async trackFormSubmit(formType, sectionName) {
        await this.trackEvent('FORM_SUBMIT', sectionName, {
            formType: formType
        });
    }

    async trackContactClick(contactType, sectionName) {
        await this.trackEvent('CONTACT_CLICK', sectionName, {
            contactType: contactType
        });
    }

    async trackMenuView(menuSection) {
        await this.trackEvent('MENU_VIEW', 'carta', {
            menuSection: menuSection
        });
    }

    isSectionVisible(sectionName) {
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

    async endVisitTracking() {
        if (!this.isTrackingEnabled || !this.hasStartedVisit) return;

        const duration = Math.floor((Date.now() - this.visitStartTime) / 1000);
        
        const endData = {
            sessionId: this.sessionId,
            durationSeconds: duration
        };

        // Use sendBeacon for reliable sending on page unload
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

    async sendToRepository(method, data) {
        if (!this.isOnline) {
            this.eventQueue.push({ method, data });
            return;
        }

        try {
            await AnalyticsRepository[method](data, AuthService.getToken());
        } catch (error) {
            console.warn('Analytics tracking failed:', error);
            this.eventQueue.push({ method, data });
        }
    }

    async processEventQueue() {
        if (!this.isOnline || this.eventQueue.length === 0) return;

        const queue = [...this.eventQueue];
        this.eventQueue = [];

        for (const { method, data } of queue) {
            await this.sendToRepository(method, data);
        }
    }

    disableTracking() {
        this.isTrackingEnabled = false;
    }

    enableTracking() {
        this.isTrackingEnabled = true;
    }

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

    async getCustomPeriodStats(startDate, endDate) {
        try {
            return await AnalyticsRepository.getCustomPeriodStats(AuthService.getToken(), startDate, endDate);
        } catch (error) {
            console.error('AnalyticsService: Error getting custom period stats:', error);
            throw error;
        }
    }

    async healthCheck() {
        try {
            const repoHealth = await AnalyticsRepository.healthCheck();
            
            return {
                ...repoHealth,
                service: 'AnalyticsService',
                sessionId: this.sessionId,
                trackingEnabled: this.isTrackingEnabled,
                hasStartedVisit: this.hasStartedVisit,
                deviceType: this.deviceType,
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

        const sectionsToObserve = sectionIds.length > 0 
            ? sectionIds.map(id => document.getElementById(id)).filter(Boolean)
            : Array.from(document.querySelectorAll('[id], [data-section]'));

        sectionsToObserve.forEach(section => {
            observer.observe(section);
        });

        return observer;
    }

    getConfig() {
        return {
            repository: AnalyticsRepository.getConfig(),
            sessionId: this.sessionId,
            trackingEnabled: this.isTrackingEnabled,
            deviceType: this.deviceType,
            supportedLanguages: ['es', 'en', 'val'],
            defaultLanguage: 'es'
        };
    }
}

// Crear instancia singleton
const analyticsService = new AnalyticsService();

export default analyticsService;