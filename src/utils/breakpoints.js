/**
 * SISTEMA UNIFICADO DE BREAKPOINTS
 * 
 * Combina gestión avanzada con helpers simples
 * Un solo archivo para todos los casos de uso
 */

// === CONFIGURACIÓN DE BREAKPOINTS ===
export const breakpoints = {
    mobileSm: 480,
    mobile: 767,
    tablet: 1023,
    desktop: 1399,
    desktopLg: Infinity
};

// === MEDIA QUERIES ===
export const mediaQueries = {
    mobileSm: `(max-width: ${breakpoints.mobileSm}px)`,
    mobile: `(max-width: ${breakpoints.mobile}px)`,
    tablet: `(min-width: ${breakpoints.tablet + 1}px) and (max-width: ${breakpoints.desktop}px)`,
    desktop: `(min-width: ${breakpoints.desktop + 1}px) and (max-width: ${breakpoints.desktopLg - 1}px)`,
    desktopLg: `(min-width: ${breakpoints.desktopLg}px)`,
    
    // Helpers adicionales
    mobileDown: `(max-width: ${breakpoints.mobile}px)`,
    tabletUp: `(min-width: ${breakpoints.tablet + 1}px)`,
    desktopUp: `(min-width: ${breakpoints.desktop + 1}px)`,
};

// === CLASE PRINCIPAL DEL MANAGER ===
class BreakpointManager {
    constructor() {
        if (BreakpointManager.instance) {
            return BreakpointManager.instance;
        }

        this.currentBreakpoint = null;
        this.subscribers = new Map();
        this.resizeTimer = null;
        this.isInitialized = false;

        BreakpointManager.instance = this;
    }

    /**
     * Inicializa el manager (solo se ejecuta una vez)
     */
    init() {
        if (this.isInitialized || typeof window === 'undefined') return;

        this.currentBreakpoint = this.getCurrentBreakpoint();
        this.setupResizeListener();
        this.isInitialized = true;

        console.debug('BreakpointManager initialized:', this.currentBreakpoint);
    }

    /**
     * Obtiene el breakpoint actual basado en el ancho de ventana
     */
    getCurrentBreakpoint() {
        if (typeof window === 'undefined') return 'desktop'; // SSR fallback
        
        const width = window.innerWidth;

        if (width <= breakpoints.mobileSm) return 'mobileSm';
        if (width <= breakpoints.mobile) return 'mobile';
        if (width <= breakpoints.tablet) return 'tablet';
        if (width <= breakpoints.desktop) return 'desktop';
        return 'desktopLg';
    }

    /**
     * Configura el listener de resize con throttling
     */
    setupResizeListener() {
        const throttledResize = () => {
            clearTimeout(this.resizeTimer);
            
            this.resizeTimer = setTimeout(() => {
                const newBreakpoint = this.getCurrentBreakpoint();
                
                if (newBreakpoint !== this.currentBreakpoint) {
                    const oldBreakpoint = this.currentBreakpoint;
                    this.currentBreakpoint = newBreakpoint;
                    
                    this.notifyBreakpointChange(oldBreakpoint, newBreakpoint);
                }
                
                this.notifyResize();
            }, 150);
        };

        window.addEventListener('resize', throttledResize);
    }

    /**
     * Suscribe un componente a cambios de breakpoint
     */
    subscribe(componentId, callbacks = {}) {
        if (this.subscribers.has(componentId)) {
            console.warn(`Component ${componentId} is already subscribed to BreakpointManager`);
            return;
        }

        this.subscribers.set(componentId, {
            onBreakpointChange: callbacks.onBreakpointChange || null,
            onResize: callbacks.onResize || null,
            element: callbacks.element || null
        });

        console.debug(`Component ${componentId} subscribed to BreakpointManager`);
    }

    /**
     * Desuscribe un componente
     */
    unsubscribe(componentId) {
        if (this.subscribers.has(componentId)) {
            this.subscribers.delete(componentId);
            console.debug(`Component ${componentId} unsubscribed from BreakpointManager`);
        }
    }

    /**
     * Notifica a todos los suscriptores sobre cambio de breakpoint
     */
    notifyBreakpointChange(oldBreakpoint, newBreakpoint) {
        console.debug(`Breakpoint changed: ${oldBreakpoint} -> ${newBreakpoint}`);

        this.subscribers.forEach((subscriber, componentId) => {
            if (subscriber.onBreakpointChange) {
                try {
                    subscriber.onBreakpointChange(newBreakpoint, oldBreakpoint, subscriber.element);
                } catch (error) {
                    console.error(`Error in breakpoint callback for ${componentId}:`, error);
                }
            }
        });
    }

    /**
     * Notifica a todos los suscriptores sobre resize general
     */
    notifyResize() {
        this.subscribers.forEach((subscriber, componentId) => {
            if (subscriber.onResize) {
                try {
                    subscriber.onResize(this.currentBreakpoint, subscriber.element);
                } catch (error) {
                    console.error(`Error in resize callback for ${componentId}:`, error);
                }
            }
        });
    }

    /**
     * Verifica si estamos en un breakpoint específico
     */
    is(breakpoint) {
        return this.currentBreakpoint === breakpoint;
    }

    /**
     * Helpers para breakpoints comunes
     */
    isMobile() {
        return ['mobileSm', 'mobile'].includes(this.currentBreakpoint);
    }

