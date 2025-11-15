// src/services/AuthService.js

import { parse, serialize } from 'cookie';
import { AuthRepository } from '../repositories/AuthRepository.js';

const COOKIE_NAME = 'admin_token';

/**
 * Servicio de autenticación actualizado para usar AuthRepository
 * Incluye manejo avanzado de rate limiting y retry logic
 */
export class AuthService {

    /**
     * Autentica un usuario con el backend Java
     * @param {string} username - Username o email
     * @param {string} password - Contraseña en texto plano
     * @returns {Promise<Object>} Respuesta de autenticación
     */
    static async login(username, password) {
        try {
            const response = await AuthRepository.login(username, password);

            if (response && response.token) {
                return {
                    token: response.token,
                    success: true
                };
            }

            return {
                success: false,
                error: 'Login failed - no token received'
            };

        } catch (error) {
            console.error('AuthService: Login failed:', error);
            return this.handleError(error, 'login');
        }
    }

    /**
     * Registra un nuevo usuario con el backend Java
     * @param {Object} userData - Datos del usuario
     * @param {string} userData.username - Username
     * @param {string} userData.name - Nombre
     * @param {string} userData.surnames - Apellidos
     * @param {string} userData.email - Email
     * @param {string} userData.password - Contraseña en texto plano
     * @returns {Promise<Object>} Respuesta del registro
     */
    static async register(userData) {
        try {
            const response = await AuthRepository.register(userData);

            if (response && response.token) {
                return {
                    token: response.token,
                    success: true
                };
            }

            return {
                success: false,
                error: 'Registration failed - no token received'
            };

        } catch (error) {
            console.error('AuthService: Registration failed:', error);
            return this.handleError(error, 'registro');
        }
    }

    /**
     * Valida un token JWT con el backend
     * @param {string} token - Token JWT (sin "Bearer ")
     * @returns {Promise<Object|null>} Datos del usuario o null si no es válido
     */
    static async validateToken(token) {
        try {
            const userData = await AuthRepository.validateToken(token);
            return userData || null;
        } catch (error) {
            console.error('AuthService: Token validation failed:', error);

            // Para validación de token, los rate limits son menos críticos
            if (error.status === 429) {
                console.warn('Rate limited during token validation');
            }

            return null;
        }
    }

    /**
     * Actualiza los datos del usuario
     * @param {string} token - Token de autorización
     * @param {Object} userData - Datos a actualizar
     * @returns {Promise<Object>} Respuesta de actualización
     */
    static async updateUser(token, userData) {
        try {
            if (!userData.id) {
                return {
                    success: false,
                    error: 'ID de usuario requerido'
                };
            }

            const response = await AuthRepository.updateUser(token, userData);

            return {
                success: true,
                user: response
            };

        } catch (error) {
            console.error('AuthService: User update failed:', error);
            return this.handleError(error, 'actualización');
        }
    }

    /**
     * Actualiza solo la contraseña del usuario
     * @param {string} token - Token de autorización
     * @param {number} userId - ID del usuario
     * @param {string} newPassword - Nueva contraseña en texto plano
     * @param {Object} currentUserData - Datos actuales del usuario
     * @returns {Promise<Object>} Respuesta de actualización
     */
    static async updatePassword(token, userId, newPassword, currentUserData) {
        try {
            if (!currentUserData) {
                return {
                    success: false,
                    error: 'Datos del usuario requeridos'
                };
            }

            const response = await AuthRepository.updatePassword(token, userId, newPassword, currentUserData);
            return response;

        } catch (error) {
            console.error('AuthService: Error updating password:', error);
            return this.handleError(error, 'cambio de contraseña');
        }
    }

    /**
     * Obtiene los datos del usuario actual por token
     * @param {string} token - Token del usuario
     * @returns {Promise<Object|null>} Usuario o null
     */
    static async getUserByToken(token) {
        try {
            return await AuthRepository.getCurrentUser(token);
        } catch (error) {
            console.error('AuthService: Error getting user by token:', error);
            return null;
        }
    }

