/**
 * Repository para manejar todas las llamadas de autenticación al backend Java Spring Boot
 * Reemplaza las consultas directas a Supabase con llamadas HTTP REST
 * Incluye manejo completo de Rate Limiting
 */
export class AuthRepository {
    
    // Configuración base del API
    static API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    static AUTH_ENDPOINT = `${this.API_BASE_URL}/auth`;

    /**
     * Configuración por defecto para las peticiones
     */
    static getDefaultHeaders() {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Manejo centralizado de errores de la API con información de rate limiting
     * @param {Response} response - Respuesta del fetch
     */
    static async handleApiError(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // Extraer headers importantes para rate limiting
            const headers = {};
            for (const [key, value] of response.headers.entries()) {
                headers[key.toLowerCase()] = value;
            }

            const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            error.status = response.status;
            error.details = {
                ...errorData,
                headers: headers,
                // Extraer información específica de rate limiting
                retryAfter: headers['retry-after'] || headers['x-retry-after'],
                rateLimitRemaining: headers['x-ratelimit-remaining'],
                rateLimitLimit: headers['x-ratelimit-limit'],
                rateLimitReset: headers['x-ratelimit-reset'],
                rateLimitResetTime: headers['x-ratelimit-reset-time'],
                // Headers adicionales que algunos backends usan
                rateLimitWindow: headers['x-ratelimit-window'],
                rateLimitType: headers['x-ratelimit-type']
            };

            // Log adicional para debugging de rate limits
            if (response.status === 429) {
                console.warn('Rate limit detected:', {
                    status: response.status,
                    retryAfter: error.details.retryAfter,
                    remaining: error.details.rateLimitRemaining,
                    limit: error.details.rateLimitLimit,
                    resetTime: error.details.rateLimitResetTime,
                    headers: headers
                });
            }

            throw error;
        }
        return response;
    }

    /**
     * Realiza login del usuario con manejo de rate limiting
     * @param {string} username - Username o email
     * @param {string} password - Contraseña en texto plano
     * @returns {Object} Respuesta con token
     */
    static async login(username, password) {
        try {
            const response = await fetch(`${this.AUTH_ENDPOINT}/login`, {
                method: 'POST',
                headers: this.getDefaultHeaders(),
                body: JSON.stringify({
                    username,
                    password // TEXTO PLANO - el backend se encarga del hashing
                })
            });

            await this.handleApiError(response);
            const result = await response.json();

            // Agregar información de rate limiting exitosa si está disponible
            const headers = {};
            for (const [key, value] of response.headers.entries()) {
                headers[key.toLowerCase()] = value;
            }

            return {
                ...result,
                rateLimitInfo: {
                    remaining: headers['x-ratelimit-remaining'],
                    limit: headers['x-ratelimit-limit'],
                    resetTime: headers['x-ratelimit-reset-time'],
                    window: headers['x-ratelimit-window']
                }
            };

        } catch (error) {
            console.error('AuthRepository: Login failed:', error);
            throw error;
        }
    }

    /**
     * Registra un nuevo usuario con manejo de rate limiting
     * @param {Object} userData - Datos del usuario
     * @param {string} userData.username - Username
     * @param {string} userData.name - Nombre
     * @param {string} userData.surnames - Apellidos
     * @param {string} userData.email - Email
     * @param {string} userData.password - Contraseña en texto plano
     * @returns {Object} Respuesta con token
     */
    static async register(userData) {
        try {
            const response = await fetch(`${this.AUTH_ENDPOINT}/register`, {
                method: 'POST',
                headers: this.getDefaultHeaders(),
                body: JSON.stringify({
                    username: userData.username,
                    name: userData.name,
                    surnames: userData.surnames,
                    email: userData.email,
                    password: userData.password // TEXTO PLANO - el backend se encarga del hashing
                })
            });

            await this.handleApiError(response);
            const result = await response.json();

            // Agregar información de rate limiting
            const headers = {};
            for (const [key, value] of response.headers.entries()) {
                headers[key.toLowerCase()] = value;
            }

            return {
                ...result,
                rateLimitInfo: {
                    remaining: headers['x-ratelimit-remaining'],
                    limit: headers['x-ratelimit-limit'],
                    resetTime: headers['x-ratelimit-reset-time']
                }
            };

        } catch (error) {
            console.error('AuthRepository: Registration failed:', error);
            throw error;
        }
    }

