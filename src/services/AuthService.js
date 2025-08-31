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
            return null;
        }
    }

    /**
     * Actualiza los datos del usuario
     * @param {string} token - Token de autorización
     * @param {Object} userData - Datos a actualizar
     * @param {number} userData.id - ID del usuario (requerido)
     * @param {string} userData.username - Username (no se puede cambiar según backend)
     * @param {string} userData.name - Nombre
     * @param {string} userData.surnames - Apellidos
     * @param {string} userData.email - Email (no se puede cambiar según backend)
     * @param {string} [userData.password] - Nueva contraseña en texto plano (opcional)
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
}