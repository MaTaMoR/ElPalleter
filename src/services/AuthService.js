import { serialize, parse } from 'cookie';
import { AuthRepository } from '../repositories/AuthRepository.js';

const COOKIE_NAME = 'admin_token';

export class AuthService {
    /**
     * Autentica un usuario con el backend Java
     * @param {string} username - Username o email
     * @param {string} password - Contraseña en texto plano
     * @returns {Object} Respuesta de autenticación
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
            
            // Manejo específico de rate limiting
            if (error.status === 429) {
                const retryAfter = this.extractRetryAfter(error);
                return {
                    success: false,
                    error: 'Demasiados intentos de login. Inténtalo de nuevo más tarde.',
                    rateLimited: true,
                    retryAfter: retryAfter
                };
            }
            
            // Manejo de errores específicos del backend
            if (error.status === 400) {
                return {
                    success: false,
                    error: 'Credenciales inválidas'
                };
            } else if (error.status === 401) {
                return {
                    success: false,
                    error: 'No autorizado'
                };
            }
            
            return {
                success: false,
                error: 'Error de conexión con el servidor'
            };
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
     * @returns {Object} Respuesta del registro
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
            
            // Manejo específico de rate limiting para registro
            if (error.status === 429) {
                const retryAfter = this.extractRetryAfter(error);
                return {
                    success: false,
                    error: 'Demasiados intentos de registro. Inténtalo de nuevo más tarde.',
                    rateLimited: true,
                    retryAfter: retryAfter
                };
            }
            
            if (error.status === 400) {
                const errorMessage = error.details?.message || 'Usuario ya existe o datos inválidos';
                return {
                    success: false,
                    error: errorMessage
                };
            }
            
            return {
                success: false,
                error: 'Error de conexión con el servidor'
            };
        }
    }

    /**
     * Valida un token JWT con el backend
     * @param {string} token - Token JWT (sin "Bearer ")
     * @returns {Object|null} Datos del usuario o null si no es válido
     */
    static async validateToken(token) {
        try {
            // Limpiar el token si viene con "Bearer "
            const cleanToken = token.replace('Bearer ', '');
            const userData = await AuthRepository.validateToken(cleanToken);
            
            return userData || null;

        } catch (error) {
            console.error('AuthService: Token validation failed:', error);
            
            // Para validación de token, los rate limits son menos críticos
            // porque normalmente se hace en middleware, no en formularios
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
     * @returns {Object} Respuesta de actualización
     */
    static async updateUser(token, userData) {
        try {
            // Validación de datos requeridos
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
            
            // Manejo de rate limiting para actualizaciones
            if (error.status === 429) {
                const retryAfter = this.extractRetryAfter(error);
                return {
                    success: false,
                    error: 'Demasiadas solicitudes de actualización. Inténtalo de nuevo más tarde.',
                    rateLimited: true,
                    retryAfter: retryAfter
                };
            }
            
            if (error.status === 400) {
                return {
                    success: false,
                    error: 'Datos de actualización inválidos o usuario no encontrado'
                };
            } else if (error.status === 401) {
                return {
                    success: false,
                    error: 'Token inválido, expirado o no autorizado'
                };
            }
            
            return {
                success: false,
                error: 'Error de conexión con el servidor'
            };
        }
    }

    /**
     * Extrae el tiempo de retry del header Retry-After o del error
     * @param {Error} error - Error que puede contener información de rate limit
     * @returns {number|null} Segundos hasta el próximo intento o null
     */
    static extractRetryAfter(error) {
        try {
            // Intentar extraer de headers si están disponibles
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
            
            // Valor por defecto para rate limiting
            return 60; // 1 minuto por defecto
            
        } catch (e) {
            console.warn('Could not extract retry-after value:', e);
            return 60;
        }
    }

    /**
     * Implementa retry logic con backoff exponencial para rate limiting
     * @param {Function} operation - Función async a ejecutar
     * @param {Object} options - Opciones de retry
     * @param {number} options.maxRetries - Máximo número de reintentos (default: 3)
     * @param {number} options.baseDelay - Delay base en ms (default: 1000)
     * @param {number} options.maxDelay - Delay máximo en ms (default: 30000)
     * @returns {Object} Resultado de la operación
     */
    static async withRetry(operation, options = {}) {
        const {
            maxRetries = 3,
            baseDelay = 1000,
            maxDelay = 30000
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
     * @returns {Object} Respuesta de autenticación
     */
    static async loginWithRetry(username, password, retryOptions = {}) {
        return this.withRetry(
            () => this.login(username, password),
            retryOptions
        );
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
     * Crea una cookie de autenticación
     * @param {string} token - Token JWT
     * @returns {string} Cookie serializada
     */
    static createAuthCookie(token) {
        return serialize(COOKIE_NAME, token, {
            httpOnly: true,
            secure: import.meta.env.PROD, // Secure en producción
            sameSite: 'strict',
            maxAge: 60 * 60 * 5, // 5 horas (coincide con JWT_TOKEN_VALIDITY del backend)
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
     * @returns {Object|null} Datos del usuario o null
     */
    static async getUserFromRequest(request) {
        try {
            const cookies = request.headers.get('cookie');
            if (!cookies) return null;

            const parsedCookies = parse(cookies);
            const token = parsedCookies[COOKIE_NAME];

            if (!token) return null;

            // Validar el token con el backend
            return await this.validateToken(token);
            
        } catch (error) {
            console.error('Error getting user from request:', error);
            return null;
        }
    }

    /**
     * Obtiene los datos del usuario por token
     * @param {string} token - Token del usuario
     * @returns {Object|null} Usuario o null
     */
    static async getUserByToken(token) {
        try {
            return await this.validateToken(token);
        } catch (error) {
            console.error('AuthService: Error getting user by token:', error);
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

    /**
     * Verifica la salud del servicio de autenticación
     * @returns {Object} Estado de salud
     */
    static async healthCheck() {
        try {
            const backendHealth = await AuthRepository.healthCheck();

            return {
                status: backendHealth.status,
                service: 'AuthService',
                backend: backendHealth,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('AuthService: Health check failed:', error);
            return {
                status: 'unhealthy',
                service: 'AuthService',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Actualiza la contraseña de un usuario
     * @param {string} token - Token de autorización
     * @param {number} userId - ID del usuario
     * @param {string} newPassword - Nueva contraseña en texto plano
     * @param {Object} currentUserData - Datos actuales del usuario (para mantener username/email)
     * @returns {Object} Respuesta de actualización
     */
    static async updatePassword(token, userId, newPassword, currentUserData) {
        try {
            if (!currentUserData) {
                return {
                    success: false,
                    error: 'Datos del usuario requeridos'
                };
            }

            const updateData = {
                id: userId,
                username: currentUserData.username,
                name: currentUserData.name,
                surnames: currentUserData.surnames,
                email: currentUserData.email,
                password: newPassword // TEXTO PLANO - el backend hashea
            };

            const response = await this.updateUser(token, updateData);
            return response;

        } catch (error) {
            console.error('AuthService: Error updating password:', error);
            return {
                success: false,
                error: 'Error actualizando contraseña'
            };
        }
    }

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

    // ==================== NUEVOS MÉTODOS PARA RATE LIMITING ====================

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
            if (error.details && error.details.headers && error.details.headers['retry-after']) {
                return parseInt(error.details.headers['retry-after']);
            }
            
            // Valor por defecto para rate limiting
            return 60; // 1 minuto por defecto
            
        } catch (e) {
            console.warn('Could not extract retry-after value:', e);
            return 60;
        }
    }

    /**
     * Implementa retry logic con backoff exponencial para rate limiting
     * @param {Function} operation - Función async a ejecutar
     * @param {Object} options - Opciones de retry
     * @param {number} options.maxRetries - Máximo número de reintentos (default: 2)
     * @param {number} options.baseDelay - Delay base en ms (default: 1000)
     * @param {number} options.maxDelay - Delay máximo en ms (default: 30000)
     * @param {Function} options.onRetry - Callback ejecutado en cada retry
     * @returns {Object} Resultado de la operación
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
     * @returns {Object} Respuesta de autenticación
     */
    static async loginWithRetry(username, password, retryOptions = {}) {
        return this.withRetry(
            () => this.login(username, password),
            retryOptions
        );
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
     * @param {string} action - Acción que fue limitada (login, register, etc.)
     * @returns {string} Mensaje de error formateado
     */
    static createRateLimitMessage(retryAfter, action = 'esta acción') {
        const timeFormatted = this.formatRetryTime(retryAfter);
        return `Has excedido el límite de intentos para ${action}. Inténtalo de nuevo en ${timeFormatted}.`;
    }

    /**
     * Obtiene información sobre el estado del rate limit (si está disponible)
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

    /**
     * Limpia el estado local relacionado con rate limiting
     * Útil cuando se cambia de página o se resetea el estado
     */
    static clearRateLimitState() {
        // Si guardas algún estado de rate limiting en localStorage/sessionStorage
        // (aunque en este caso no lo usamos), aquí lo limpiarías
        console.log('Rate limit state cleared');
    }
}