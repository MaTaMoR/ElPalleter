import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';
import { AuthRepository } from '../repositories/AuthRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const COOKIE_NAME = 'admin_token';

export class AuthService {
    /**
     * Valida las credenciales de un usuario
     * @param {string} username - Username o email
     * @param {string} password - Contraseña en texto plano
     * @returns {Object|null} Usuario sin contraseña o null si no es válido
     */
    static async validateUser(username, password) {
        try {
            // Buscar usuario por username o email
            const user = await AuthRepository.findUserByIdentifier(username);

            if (!user) {
                return null;
            }

            // Verificar que el usuario esté activo
            if (!user.active) {
                return null;
            }

            // Verificar la contraseña
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return null;
            }

            // Actualizar último acceso (opcional, en background)
            this.updateLastAccess(user.id).catch(error => {
                console.error('Failed to update last access:', error);
            });

            // Retornar usuario sin la contraseña
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;

        } catch (error) {
            console.error('AuthService: Error validating user:', error);
            return null;
        }
    }

    /**
     * Genera un token JWT para el usuario
     * @param {Object} user - Datos del usuario
     * @returns {string} Token JWT
     */
    static generateToken(user) {
        return jwt.sign(
            {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
    }

    /**
     * Verifica y decodifica un token JWT
     * @param {string} token - Token JWT
     * @returns {Object|null} Datos del token o null si no es válido
     */
    static verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return null;
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
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 24 horas
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
            secure: process.env.NODE_ENV === 'production',
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
    static getUserFromRequest(request) {
        try {
            const cookies = request.headers.get('cookie');
            if (!cookies) return null;

            const parsedCookies = parse(cookies);
            const token = parsedCookies[COOKIE_NAME];

            if (!token) return null;

            return this.verifyToken(token);
        } catch (error) {
            console.error('Error getting user from request:', error);
            return null;
        }
    }

    /**
     * Actualiza el último acceso del usuario (método auxiliar)
     * @param {string} userId - ID del usuario
     */
    static async updateLastAccess(userId) {
        try {
            await AuthRepository.updateLastAccess(userId);
        } catch (error) {
            console.error('AuthService: Failed to update last access:', error);
            // No propagamos el error ya que es una operación opcional
        }
    }

    /**
     * Obtiene los datos completos del usuario por ID
     * @param {string} userId - ID del usuario
     * @returns {Object|null} Usuario completo o null
     */
    static async getUserById(userId) {
        try {
            const user = await AuthRepository.findUserById(userId);
            if (!user) return null;

            // Retornar usuario sin la contraseña
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;

        } catch (error) {
            console.error('AuthService: Error getting user by ID:', error);
            return null;
        }
    }

    /**
     * Verifica si un usuario existe y está activo
     * @param {string} identifier - Username o email
     * @returns {boolean} True si existe y está activo
     */
    static async userExists(identifier) {
        try {
            const user = await AuthRepository.findUserByIdentifier(identifier);
            return user && user.active;
        } catch (error) {
            console.error('AuthService: Error checking if user exists:', error);
            return false;
        }
    }

    /**
     * Crea un nuevo usuario administrador
     * @param {Object} userData - Datos del usuario
     * @param {string} userData.username - Username
     * @param {string} userData.email - Email
     * @param {string} userData.password - Contraseña en texto plano
     * @param {string} userData.role - Rol (opcional, default: 'admin')
     * @returns {Object} Usuario creado sin contraseña
     */
    static async createUser(userData) {
        try {
            // Verificar que username y email no existan
            const [usernameExists, emailExists] = await Promise.all([
                AuthRepository.usernameExists(userData.username),
                AuthRepository.emailExists(userData.email)
            ]);

            if (usernameExists) {
                throw new Error('Username already exists');
            }

            if (emailExists) {
                throw new Error('Email already exists');
            }

            // Hashear la contraseña
            const hashedPassword = await bcrypt.hash(userData.password, 12);

            // Preparar datos del usuario
            const userToCreate = {
                id: userData.id || this.generateUserId(),
                username: userData.username,
                email: userData.email,
                password: hashedPassword,
                role: userData.role || 'admin',
                active: userData.active !== undefined ? userData.active : true
            };

            // Crear usuario
            const createdUser = await AuthRepository.createUser(userToCreate);

            // Retornar usuario sin contraseña
            const { password: _, ...userWithoutPassword } = createdUser;
            return userWithoutPassword;

        } catch (error) {
            console.error('AuthService: Error creating user:', error);
            throw error;
        }
    }

    /**
     * Actualiza la contraseña de un usuario
     * @param {string} userId - ID del usuario
     * @param {string} newPassword - Nueva contraseña en texto plano
     * @returns {Object} Usuario actualizado sin contraseña
     */
    static async updatePassword(userId, newPassword) {
        try {
            // Hashear la nueva contraseña
            const hashedPassword = await bcrypt.hash(newPassword, 12);

            // Actualizar en la base de datos
            const updatedUser = await AuthRepository.updatePassword(userId, hashedPassword);

            // Retornar usuario sin contraseña
            const { password: _, ...userWithoutPassword } = updatedUser;
            return userWithoutPassword;

        } catch (error) {
            console.error('AuthService: Error updating password:', error);
            throw error;
        }
    }

    /**
     * Desactiva un usuario
     * @param {string} userId - ID del usuario
     * @returns {Object} Usuario desactivado
     */
    static async deactivateUser(userId) {
        try {
            const updatedUser = await AuthRepository.deactivateUser(userId);
            const { password: _, ...userWithoutPassword } = updatedUser;
            return userWithoutPassword;
        } catch (error) {
            console.error('AuthService: Error deactivating user:', error);
            throw error;
        }
    }

    /**
     * Activa un usuario
     * @param {string} userId - ID del usuario
     * @returns {Object} Usuario activado
     */
    static async activateUser(userId) {
        try {
            const updatedUser = await AuthRepository.activateUser(userId);
            const { password: _, ...userWithoutPassword } = updatedUser;
            return userWithoutPassword;
        } catch (error) {
            console.error('AuthService: Error activating user:', error);
            throw error;
        }
    }

    /**
     * Obtiene todos los usuarios activos
     * @returns {Array} Lista de usuarios activos sin contraseñas
     */
    static async getAllActiveUsers() {
        try {
            const users = await AuthRepository.getAllActiveUsers();

            // Remover contraseñas de todos los usuarios
            return users.map(user => {
                const { password: _, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });

        } catch (error) {
            console.error('AuthService: Error getting active users:', error);
            throw error;
        }
    }

    /**
     * Genera un ID único para usuario
     * @returns {string} ID único
     */
    static generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Verifica la salud del servicio de autenticación
     * @returns {Object} Estado de salud
     */
    static async healthCheck() {
        try {
            const repoHealth = await AuthRepository.healthCheck();

            return {
                status: repoHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
                service: 'AuthService',
                repository: repoHealth,
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
     * Obtiene estadísticas del sistema de autenticación
     * @returns {Object} Estadísticas
     */
    static async getStats() {
        try {
            return await AuthRepository.getUserStats();
        } catch (error) {
            console.error('AuthService: Error getting stats:', error);
            throw error;
        }
    }
}