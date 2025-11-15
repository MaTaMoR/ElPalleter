/**
 * ThemeService - Servicio simplificado para gestionar temas dark/light
 * Compatible con el sistema de design tokens existente de El Palleter
 */

export class ThemeService {

    static themes = {
        dark: {
            id: 'dark',
            name: 'Oscuro',
            icon: '🌙',
            description: 'Tema oscuro principal'
        },
        light: {
            id: 'light', 
            name: 'Claro',
            icon: '☀️',
            description: 'Tema claro y luminoso'
        }
    };

    static DEFAULT_THEME = 'dark';
    static STORAGE_KEY = 'el-palleter-theme';
    static callbacks = [];
    static currentTheme = null;

    /**
     * INICIALIZACIÓN - Llamar al cargar la aplicación
     */
    static initialize() {
        const savedTheme = this.getSavedTheme();
        const currentDOMTheme = this.getCurrentThemeFromDOM();
        
        const initialTheme = savedTheme || currentDOMTheme || this.DEFAULT_THEME;
        
        this.setTheme(initialTheme, { skipSave: false, triggerCallbacks: false });
        this.enableThemeTransitions();
        
        console.debug(`[ThemeService] Inicializado con tema: ${initialTheme}`);
        
        return initialTheme;
    }

    /**
     * TOGGLE - Alterna entre dark y light
     */
    static toggle() {
        const currentTheme = this.getCurrentTheme();
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        this.setTheme(nextTheme);
        return nextTheme;
    }

    /**
     * SET THEME - Aplicar un tema específico
     * @param {string} themeId - 'dark' o 'light'
     * @param {Object} options - Opciones adicionales
     */
    static setTheme(themeId, options = {}) {
        const {
            skipSave = false,
            triggerCallbacks = true,
            enableTransition = true
        } = options;

        if (!this.themes[themeId]) {
            console.warn(`⚠️ Tema '${themeId}' no encontrado. Usando tema por defecto.`);
            themeId = this.DEFAULT_THEME;
        }

        const previousTheme = this.currentTheme;
        this.currentTheme = themeId;

        if (enableTransition) {
            this.enableThemeTransitions();
        }

        this.applyThemeToDOM(themeId);

        if (!skipSave) {
            this.saveTheme(themeId);
        }

        if (triggerCallbacks) {
            this.notifyThemeChange(themeId, previousTheme);
        }

        if (enableTransition) {
            setTimeout(() => {
                this.disableThemeTransitions();
            }, 300);
        }

        return themeId;
    }

    /**
     * GET CURRENT THEME - Obtiene el tema actual
     */
    static getCurrentTheme() {
        return this.currentTheme || this.getCurrentThemeFromDOM() || this.DEFAULT_THEME;
    }

    /**
     * GET THEME INFO - Obtiene información de un tema
     * @param {string} themeId - 'dark' o 'light' (opcional)
     */
    static getThemeInfo(themeId = null) {
        const targetTheme = themeId || this.getCurrentTheme();
        return this.themes[targetTheme] || this.themes[this.DEFAULT_THEME];
    }

    /**
     * IS DARK MODE - Verifica si está en modo oscuro
     */
    static isDarkMode() {
        return this.getCurrentTheme() === 'dark';
    }

    /**
     * IS LIGHT MODE - Verifica si está en modo claro
     */
    static isLightMode() {
        return this.getCurrentTheme() === 'light';
    }

