import { DatabaseRepository } from './DatabaseRepository.js';

/**
 * Repository para manejar todas las consultas relacionadas con autenticación
 * Actúa como capa de abstracción entre AuthService y la base de datos
 */
export class AuthRepository {
    
    /**
     * Busca un usuario por username o email
     * USAR SOLO PARA AUTENTICACIÓN - Usa service client para bypass RLS
     * @param {string} identifier - Username o email del usuario
     * @returns {Object|null} Usuario encontrado o null
     */
    static async findUserByIdentifier(identifier) {
        try {
            // Usar service client para bypass RLS durante autenticación
            const client = DatabaseRepository.getServiceClient();
            
            const { data, error } = await client
                .from('admin_users')
                .select('*')
                .or(`username.eq.${identifier},email.eq.${identifier}`)
                .eq('active', true)
                .limit(1)
                .single();

            if (error) {
                // Si no encuentra el usuario, Supabase retorna error
                if (error.code === 'PGRST116') {
                    return null;
                }
                console.error('AuthRepository: Error finding user:', error);
                throw new Error(`Database error: ${error.message}`);
            }

            return data;

        } catch (error) {
            // Si es el error de "no encontrado", retornamos null
            if (error.message.includes('PGRST116') || error.message.includes('No rows')) {
                return null;
            }
            console.error('AuthRepository: Failed to find user:', error);
            throw error;
        }
    }

    /**
     * Busca un usuario por ID
     * @param {string} userId - ID del usuario
     * @returns {Object|null} Usuario encontrado o null
     */
    static async findUserById(userId) {
        try {
            // Usar service client para operaciones admin
            const result = await DatabaseRepository.select('admin_users', {
                filters: { id: userId, active: true },
                limit: 1
            }, true); // useServiceClient = true

            return result.length > 0 ? result[0] : null;

        } catch (error) {
            console.error('AuthRepository: Failed to find user by ID:', error);
            throw error;
        }
    }

    /**
     * Busca un usuario por username
     * @param {string} username - Username del usuario
     * @returns {Object|null} Usuario encontrado o null
     */
    static async findUserByUsername(username) {
        try {
            const result = await DatabaseRepository.select('admin_users', {
                filters: { username, active: true },
                limit: 1
            }, true); // useServiceClient = true

            return result.length > 0 ? result[0] : null;

        } catch (error) {
            console.error('AuthRepository: Failed to find user by username:', error);
            throw error;
        }
    }

    /**
     * Busca un usuario por email
     * @param {string} email - Email del usuario
     * @returns {Object|null} Usuario encontrado o null
     */
    static async findUserByEmail(email) {
        try {
            const result = await DatabaseRepository.select('admin_users', {
                filters: { email, active: true },
                limit: 1
            }, true); // useServiceClient = true

            return result.length > 0 ? result[0] : null;

        } catch (error) {
            console.error('AuthRepository: Failed to find user by email:', error);
            throw error;
        }
    }

    /**
     * Obtiene todos los usuarios activos
     * @returns {Array} Lista de usuarios activos
     */
    static async getAllActiveUsers() {
        try {
            return await DatabaseRepository.select('admin_users', {
                filters: { active: true },
                orderBy: { column: 'created_at', ascending: false }
            }, true); // useServiceClient = true

        } catch (error) {
            console.error('AuthRepository: Failed to get active users:', error);
            throw error;
        }
    }