    /**
     * Valida un token JWT con manejo de rate limiting
     * @param {string} token - Token JWT a validar (sin "Bearer ")
     * @returns {Object} Datos del usuario
     */
    static async validateToken(token) {
        try {
            const response = await fetch(`${this.AUTH_ENDPOINT}/validate`, {
                method: 'POST',
                headers: {
                    ...this.getDefaultHeaders(),
                    // El endpoint validate recibe el token en el body, no en header
                },
                body: JSON.stringify(token) // Solo el token, sin "Bearer "
            });

            await this.handleApiError(response);
            return await response.json();

        } catch (error) {
            console.error('AuthRepository: Token validation failed:', error);
            
            // Para token validation, rate limiting es menos crítico
            // ya que normalmente se hace en middleware
            if (error.status === 429) {
                console.warn('Token validation rate limited:', error.details);
            }
            
            throw error;
        }
    }

    /**
     * Actualiza los datos del usuario con manejo de rate limiting
     * @param {string} token - Token de autorización (debe incluir "Bearer ")
     * @param {Object} userData - Datos a actualizar
     * @returns {Object} Usuario actualizado
     */
    static async updateUser(token, userData) {
        try {
            const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            
            const response = await fetch(`${this.AUTH_ENDPOINT}/update`, {
                method: 'POST',
                headers: {
                    ...this.getDefaultHeaders(),
                    'Authorization': authHeader
                },
                body: JSON.stringify({
                    id: userData.id,
                    username: userData.username,
                    name: userData.name,
                    surnames: userData.surnames,
                    email: userData.email,
                    password: userData.password || null // TEXTO PLANO si se proporciona
                })
            });

            await this.handleApiError(response);
            return await response.json();

        } catch (error) {
            console.error('AuthRepository: User update failed:', error);
            throw error;
        }
    }