    /**
     * ON THEME CHANGE - Suscribirse a cambios de tema
     * @param {Function} callback - Función a ejecutar cuando cambie el tema
     */
    static onThemeChange(callback) {
        if (typeof callback === 'function') {
            this.callbacks.push(callback);
        }
        
        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index > -1) {
                this.callbacks.splice(index, 1);
            }
        };
    }

    /**
     * NOTIFY THEME CHANGE - Notifica cambios a los suscriptores
     */
    static notifyThemeChange(newTheme, previousTheme) {
        const themeInfo = this.getThemeInfo(newTheme);
        
        this.callbacks.forEach(callback => {
            try {
                callback({
                    theme: newTheme,
                    previousTheme,
                    themeInfo,
                    isDark: newTheme === 'dark',
                    isLight: newTheme === 'light',
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error('Error en callback de cambio de tema:', error);
            }
        });
    }

    /**
     * APPLY THEME TO DOM - Aplica el tema al DOM
     */
    static applyThemeToDOM(themeId) {
        const html = document.documentElement;
        
        html.removeAttribute('data-theme');
        html.classList.remove('theme-dark', 'theme-light');
        
        html.setAttribute('data-theme', themeId);
        html.classList.add(`theme-${themeId}`);
        
        this.updateMetaThemeColor(themeId);
    }

    /**
     * UPDATE META THEME COLOR - Actualiza el color del tema en navegadores móviles
     */
    static updateMetaThemeColor(themeId) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }

        const themeColors = {
            dark: '#141414',
            light: '#ffffff'
        };

        metaThemeColor.content = themeColors[themeId] || themeColors.dark;
    }

    /**
     * SAVE THEME - Guarda el tema en localStorage
     */
    static saveTheme(themeId) {
        try {
            localStorage.setItem(this.STORAGE_KEY, themeId);
        } catch (error) {
            console.warn('No se pudo guardar el tema en localStorage:', error);
        }
    }

    /**
     * GET SAVED THEME - Obtiene el tema guardado en localStorage
     */
    static getSavedTheme() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            return saved && this.themes[saved] ? saved : null;
        } catch (error) {
            console.warn('No se pudo leer el tema de localStorage:', error);
            return null;
        }
    }

    /**
     * GET CURRENT THEME FROM DOM - Detecta el tema actual del DOM
     */
    static getCurrentThemeFromDOM() {
        const html = document.documentElement;
        const dataTheme = html.getAttribute('data-theme');
        
        if (dataTheme && this.themes[dataTheme]) {
            return dataTheme;
        }
        
        if (html.classList.contains('theme-dark')) return 'dark';
        if (html.classList.contains('theme-light')) return 'light';
        
        return null;
    }

    /**
     * ENABLE THEME TRANSITIONS - Activa transiciones suaves
     */
    static enableThemeTransitions() {
        document.documentElement.classList.add('theme-transition');
    }

    /**
     * DISABLE THEME TRANSITIONS - Desactiva transiciones
     */
    static disableThemeTransitions() {
        document.documentElement.classList.remove('theme-transition');
    }

    /**
     * DETECT SYSTEM PREFERENCE - Detecta preferencia del sistema
     */
    static detectSystemPreference() {
        if (!window.matchMedia) return this.DEFAULT_THEME;
        
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        return darkModeQuery.matches ? 'dark' : 'light';
    }

    /**
     * AUTO MODE - Modo automático basado en preferencias del sistema
     */
    static enableAutoMode() {
        if (!window.matchMedia) return;

        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const updateTheme = () => {
            const systemTheme = darkModeQuery.matches ? 'dark' : 'light';
            this.setTheme(systemTheme, { skipSave: true });
        };

        updateTheme();
        
        darkModeQuery.addEventListener('change', updateTheme);
        
        return () => {
            darkModeQuery.removeEventListener('change', updateTheme);
        };
    }

    /**
     * RESET - Resetea al tema por defecto
     */
    static reset() {
        this.setTheme(this.DEFAULT_THEME);
        return this.DEFAULT_THEME;
    }

    /**
     * CLEAR SAVED THEME - Elimina el tema guardado
     */
    static clearSavedTheme() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (error) {
            console.warn('No se pudo eliminar el tema de localStorage:', error);
        }
    }

    /**
     * IS VALID THEME - Verifica si un tema es válido
     */
    static isValidTheme(themeId) {
        return themeId === 'dark' || themeId === 'light';
    }

    /**
     * GET STATS - Estadísticas del servicio (para debug)
     */
    static getStats() {
        return {
            currentTheme: this.currentTheme,
            isDark: this.isDarkMode(),
            isLight: this.isLightMode(),
            savedTheme: this.getSavedTheme(),
            systemPreference: this.detectSystemPreference(),
            callbacksCount: this.callbacks.length,
            domTheme: this.getCurrentThemeFromDOM()
        };
    }
}

// ===== CLASE AUXILIAR SIMPLIFICADA =====

export class ThemeManager {
    constructor() {
        this.unsubscribe = null;
        this.initialized = false;
    }

    /**
     * Inicializa el manager
     */
    init() {
        if (this.initialized) return this;

        ThemeService.initialize();
        this.initialized = true;
        
        return this;
    }

    /**
     * Suscribirse a cambios de tema
     */
    subscribe(callback) {
        this.unsubscribe = ThemeService.onThemeChange(callback);
        return this.unsubscribe;
    }

    /**
     * Toggle entre dark y light
     */
    toggle() {
        return ThemeService.toggle();
    }

    /**
     * Establecer tema específico
     */
    setTheme(themeId) {
        return ThemeService.setTheme(themeId);
    }

    /**
     * Obtener tema actual
     */
    getCurrentTheme() {
        return ThemeService.getCurrentTheme();
    }

    /**
     * Verificaciones de estado
     */
    isDark() {
        return ThemeService.isDarkMode();
    }

    isLight() {
        return ThemeService.isLightMode();
    }

    /**
     * Habilitar modo automático del sistema
     */
    enableAutoMode() {
        return ThemeService.enableAutoMode();
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        this.initialized = false;
    }
}

export default ThemeService;