    /**
     * Actualiza la fecha de último acceso del usuario
     * @param {string} userId - ID del usuario
     * @returns {Object} Usuario actualizado
     */
    static async updateLastAccess(userId) {
        try {
            const client = DatabaseRepository.getServiceClient();
            
            const { data, error } = await client
                .from('admin_users')
                .update({ 
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .eq('active', true)
                .select()
                .single();

            if (error) {
                console.error('AuthRepository: Error updating last access:', error);
                throw new Error(`Database error: ${error.message}`);
            }

            return data;

        } catch (error) {
            console.error('AuthRepository: Failed to update last access:', error);
            throw error;
        }
    }

    /**
     * Crea un nuevo usuario administrador
     * @param {Object} userData - Datos del usuario
     * @returns {Object} Usuario creado
     */
    static async createUser(userData) {
        try {
            const userToCreate = {
                id: userData.id,
                username: userData.username,
                email: userData.email,
                password: userData.password,
                role: userData.role || 'admin',
                active: userData.active !== undefined ? userData.active : true
            };

            return await DatabaseRepository.insert('admin_users', userToCreate, true); // useServiceClient = true

        } catch (error) {
            console.error('AuthRepository: Failed to create user:', error);
            
            // Manejo de errores específicos de duplicados
            if (error.message.includes('duplicate') || error.message.includes('unique')) {
                throw new Error('Username or email already exists');
            }
            
            throw error;
        }
    }

    /**
     * Actualiza los datos de un usuario
     * @param {string} userId - ID del usuario
     * @param {Object} updateData - Datos a actualizar
     * @returns {Object} Usuario actualizado
     */
    static async updateUser(userId, updateData) {
        try {
            return await DatabaseRepository.update('admin_users', userId, updateData, true); // useServiceClient = true

        } catch (error) {
            console.error('AuthRepository: Failed to update user:', error);
            
            if (error.message.includes('duplicate') || error.message.includes('unique')) {
                throw new Error('Username or email already exists');
            }
            
            throw error;
        }
    }

    /**
     * Desactiva un usuario (soft delete)
     * @param {string} userId - ID del usuario
     * @returns {Object} Usuario desactivado
     */
    static async deactivateUser(userId) {
        try {
            return await this.updateUser(userId, { active: false });

        } catch (error) {
            console.error('AuthRepository: Failed to deactivate user:', error);
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
            return await this.updateUser(userId, { active: true });

        } catch (error) {
            console.error('AuthRepository: Failed to activate user:', error);
            throw error;
        }
    }

    /**
     * Cambia la contraseña de un usuario
     * @param {string} userId - ID del usuario
     * @param {string} hashedPassword - Contraseña hasheada
     * @returns {Object} Usuario actualizado
     */
    static async updatePassword(userId, hashedPassword) {
        try {
            return await this.updateUser(userId, { password: hashedPassword });

        } catch (error) {
            console.error('AuthRepository: Failed to update password:', error);
            throw error;
        }
    }

    /**
     * Verifica si existe un usuario con el username dado
     * @param {string} username - Username a verificar
     * @param {string} excludeId - ID a excluir de la búsqueda (para updates)
     * @returns {boolean} True si existe, false si no
     */
    static async usernameExists(username, excludeId = null) {
        try {
            const client = DatabaseRepository.getServiceClient();
            
            let query = client
                .from('admin_users')
                .select('id')
                .eq('username', username);
            
            if (excludeId) {
                query = query.neq('id', excludeId);
            }

            const { data, error } = await query.limit(1);

            if (error) {
                console.error('AuthRepository: Error checking username existence:', error);
                throw new Error(`Database error: ${error.message}`);
            }

            return data && data.length > 0;

        } catch (error) {
            console.error('AuthRepository: Failed to check username existence:', error);
            throw error;
        }
    }

    /**
     * Verifica si existe un usuario con el email dado
     * @param {string} email - Email a verificar
     * @param {string} excludeId - ID a excluir de la búsqueda (para updates)
     * @returns {boolean} True si existe, false si no
     */
    static async emailExists(email, excludeId = null) {
        try {
            const client = DatabaseRepository.getServiceClient();
            
            let query = client
                .from('admin_users')
                .select('id')
                .eq('email', email);
            
            if (excludeId) {
                query = query.neq('id', excludeId);
            }

            const { data, error } = await query.limit(1);

            if (error) {
                console.error('AuthRepository: Error checking email existence:', error);
                throw new Error(`Database error: ${error.message}`);
            }

            return data && data.length > 0;

        } catch (error) {
            console.error('AuthRepository: Failed to check email existence:', error);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas de usuarios
     * @returns {Object} Estadísticas de usuarios
     */
    static async getUserStats() {
        try {
            const [totalUsers, activeUsers] = await Promise.all([
                DatabaseRepository.select('admin_users', {}, true), // useServiceClient = true
                DatabaseRepository.select('admin_users', { filters: { active: true } }, true) // useServiceClient = true
            ]);

            return {
                total: totalUsers.length,
                active: activeUsers.length,
                inactive: totalUsers.length - activeUsers.length,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('AuthRepository: Failed to get user stats:', error);
            throw error;
        }
    }

    /**
     * Verifica la salud de las tablas de autenticación
     * @returns {Object} Estado de salud
     */
    static async healthCheck() {
        try {
            await DatabaseRepository.select('admin_users', { limit: 1 }, true); // useServiceClient = true
            
            return {
                status: 'healthy',
                table: 'admin_users',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('AuthRepository: Health check failed:', error);
            return {
                status: 'unhealthy',
                table: 'admin_users',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

export default AuthRepository;