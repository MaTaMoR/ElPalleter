/**
 * Script global para inicializar el sistema de breakpoints
 * Se debe importar en el layout principal de Astro
 */

import { breakpointManager } from '../utils/astro-i18n-utils.js';

// Auto-inicializar el sistema cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el sistema central
    breakpointManager.init();
    
    // Información de debug en modo desarrollo
    if (import.meta.env.DEV) {
        console.log('🚀 Sistema de Breakpoints iniciado:', breakpointManager.getBreakpointInfo());
        
        // Listener para mostrar info en cambios de breakpoint (solo en desarrollo)
        breakpointManager.subscribe('debug-global', {
            onBreakpointChange: (newBreakpoint, oldBreakpoint) => {
                console.log(`[GLOBAL] Breakpoint cambió: ${oldBreakpoint} → ${newBreakpoint}`);
                console.log('Componentes suscritos:', breakpointManager.getBreakpointInfo().subscribers);
            }
        });
    }
});

// Cleanup global al salir de la página
window.addEventListener('beforeunload', () => {
    breakpointManager.cleanup();
});

// Exportar funciones de utilidad globales para usar en otros scripts
window.Breakpoints = {
    manager: breakpointManager,
    getCurrentBreakpoint: () => breakpointManager.getCurrentBreakpoint(),
    isMobile: () => breakpointManager.isMobile(),
    isTabletUp: () => breakpointManager.isTabletUp(),
    isDesktopUp: () => breakpointManager.isDesktopUp(),
    getInfo: () => breakpointManager.getBreakpointInfo()
};

// Función de diagnóstico (disponible en consola)
if (import.meta.env.DEV) {
    window.debugBreakpoints = () => {
        const info = breakpointManager.getBreakpointInfo();
        console.table({
            'Breakpoint Actual': info.current,
            'Ancho de Ventana': info.width + 'px',
            'Componentes Suscritos': info.subscribers,
            'Sistema Inicializado': breakpointManager.isInitialized
        });
        
        console.log('Breakpoints configurados:', info.breakpoints);
        console.log('Componentes suscritos:', [...breakpointManager.subscribers.keys()]);
    };
}