    /**
     * Verifica si un token es válido
     * @param {string} token - Token a verificar
     * @returns {Promise<boolean>} true si el token es válido
     */
    static async isTokenValid(token) {
        try {
            return await AuthRepository.isTokenValid(token);
        } catch (error) {
            console.error('AuthService: Error checking token validity:', error);
            return false;
        }
    }

    // ==================== MANEJO DE COOKIES ====================

    /**
     * Crea una cookie de autenticación
     * @param {string} token - Token JWT
     * @returns {string} Cookie serializada
     */
    static createAuthCookie(token) {
        return serialize(COOKIE_NAME, token, {
            httpOnly: true,
            secure: import.meta.env.PROD,
            sameSite: 'strict',
            maxAge: 60 * 60 * 5, // 5 horas (coincide con JWT_TOKEN_VALIDITY)
            path: '/admin'
        });
    }

    /**
     * Crea una cookie para cerrar sesión
     * @returns {string} Cookie de logout serializada
     */
    static createLogoutCookie() {
        return serialize(COOKIE_NAME, '', {
            httpOnly: true,
            secure: import.meta.env.PROD,
            sameSite: 'strict',
            maxAge: 0,
            path: '/admin'
        });
    }

    /**
     * Obtiene los datos del usuario desde la request
     * @param {Request} request - Request object
     * @returns {Promise<Object|null>} Datos del usuario o null
     */
    static async getUserFromRequest(request) {
        try {
            const cookies = request.headers.get('cookie');
            if (!cookies) return null;

            const parsedCookies = parse(cookies);
            const token = parsedCookies[COOKIE_NAME];

            if (!token) return null;

            return await this.validateToken(token);
        } catch (error) {
            console.error('Error getting user from request:', error);
            return null;
        }
    }

    /**
     * Extrae el token del header Authorization
     * @param {string} authHeader - Header de autorización
     * @returns {string|null} Token limpio o null
     */
    static extractTokenFromHeader(authHeader) {
        if (!authHeader) return null;

        if (authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        return authHeader;
    }

    // ==================== RATE LIMITING Y RETRY LOGIC ====================

    /**
     * Implementa retry logic con backoff exponencial para rate limiting
     * @param {Function} operation - Función async a ejecutar
     * @param {Object} options - Opciones de retry
     * @returns {Promise<any>} Resultado de la operación
     */
    static async withRetry(operation, options = {}) {
        const {
            maxRetries = 2,
            baseDelay = 1000,
            maxDelay = 30000,
            onRetry = null
        } = options;

        let lastError = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;

                // No reintentar si no es rate limiting
                if (error.status !== 429) {
                    throw error;
                }

                // Si es el último intento, lanzar el error
                if (attempt === maxRetries) {
                    throw error;
                }

                // Calcular delay con backoff exponencial
                const retryAfter = this.extractRetryAfter(error);
                const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
                const delay = retryAfter ? retryAfter * 1000 : exponentialDelay;

                console.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);

                // Ejecutar callback si se proporciona
                if (onRetry) {
                    onRetry(attempt + 1, delay / 1000, retryAfter);
                }

                // Esperar antes del siguiente intento
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }

    /**
     * Login con retry automático en caso de rate limiting
     * @param {string} username - Username o email
     * @param {string} password - Contraseña
     * @param {Object} retryOptions - Opciones para retry logic
     * @returns {Promise<Object>} Respuesta de autenticación
     */
    static async loginWithRetry(username, password, retryOptions = {}) {
        return this.withRetry(
            () => this.login(username, password),
            retryOptions
        );
    }