    isTablet() {
        return this.currentBreakpoint === 'tablet';
    }

    isTabletUp() {
        return ['tablet', 'desktop', 'desktopLg'].includes(this.currentBreakpoint);
    }

    isDesktop() {
        return ['desktop', 'desktopLg'].includes(this.currentBreakpoint);
    }

    isDesktopUp() {
        return ['desktop', 'desktopLg'].includes(this.currentBreakpoint);
    }

    isDesktopLg() {
        return this.currentBreakpoint === 'desktopLg';
    }

    /**
     * Verifica si el ancho es mayor que un breakpoint
     */
    isAbove(breakpoint) {
        if (typeof window === 'undefined') return false;
        return window.innerWidth > breakpoints[breakpoint];
    }

    /**
     * Verifica si el ancho es menor que un breakpoint
     */
    isBelow(breakpoint) {
        if (typeof window === 'undefined') return false;
        return window.innerWidth < breakpoints[breakpoint];
    }

    /**
     * Obtiene información de los breakpoints
     */
    getBreakpointInfo() {
        return {
            current: this.currentBreakpoint,
            width: typeof window !== 'undefined' ? window.innerWidth : 0,
            breakpoints: breakpoints,
            subscribers: this.subscribers.size
        };
    }

    /**
     * Limpia todos los suscriptores
     */
    cleanup() {
        this.subscribers.clear();
        if (this.resizeTimer) {
            clearTimeout(this.resizeTimer);
        }
        console.debug('BreakpointManager cleaned up');
    }
}

// === INSTANCIA SINGLETON ===
export const breakpointManager = new BreakpointManager();

// === HELPERS SIMPLES (Para uso directo sin suscripciones) ===

/**
 * Detecta el breakpoint actual
 */
export function getCurrentBreakpoint() {
    return breakpointManager.getCurrentBreakpoint();
}

/**
 * Verifica si está en un breakpoint específico usando MediaQuery
 */
export function isBreakpoint(breakpoint) {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(mediaQueries[breakpoint]).matches;
}

/**
 * Helpers rápidos para breakpoints comunes
 */
export const isMobile = () => breakpointManager.isMobile();
export const isTablet = () => breakpointManager.isTablet();
export const isTabletUp = () => breakpointManager.isTabletUp();
export const isDesktop = () => breakpointManager.isDesktop();
export const isDesktopUp = () => breakpointManager.isDesktopUp();
export const isDesktopLg = () => breakpointManager.isDesktopLg();
export const isAbove = (breakpoint) => breakpointManager.isAbove(breakpoint);
export const isBelow = (breakpoint) => breakpointManager.isBelow(breakpoint);

// === HOOK PARA COMPONENTES ===

/**
 * Hook principal para usar en componentes
 */
export function useBreakpoints(componentId, options = {}) {
    // Auto-inicializar si no está inicializado
    if (!breakpointManager.isInitialized && typeof window !== 'undefined') {
        breakpointManager.init();
    }

    const currentBreakpoint = breakpointManager.currentBreakpoint || breakpointManager.getCurrentBreakpoint();

    return {
        // Suscripción
        subscribe: (callbacks) => breakpointManager.subscribe(componentId, { ...options, ...callbacks }),
        unsubscribe: () => breakpointManager.unsubscribe(componentId),
        
        // Estado actual
        current: currentBreakpoint,
        
        // Helpers
        isMobile: () => breakpointManager.isMobile(),
        isTablet: () => breakpointManager.isTablet(),
        isTabletUp: () => breakpointManager.isTabletUp(),
        isDesktop: () => breakpointManager.isDesktop(),
        isDesktopUp: () => breakpointManager.isDesktopUp(),
        isDesktopLg: () => breakpointManager.isDesktopLg(),
        is: (breakpoint) => breakpointManager.is(breakpoint),
        isAbove: (breakpoint) => breakpointManager.isAbove(breakpoint),
        isBelow: (breakpoint) => breakpointManager.isBelow(breakpoint),
        
        // Info
        getInfo: () => breakpointManager.getBreakpointInfo()
    };
}

// === LISTENER PARA CAMBIOS DE BREAKPOINT (Hook Simple) ===

/**
 * Listener simple para cambios de breakpoint sin gestión avanzada
 */
export function onBreakpointChange(callback) {
    if (typeof window === 'undefined') return () => {};
    
    let currentBreakpoint = getCurrentBreakpoint();
    
    const handler = () => {
        const newBreakpoint = getCurrentBreakpoint();
        if (newBreakpoint !== currentBreakpoint) {
            currentBreakpoint = newBreakpoint;
            callback(newBreakpoint);
        }
    };
    
    window.addEventListener('resize', handler);
    
    // Retorna función de cleanup
    return () => window.removeEventListener('resize', handler);
}

// === UTILIDADES ===

/**
 * Utilidad para deshabilitar transiciones temporalmente durante resize
 */
export function disableTransitionsDuringResize(elements, duration = 100) {
    const elementArray = Array.isArray(elements) ? elements : [elements];
    
    elementArray.forEach(element => {
        if (element) {
            element.style.transition = 'none';
        }
    });
    
    requestAnimationFrame(() => {
        setTimeout(() => {
            elementArray.forEach(element => {
                if (element) {
                    element.style.transition = '';
                }
            });
        }, duration);
    });
}

/**
 * Inicialización automática cuando se carga el DOM
 */
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        breakpointManager.init();
    });
}