    /**
     * Verifica la salud de la conexión con el backend
     * @returns {Object} Estado de salud
     */
    static async healthCheck() {
        try {
            // Intentamos hacer una llamada simple para verificar conectividad
            const response = await fetch(`${this.API_BASE_URL}/actuator/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            }).catch(() => {
                // Si /actuator/health no existe, intentamos con el endpoint base
                return fetch(this.API_BASE_URL, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
            });

            if (response.ok) {
                const data = await response.json().catch(() => ({}));
                
                // Extraer información de rate limiting del health check si está disponible
                const headers = {};
                for (const [key, value] of response.headers.entries()) {
                    headers[key.toLowerCase()] = value;
                }

                return {
                    status: 'healthy',
                    api: 'Java Spring Boot',
                    endpoint: this.API_BASE_URL,
                    timestamp: new Date().toISOString(),
                    details: data,
                    rateLimitInfo: {
                        remaining: headers['x-ratelimit-remaining'],
                        limit: headers['x-ratelimit-limit'],
                        resetTime: headers['x-ratelimit-reset-time']
                    }
                };
            } else {
                throw new Error(`API health check failed: ${response.status}`);
            }

        } catch (error) {
            console.error('AuthRepository: Health check failed:', error);
            return {
                status: 'unhealthy',
                api: 'Java Spring Boot',
                endpoint: this.API_BASE_URL,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Realiza una petición con información extendida de rate limiting
     * @param {string} url - URL completa del endpoint
     * @param {Object} options - Opciones de fetch
     * @returns {Object} Respuesta con información de rate limiting
     */
    static async fetchWithRateLimitInfo(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.getDefaultHeaders(),
                    ...options.headers
                }
            });

            // Extraer información de rate limiting antes de procesar errores
            const rateLimitHeaders = this.extractRateLimitHeaders(response);

            await this.handleApiError(response);
            const data = await response.json();

            return {
                data,
                rateLimitInfo: rateLimitHeaders,
                success: true
            };

        } catch (error) {
            // Agregar información de rate limiting al error
            if (error.details && error.details.headers) {
                error.rateLimitInfo = this.extractRateLimitHeaders({ headers: new Map(Object.entries(error.details.headers)) });
            }
            throw error;
        }
    }

    /**
     * Extrae headers relacionados con rate limiting
     * @param {Response} response - Respuesta HTTP
     * @returns {Object} Información de rate limiting
     */
    static extractRateLimitHeaders(response) {
        const headers = {};
        
        if (response.headers) {
            for (const [key, value] of response.headers.entries()) {
                const lowerKey = key.toLowerCase();
                if (lowerKey.includes('ratelimit') || lowerKey.includes('retry')) {
                    headers[lowerKey] = value;
                }
            }
        }

        return {
            remaining: headers['x-ratelimit-remaining'] || headers['x-rate-limit-remaining'],
            limit: headers['x-ratelimit-limit'] || headers['x-rate-limit-limit'],
            reset: headers['x-ratelimit-reset'] || headers['x-rate-limit-reset'],
            resetTime: headers['x-ratelimit-reset-time'] || headers['x-rate-limit-reset-time'],
            retryAfter: headers['retry-after'],
            window: headers['x-ratelimit-window'] || headers['x-rate-limit-window'],
            type: headers['x-ratelimit-type'] || headers['x-rate-limit-type'],
            // Información adicional que algunos backends proporcionan
            policy: headers['x-ratelimit-policy'],
            scope: headers['x-ratelimit-scope']
        };
    }

    /**
     * Verifica si estamos cerca del límite de rate limiting
     * @param {Object} rateLimitInfo - Información de rate limiting
     * @param {number} threshold - Umbral de advertencia (default: 5)
     * @returns {boolean} True si estamos cerca del límite
     */
    static isNearRateLimit(rateLimitInfo, threshold = 5) {
        if (!rateLimitInfo || !rateLimitInfo.remaining || !rateLimitInfo.limit) {
            return false;
        }

        const remaining = parseInt(rateLimitInfo.remaining);
        const limit = parseInt(rateLimitInfo.limit);

        return remaining <= threshold;
    }

    /**
     * Calcula el tiempo hasta el reset del rate limit
     * @param {Object} rateLimitInfo - Información de rate limiting
     * @returns {number|null} Segundos hasta el reset o null
     */
    static getTimeUntilReset(rateLimitInfo) {
        if (!rateLimitInfo) return null;

        // Priorizar resetTime si está disponible
        if (rateLimitInfo.resetTime) {
            const resetTime = new Date(rateLimitInfo.resetTime).getTime();
            const now = Date.now();
            return Math.max(0, Math.ceil((resetTime - now) / 1000));
        }

        // Usar reset timestamp si está disponible
        if (rateLimitInfo.reset) {
            const resetTimestamp = parseInt(rateLimitInfo.reset);
            const now = Math.floor(Date.now() / 1000);
            return Math.max(0, resetTimestamp - now);
        }

        // Usar retryAfter como fallback
        if (rateLimitInfo.retryAfter) {
            return parseInt(rateLimitInfo.retryAfter);
        }

        return null;
    }

    /**
     * Crea un resumen legible del estado de rate limiting
     * @param {Object} rateLimitInfo - Información de rate limiting
     * @returns {Object} Resumen del estado
     */
    static getRateLimitStatus(rateLimitInfo) {
        if (!rateLimitInfo) {
            return {
                hasInfo: false,
                message: 'Información de rate limiting no disponible'
            };
        }

        const remaining = parseInt(rateLimitInfo.remaining) || 0;
        const limit = parseInt(rateLimitInfo.limit) || 0;
        const timeUntilReset = this.getTimeUntilReset(rateLimitInfo);

        return {
            hasInfo: true,
            remaining: remaining,
            limit: limit,
            percentUsed: limit > 0 ? Math.round(((limit - remaining) / limit) * 100) : 0,
            timeUntilReset: timeUntilReset,
            timeUntilResetFormatted: timeUntilReset ? this.formatDuration(timeUntilReset) : null,
            isNearLimit: this.isNearRateLimit(rateLimitInfo),
            message: this.createRateLimitStatusMessage(remaining, limit, timeUntilReset)
        };
    }

    /**
     * Formatea una duración en segundos a un string legible
     * @param {number} seconds - Segundos
     * @returns {string} Duración formateada
     */
    static formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds} segundos`;
        } else if (seconds < 3600) {
            const minutes = Math.ceil(seconds / 60);
            return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
        } else {
            const hours = Math.ceil(seconds / 3600);
            return `${hours} hora${hours > 1 ? 's' : ''}`;
        }
    }

    /**
     * Crea un mensaje de estado para rate limiting
     * @param {number} remaining - Requests restantes
     * @param {number} limit - Límite total
     * @param {number} timeUntilReset - Tiempo hasta reset en segundos
     * @returns {string} Mensaje formateado
     */
    static createRateLimitStatusMessage(remaining, limit, timeUntilReset) {
        if (limit > 0) {
            const resetInfo = timeUntilReset ? ` (se reinicia en ${this.formatDuration(timeUntilReset)})` : '';
            return `${remaining}/${limit} intentos restantes${resetInfo}`;
        }
        return 'Información de límites no disponible';
    }

    /**
     * Middleware para agregar headers de identificación del cliente (opcional)
     * Útil si el backend necesita identificar el cliente para rate limiting más específico
     * @param {Object} headers - Headers existentes
     * @param {Object} clientInfo - Información del cliente
     * @returns {Object} Headers actualizados
     */
    static addClientIdentificationHeaders(headers = {}, clientInfo = {}) {
        const identificationHeaders = {
            ...headers
        };

        // Agregar información del cliente si está disponible
        if (clientInfo.userAgent) {
            identificationHeaders['X-Client-User-Agent'] = clientInfo.userAgent;
        }

        if (clientInfo.clientId) {
            identificationHeaders['X-Client-ID'] = clientInfo.clientId;
        }

        if (clientInfo.sessionId) {
            identificationHeaders['X-Session-ID'] = clientInfo.sessionId;
        }

        // Agregar timestamp para debugging
        identificationHeaders['X-Client-Timestamp'] = new Date().toISOString();

        return identificationHeaders;
    }

    /**
     * Verifica si el backend soporta rate limiting basándose en los headers
     * @returns {boolean} True si detecta soporte de rate limiting
     */
    static async checkRateLimitSupport() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/actuator/health`, {
                method: 'HEAD', // Solo headers, sin body
                headers: {
                    'Accept': 'application/json'
                }
            });

            const headers = {};
            for (const [key, value] of response.headers.entries()) {
                headers[key.toLowerCase()] = value;
            }

            // Buscar headers que indiquen rate limiting
            const hasRateLimitHeaders = Object.keys(headers).some(key => 
                key.includes('ratelimit') || key.includes('rate-limit')
            );

            return {
                supported: hasRateLimitHeaders,
                headers: headers,
                detectedHeaders: Object.keys(headers).filter(key => 
                    key.includes('ratelimit') || key.includes('rate-limit') || key.includes('retry')
                )
            };

        } catch (error) {
            console.error('Error checking rate limit support:', error);
            return {
                supported: false,
                error: error.message
            };
        }
    }

    /**
     * Verifica la salud de la conexión con el backend incluyendo info de rate limiting
     * @returns {Object} Estado de salud
     */
    static async healthCheck() {
        try {
            // Verificar soporte de rate limiting
            const rateLimitSupport = await this.checkRateLimitSupport();

            // Intentamos hacer una llamada simple para verificar conectividad
            const response = await fetch(`${this.API_BASE_URL}/actuator/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            }).catch(() => {
                // Si /actuator/health no existe, intentamos con el endpoint base
                return fetch(this.API_BASE_URL, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
            });

            if (response.ok) {
                const data = await response.json().catch(() => ({}));
                
                // Extraer información de rate limiting del health check
                const rateLimitInfo = this.extractRateLimitHeaders(response);

                return {
                    status: 'healthy',
                    api: 'Java Spring Boot',
                    endpoint: this.API_BASE_URL,
                    timestamp: new Date().toISOString(),
                    details: data,
                    rateLimitSupport: rateLimitSupport,
                    currentRateLimitStatus: this.getRateLimitStatus(rateLimitInfo)
                };
            } else {
                throw new Error(`API health check failed: ${response.status}`);
            }

        } catch (error) {
            console.error('AuthRepository: Health check failed:', error);
            return {
                status: 'unhealthy',
                api: 'Java Spring Boot',
                endpoint: this.API_BASE_URL,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Método utilitario para hacer peticiones con manejo automático de rate limiting
     * @param {string} endpoint - Endpoint relativo (ej: '/login')
     * @param {Object} options - Opciones de fetch
     * @param {Object} rateLimitOptions - Opciones específicas de rate limiting
     * @returns {Object} Respuesta con información de rate limiting
     */
    static async authenticatedRequest(endpoint, options = {}, rateLimitOptions = {}) {
        const {
            logRateLimit = true,
            throwOnRateLimit = true
        } = rateLimitOptions;

        try {
            const url = `${this.AUTH_ENDPOINT}${endpoint}`;
            return await this.fetchWithRateLimitInfo(url, options);

        } catch (error) {
            if (error.status === 429 && logRateLimit) {
                const rateLimitStatus = this.getRateLimitStatus(error.rateLimitInfo);
                console.warn('Rate limit hit:', {
                    endpoint,
                    status: rateLimitStatus,
                    error: error.message
                });
            }

            if (error.status === 429 && !throwOnRateLimit) {
                return {
                    success: false,
                    rateLimited: true,
                    error: error,
                    rateLimitInfo: error.rateLimitInfo
                };
            }

            throw error;
        }
    }
}

export default AuthRepository;