    /**
     * Extrae el tiempo de retry del header Retry-After o del error
     * @param {Error} error - Error que puede contener información de rate limit
     * @returns {number|null} Segundos hasta el próximo intento o null
     */
    static extractRetryAfter(error) {
        try {
            // Intentar extraer de headers si están disponibles en error.details
            if (error.details && error.details.retryAfter) {
                return parseInt(error.details.retryAfter);
            }

            // Intentar extraer del mensaje de error
            if (error.message && error.message.includes('retry after')) {
                const match = error.message.match(/retry after (\d+)/i);
                if (match) {
                    return parseInt(match[1]);
                }
            }

            // Buscar en headers si están disponibles
            if (error.details && error.details.headers && error.details.headers['X-RateLimit-Reset-In']) {
                return parseInt(error.details.headers['X-RateLimit-Reset-In']);
            }

            // Valor por defecto para rate limiting
            return 60; // 1 minuto por defecto

        } catch (e) {
            console.warn('Could not extract retry-after value:', e);
            return 60;
        }
    }

    /**
     * Verifica si el último error fue por rate limiting
     * @param {Error} error - Error a verificar
     * @returns {boolean} True si es un error de rate limit
     */
    static isRateLimitError(error) {
        return error && error.status === 429;
    }

    /**
     * Calcula el tiempo restante hasta poder hacer otra petición
     * @param {number} retryAfter - Segundos de retry-after
     * @returns {string} Mensaje con el tiempo restante formateado
     */
    static formatRetryTime(retryAfter) {
        if (!retryAfter) return 'unos momentos';

        if (retryAfter < 60) {
            return `${retryAfter} segundos`;
        } else {
            const minutes = Math.ceil(retryAfter / 60);
            return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
        }
    }

    /**
     * Crea un mensaje de error amigable para rate limiting
     * @param {number} retryAfter - Segundos hasta el próximo intento
     * @param {string} action - Acción que fue limitada
     * @returns {string} Mensaje de error formateado
     */
    static createRateLimitMessage(retryAfter, action = 'esta acción') {
        const timeFormatted = this.formatRetryTime(retryAfter);
        return `Has excedido el límite de intentos para ${action}. Inténtalo de nuevo en ${timeFormatted}.`;
    }

    /**
     * Obtiene información sobre el estado del rate limit
     * @param {Error} error - Error de rate limit
     * @returns {Object} Información sobre el rate limit
     */
    static getRateLimitInfo(error) {
        const retryAfter = this.extractRetryAfter(error);

        return {
            limited: true,
            retryAfter: retryAfter,
            retryAfterFormatted: this.formatRetryTime(retryAfter),
            message: this.createRateLimitMessage(retryAfter),
            nextRetryTime: new Date(Date.now() + (retryAfter * 1000))
        };
    }

    /**
     * Maneja errores de forma unificada incluyendo rate limiting
     * @param {Error} error - Error a manejar
     * @param {string} context - Contexto de la operación (login, register, etc.)
     * @returns {Object} Respuesta formateada del error
     */
    static handleError(error, context = 'operación') {
        console.error(`AuthService: ${context} failed:`, error);

        // Rate limiting
        if (error.status === 429) {
            const rateLimitInfo = this.getRateLimitInfo(error);
            return {
                success: false,
                error: this.createRateLimitMessage(rateLimitInfo.retryAfter, context),
                rateLimited: true,
                retryAfter: rateLimitInfo.retryAfter,
                rateLimitInfo: rateLimitInfo
            };
        }

        // Otros errores HTTP específicos
        switch (error.status) {
            case 400:
                return {
                    success: false,
                    error: error.details?.message || 'Datos inválidos'
                };
            case 401:
                return {
                    success: false,
                    error: 'No autorizado o credenciales inválidas'
                };
            case 403:
                return {
                    success: false,
                    error: 'Acceso denegado'
                };
            case 404:
                return {
                    success: false,
                    error: 'Recurso no encontrado'
                };
            case 500:
                return {
                    success: false,
                    error: 'Error interno del servidor'
                };
            default:
                return {
                    success: false,
                    error: 'Error de conexión con el servidor'
                };
        }
    }

