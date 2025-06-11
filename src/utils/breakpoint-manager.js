/**
 * Sistema centralizado para manejo de breakpoints y eventos de resize
 * Singleton que gestiona todos los listeners de resize de la aplicación
 */

class BreakpointManager {
    constructor() {
        if (BreakpointManager.instance) {
            return BreakpointManager.instance;
        }

        this.breakpoints = {
            mobile: 767,
            tablet: 1023,
            desktop: 1399,
            'desktop-lg': Infinity
        };

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
        if (this.isInitialized) return;

        this.currentBreakpoint = this.getCurrentBreakpoint();
        this.setupResizeListener();
        this.isInitialized = true;

        console.log('🔧 BreakpointManager initialized:', this.currentBreakpoint);
    }

    /**
     * Obtiene el breakpoint actual basado en el ancho de ventana
     */
    getCurrentBreakpoint() {
        const width = window.innerWidth;

        if (width <= this.breakpoints.mobile) return 'mobile';
        if (width <= this.breakpoints.tablet) return 'tablet';
        if (width <= this.breakpoints.desktop) return 'desktop';
        return 'desktop-lg';
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
                
                // Notificar resize general
                this.notifyResize();
            }, 150);
        };

        window.addEventListener('resize', throttledResize);
    }

    /**
     * Suscribe un componente a cambios de breakpoint
     * @param {string} componentId - ID único del componente
     * @param {Object} callbacks - Objeto con callbacks
     * @param {Function} callbacks.onBreakpointChange - Callback para cambio de breakpoint
     * @param {Function} callbacks.onResize - Callback para resize general
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

        console.log(`Component ${componentId} subscribed to BreakpointManager`);
    }

    /**
     * Desuscribe un componente
     * @param {string} componentId - ID del componente
     */
    unsubscribe(componentId) {
        if (this.subscribers.has(componentId)) {
            this.subscribers.delete(componentId);
            console.log(`Component ${componentId} unsubscribed from BreakpointManager`);
        }
    }

    /**
     * Notifica a todos los suscriptores sobre cambio de breakpoint
     */
    notifyBreakpointChange(oldBreakpoint, newBreakpoint) {
        console.log(`📱 Breakpoint changed: ${oldBreakpoint} → ${newBreakpoint}`);

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
     * @param {string} breakpoint - Nombre del breakpoint
     * @returns {boolean}
     */
    is(breakpoint) {
        return this.currentBreakpoint === breakpoint;
    }

    /**
     * Verifica si estamos en móvil
     * @returns {boolean}
     */
    isMobile() {
        return this.currentBreakpoint === 'mobile';
    }

    /**
     * Verifica si estamos en tablet o superior
     * @returns {boolean}
     */
    isTabletUp() {
        return ['tablet', 'desktop', 'desktop-lg'].includes(this.currentBreakpoint);
    }

    /**
     * Verifica si estamos en desktop o superior
     * @returns {boolean}
     */
    isDesktopUp() {
        return ['desktop', 'desktop-lg'].includes(this.currentBreakpoint);
    }

    /**
     * Obtiene información de los breakpoints
     */
    getBreakpointInfo() {
        return {
            current: this.currentBreakpoint,
            width: window.innerWidth,
            breakpoints: this.breakpoints,
            subscribers: this.subscribers.size
        };
    }

    /**
     * Limpia todos los suscriptores (útil para cleanup)
     */
    cleanup() {
        this.subscribers.clear();
        if (this.resizeTimer) {
            clearTimeout(this.resizeTimer);
        }
        console.log('🧹 BreakpointManager cleaned up');
    }
}

// Funciones de conveniencia para usar en los componentes
export const breakpointManager = new BreakpointManager();

/**
 * Hook fácil para suscribirse desde componentes
 * @param {string} componentId - ID único del componente  
 * @param {Object} options - Opciones de suscripción
 * @returns {Object} - Objeto con utilidades
 */
export function useBreakpoints(componentId, options = {}) {
    // Auto-inicializar si no está inicializado
    if (!breakpointManager.isInitialized) {
        breakpointManager.init();
    }

    const currentBreakpoint = breakpointManager.currentBreakpoint || breakpointManager.getCurrentBreakpoint();

    return {
        // Suscribirse
        subscribe: (callbacks) => breakpointManager.subscribe(componentId, { ...options, ...callbacks }),
        
        // Desuscribirse
        unsubscribe: () => breakpointManager.unsubscribe(componentId),
        
        // Estado actual
        current: currentBreakpoint,
        
        // Helpers
        isMobile: () => breakpointManager.isMobile(),
        isTabletUp: () => breakpointManager.isTabletUp(),
        isDesktopUp: () => breakpointManager.isDesktopUp(),
        is: (breakpoint) => breakpointManager.is(breakpoint),
        
        // Info
        getInfo: () => breakpointManager.getBreakpointInfo()
    };
}

/**
 * Utilidad para deshabilitar transiciones temporalmente durante resize
 * @param {HTMLElement|HTMLElement[]} elements - Elemento(s) a afectar
 * @param {number} duration - Duración en ms para mantener deshabilitadas las transiciones
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
 * Inicializa el sistema automáticamente cuando se carga el DOM
 */
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        breakpointManager.init();
    });
}