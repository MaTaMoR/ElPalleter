/**
 * Repository para manejar todas las llamadas de autenticación al backend Java Spring Boot
 * Reemplaza las consultas directas a Supabase con llamadas HTTP REST
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
     * Manejo centralizado de errores de la API
     * @param {Response} response - Respuesta del fetch
     */
    static async handleApiError(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            error.status = response.status;
            error.details = errorData;
            throw error;
        }
        return response;
    }

    /**
     * Realiza login del usuario
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
            return await response.json();

        } catch (error) {
            console.error('AuthRepository: Login failed:', error);
            throw error;
        }
    }

    /**
     * Registra un nuevo usuario
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
            return await response.json();

        } catch (error) {
            console.error('AuthRepository: Registration failed:', error);
            throw error;
        }
    }

    /**
     * Valida un token JWT
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
            throw error;
        }
    }

    /**
     * Actualiza los datos del usuario
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
                return {
                    status: 'healthy',
                    api: 'Java Spring Boot',
                    endpoint: this.API_BASE_URL,
                    timestamp: new Date().toISOString(),
                    details: data
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
}

export default AuthRepository;