    // ==================== TOKEN UTILITIES ====================

    /**
     * Verifica si un token está expirado (aproximación - el backend valida realmente)
     * @param {string} token - Token JWT
     * @returns {boolean} True si probablemente está expirado
     */
    static isTokenLikelyExpired(token) {
        try {
            // Decodificar JWT sin verificar (solo para leer claims)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000; // Convertir a milisegundos
            const now = Date.now();

            // Agregar margen de 5 minutos para evitar race conditions
            return (exp - now) < (5 * 60 * 1000);
        } catch (error) {
            console.error('Error checking token expiration:', error);
            return true; // Si no se puede decodificar, asumir expirado
        }
    }

    /**
     * Obtiene información del payload del token (sin verificar)
     * @param {string} token - Token JWT
     * @returns {Object|null} Payload del token o null si es inválido
     */
    static getTokenPayload(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload;
        } catch (error) {
            console.error('Error parsing token payload:', error);
            return null;
        }
    }

    // ==================== HEALTH CHECK Y DIAGNOSTICS ====================

    /**
     * Verifica la salud del servicio de autenticación
     * @returns {Promise<Object>} Estado de salud
     */
    static async healthCheck() {
        try {
            const repoHealth = await AuthRepository.healthCheck();

            return {
                ...repoHealth,
                service: 'AuthService',
                cookieName: COOKIE_NAME,
                lastCheck: new Date().toISOString()
            };

        } catch (error) {
            console.error('AuthService: Health check failed:', error);
            return {
                status: 'unhealthy',
                service: 'AuthService',
                error: error.message,
                lastCheck: new Date().toISOString()
            };
        }
    }

    /**
     * Obtiene la configuración del servicio
     * @returns {Object} Configuración actual
     */
    static getConfig() {
        return {
            repository: AuthRepository.getConfig(),
            cookieName: COOKIE_NAME,
            cookiePath: '/admin',
            tokenLifetime: '5 hours',
            retryDefaults: {
                maxRetries: 2,
                baseDelay: 1000,
                maxDelay: 30000
            }
        };
    }

    /**
     * Limpia el estado local relacionado con rate limiting
     */
    static clearRateLimitState() {
        console.debug('AuthService: Rate limit state cleared / TODO');
    }

    /**
     * Genera un informe de diagnóstico
     * @param {string} token - Token a diagnosticar (opcional)
     * @returns {Promise<Object>} Informe de diagnóstico
     */
    static async diagnose(token = null) {
        const diagnosis = {
            service: 'AuthService',
            timestamp: new Date().toISOString(),
            health: await this.healthCheck(),
            config: this.getConfig()
        };

        if (token) {
            diagnosis.token = {
                provided: true,
                payload: this.getTokenPayload(token),
                likelyExpired: this.isTokenLikelyExpired(token),
                isValid: await this.isTokenValid(token)
            };
        } else {
            diagnosis.token = {
                provided: false
            };
        }

        return diagnosis;
    }

    // Agregar estos métodos a tu AuthService.js

    // ==================== TOKEN STORAGE ====================

    /**
     * Clave para localStorage
     */
    static TOKEN_STORAGE_KEY = 'auth_token';

    /**
     * Guarda el token en localStorage
     * @param {string} token - Token JWT a guardar
     */
    static setToken(token) {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(this.TOKEN_STORAGE_KEY, token);
            }
        } catch (error) {
            console.error('Error saving token to localStorage:', error);
        }
    }

    /**
     * Recupera el token de localStorage
     * @returns {string|null} Token guardado o null
     */
    static getToken() {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                return localStorage.getItem(this.TOKEN_STORAGE_KEY);
            }
            return null;
        } catch (error) {
            console.error('Error getting token from localStorage:', error);
            return null;
        }
    }

    /**
     * Elimina el token de localStorage
     */
    static removeToken() {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.removeItem(this.TOKEN_STORAGE_KEY);
            }
        } catch (error) {
            console.error('Error removing token from localStorage:', error);
        }
    }

    /**
     * Verifica si hay un token guardado
     * @returns {boolean} True si hay token guardado
     */
    static hasStoredToken() {
        const token = this.getToken();
        return token !== null && token !== undefined && token.length > 0;
    }

    // ==================== MÉTODOS ACTUALIZADOS ====================

    /**
     * Login actualizado - guarda el token automáticamente
     */
    static async login(username, password) {
        try {
            const response = await AuthRepository.login(username, password);

            if (response && response.token) {
                // Guardar token automáticamente
                this.setToken(response.token);

                return {
                    token: response.token,
                    success: true
                };
            }

            return {
                success: false,
                error: 'Login failed - no token received'
            };

        } catch (error) {
            console.error('AuthService: Login failed:', error);
            return this.handleError(error, 'login');
        }
    }

    /**
     * Logout - elimina el token
     */
    static logout() {
        this.removeToken();
        return {
            success: true,
            message: 'Logged out successfully'
        };
    }

    /**
     * Valida el token actual (el guardado o el proporcionado)
     * @param {string|null} token - Token específico o null para usar el guardado
     * @returns {Promise<Object|null>} Datos del usuario o null
     */
    static async validateCurrentToken(token = null) {
        try {
            // Usar el token proporcionado o el guardado
            const tokenToValidate = token || this.getToken();

            if (!tokenToValidate) {
                return null;
            }

            // Verificar si parece expirado antes de hacer la petición
            if (this.isTokenLikelyExpired(tokenToValidate)) {
                this.removeToken(); // Limpiar token expirado
                return null;
            }

            const userData = await AuthRepository.validateToken(tokenToValidate);

            if (!userData) {
                this.removeToken(); // Limpiar token inválido
                return null;
            }

            return userData;
        } catch (error) {
            console.error('AuthService: Token validation failed:', error);

            // Si el token es inválido, limpiarlo
            if (error.status === 401 || error.status === 403) {
                this.removeToken();
            }

            return null;
        }
    }

    /**
     * Verifica si hay una sesión válida
     * @returns {Promise<boolean>} True si hay sesión válida
     */
    static async hasValidSession() {
        try {
            const userData = await this.validateCurrentToken();
            return userData !== null;
        } catch (error) {
            console.error('Error checking session validity:', error);
            return false;
        }
    }

    /**
     * Obtiene los datos del usuario actual
     * @returns {Promise<Object|null>} Datos del usuario o null
     */
    static async getCurrentUser() {
        try {
            const token = this.getToken();
            if (!token) {
                return null;
            }

            return await this.validateCurrentToken(token);
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    /**
     * Actualiza usuario usando el token guardado
     * @param {Object} userData - Datos a actualizar
     * @returns {Promise<Object>} Respuesta de actualización
     */
    static async updateCurrentUser(userData) {
        try {
            const token = this.getToken();
            if (!token) {
                return {
                    success: false,
                    error: 'No hay sesión activa'
                };
            }

            return await this.updateUser(token, userData);
        } catch (error) {
            console.error('AuthService: User update failed:', error);
            return this.handleError(error, 'actualización');
        }
    }

    /**
     * Cambia la contraseña del usuario actual
     * @param {string} newPassword - Nueva contraseña
     * @returns {Promise<Object>} Respuesta del cambio
     */
    static async changeCurrentPassword(newPassword) {
        try {
            const token = this.getToken();
            if (!token) {
                return {
                    success: false,
                    error: 'No hay sesión activa'
                };
            }

            // Obtener datos actuales del usuario
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                return {
                    success: false,
                    error: 'No se pueden obtener los datos del usuario'
                };
            }

            return await this.updatePassword(token, currentUser.id, newPassword, currentUser);
        } catch (error) {
            console.error('AuthService: Password change failed:', error);
            return this.handleError(error, 'cambio de contraseña');
        }
    }
}

export default AuthService;