import { BaseRepository } from './BaseRepository.js';

/**
 * Repositorio para operaciones de autenticación
 * Conecta con los endpoints /auth del backend Spring Boot
 */
export class AuthRepository extends BaseRepository {

    /**
     * Login de usuario
     * POST /auth/login
     * @param {string} username - Username o email
     * @param {string} password - Contraseña en texto plano
     * @returns {Promise<Object>} Respuesta con token
     */
    static async login(username, password) {
        const loginData = {
            username: username.trim(),
            password: password
        };

        try {
            const response = await this.post('/auth/login', loginData);
            return response;
        } catch (error) {
            console.error('AuthRepository: Login failed:', error);
            throw error;
        }
    }

    /**
     * Registro de nuevo usuario
     * POST /auth/register
     * @param {Object} userData - Datos del usuario
     * @param {string} userData.username - Username (3-16 chars)
     * @param {string} userData.name - Nombre (3-16 chars)
     * @param {string} userData.surnames - Apellidos (3-32 chars)
     * @param {string} userData.email - Email válido
     * @param {string} userData.password - Contraseña en texto plano
     * @returns {Promise<Object>} Respuesta con token
     */
    static async register(userData) {
        // Validaciones básicas del lado cliente
        const registerData = {
            username: userData.username?.trim(),
            name: userData.name?.trim(),
            surnames: userData.surnames?.trim(),
            email: userData.email?.trim(),
            password: userData.password
        };

        // Validar datos requeridos
        const requiredFields = ['username', 'name', 'surnames', 'email', 'password'];
        for (const field of requiredFields) {
            if (!registerData[field]) {
                throw new Error(`Campo requerido: ${field}`);
            }
        }

        // Validar formato de email básico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(registerData.email)) {
            throw new Error('Formato de email inválido');
        }

        try {
            const response = await this.post('/auth/register', registerData);
            return response;
        } catch (error) {
            console.error('AuthRepository: Registration failed:', error);
            throw error;
        }
    }

    /**
     * Validación de token JWT
     * POST /auth/validate
     * @param {string} token - Token JWT (sin "Bearer ")
     * @returns {Promise<Object>} Datos del usuario
     */
    static async validateToken(token) {
        if (!token) {
            throw new Error('Token requerido');
        }

        // Limpiar el token si viene con "Bearer "
        const cleanToken = token.replace('Bearer ', '').trim();

        try {
            const response = await this.post('/auth/validate', cleanToken, {
                headers: {
                    'Content-Type': 'text/plain'
                }
            });
            return response;
        } catch (error) {
            console.error('AuthRepository: Token validation failed:', error);
            throw error;
        }
    }

    /**
     * Actualización de datos de usuario
     * POST /auth/update
     * @param {string} token - Token de autorización
     * @param {Object} userData - Datos a actualizar
     * @param {number} userData.id - ID del usuario (requerido)
     * @param {string} userData.username - Username
     * @param {string} userData.name - Nombre
     * @param {string} userData.surnames - Apellidos
     * @param {string} userData.email - Email
     * @param {string} [userData.password] - Nueva contraseña (opcional)
     * @returns {Promise<Object>} Datos del usuario actualizado
     */
    static async updateUser(token, userData) {
        if (!token) {
            throw new Error('Token de autorización requerido');
        }

        if (!userData.id) {
            throw new Error('ID de usuario requerido');
        }

        // Limpiar token si es necesario
        const cleanToken = token.replace('Bearer ', '').trim();

        const updateData = {
            id: userData.id,
            username: userData.username?.trim(),
            name: userData.name?.trim(),
            surnames: userData.surnames?.trim(),
            email: userData.email?.trim()
        };

        // Solo incluir password si se proporciona
        if (userData.password && userData.password.trim()) {
            updateData.password = userData.password;
        }

        try {
            const response = await this.post('/auth/update', updateData, {
                headers: this.getAuthHeaders(cleanToken)
            });
            return response;
        } catch (error) {
            console.error('AuthRepository: User update failed:', error);
            throw error;
        }
    }

    /**
     * Obtiene información del usuario actual por token
     * @param {string} token - Token de autorización
     * @returns {Promise<Object|null>} Datos del usuario o null
     */
    static async getCurrentUser(token) {
        try {
            return await this.validateToken(token);
        } catch (error) {
            console.error('AuthRepository: Error getting current user:', error);
            return null;
        }
    }

    /**
     * Verifica si un token es válido (método de conveniencia)
     * @param {string} token - Token a verificar
     * @returns {Promise<boolean>} true si el token es válido
     */
    static async isTokenValid(token) {
        try {
            const user = await this.validateToken(token);
            return !!user;
        } catch (error) {
            return false;
        }
    }

    /**
     * Actualiza solo la contraseña del usuario
     * @param {string} token - Token de autorización
     * @param {number} userId - ID del usuario
     * @param {string} newPassword - Nueva contraseña
     * @param {Object} currentUserData - Datos actuales del usuario
     * @returns {Promise<Object>} Usuario actualizado
     */
    static async updatePassword(token, userId, newPassword, currentUserData) {
        if (!currentUserData) {
            throw new Error('Datos del usuario actual requeridos');
        }

        const updateData = {
            id: userId,
            username: currentUserData.username,
            name: currentUserData.name,
            surnames: currentUserData.surnames,
            email: currentUserData.email,
            password: newPassword
        };

        return await this.updateUser(token, updateData);
    }

    /**
     * Health check específico para autenticación
     * @returns {Promise<Object>} Estado del servicio de auth
     */
    static async healthCheck() {
        try {
            // Intentar acceder a un endpoint público de auth
            const baseHealth = await super.healthCheck();
            
            return {
                ...baseHealth,
                service: 'AuthRepository',
                endpoints: {
                    login: '/auth/login',
                    register: '/auth/register',
                    validate: '/auth/validate',
                    update: '/auth/update'
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                service: 'AuthRepository',
                error: error.message
            };
        }
    }

    /**
     * Verifica la configuración del repositorio
     * @returns {Object} Estado de la configuración
     */
    static getConfig() {
        return {
            baseUrl: this.getBaseUrl(),
            endpoints: {
                login: '/auth/login',
                register: '/auth/register',
                validate: '/auth/validate',
                update: '/auth/update'
            },
            headers: this.getBaseHeaders()
        };
    }
}