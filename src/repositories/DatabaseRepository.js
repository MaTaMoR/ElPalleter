import { createClient } from '@supabase/supabase-js';

/**
 * Servicio centralizado para gestionar la conexión a Supabase
 * Maneja la configuración, conexión y queries básicas
 * Soporta tanto el cliente público como el service key para operaciones admin
 */
export class DatabaseRepository {
    static instance = null;
    static publicClient = null;
    static serviceClient = null;
    static isConnected = false;

    /**
     * Inicializa las conexiones a Supabase (Singleton)
     */
    static initialize() {
        if (this.instance) {
            return this.instance;
        }

        const supabaseUrl = import.meta.env.SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;
        const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_ANON_KEY');
        }

        try {
            // Cliente público (con RLS)
            this.publicClient = createClient(supabaseUrl, supabaseAnonKey);

            // Cliente service (bypass RLS) - solo si está disponible
            if (supabaseServiceKey) {
                this.serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                });
            } else {
                console.warn('DatabaseRepository: SUPABASE_SERVICE_ROLE_KEY not provided. Admin operations may be limited.');
            }

            this.isConnected = true;
            this.instance = this;

            if (import.meta.env.DEV) {
                console.log('DatabaseRepository: Connected to Supabase');
                console.log('DatabaseRepository: Service client available:', !!this.serviceClient);
            }

            return this.instance;
        } catch (error) {
            console.error('DatabaseRepository: Failed to connect to Supabase:', error);
            throw error;
        }
    }

    /**
     * Obtiene el cliente público de Supabase (con RLS)
     */
    static getClient() {
        if (!this.publicClient) {
            this.initialize();
        }
        return this.publicClient;
    }

    /**
     * Obtiene el cliente service de Supabase (bypass RLS)
     * Solo usar para operaciones administrativas críticas
     */
    static getServiceClient() {
        if (!this.serviceClient) {
            this.initialize();
            if (!this.serviceClient) {
                throw new Error('Service client not available. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.');
            }
        }
        return this.serviceClient;
    }

    /**
     * Verifica si la conexión está activa
     */
    static isConnectionActive() {
        return this.isConnected && this.publicClient;
    }

    /**
     * Verifica si el service client está disponible
     */
    static isServiceClientAvailable() {
        return this.isConnected && this.serviceClient;
    }

    /**
     * Ejecuta una query SELECT básica con manejo de errores
     * @param {string} table - Nombre de la tabla
     * @param {Object} options - Opciones de consulta
     * @param {boolean} useServiceClient - Si usar el service client (bypass RLS)
     */
    static async select(table, options = {}, useServiceClient = false) {
        const client = useServiceClient ? this.getServiceClient() : this.getClient();
        
        try {
            let query = client.from(table).select(options.select || '*');
            
            // Aplicar filtros si existen
            if (options.filters) {
                Object.entries(options.filters).forEach(([column, value]) => {
                    if (value !== null && value !== undefined) {
                        query = query.eq(column, value);
                    }
                });
            }

            // Aplicar ordenamiento
            if (options.orderBy) {
                const { column, ascending = true } = options.orderBy;
                query = query.order(column, { ascending });
            }

            // Aplicar límite
            if (options.limit) {
                query = query.limit(options.limit);
            }

            // Aplicar rango
            if (options.range) {
                const { from, to } = options.range;
                query = query.range(from, to);
            }

            const { data, error } = await query;

            if (error) {
                console.error(`DatabaseRepository: Error selecting from ${table}:`, error);
                throw new Error(`Database error: ${error.message}`);
            }

            return data || [];

        } catch (error) {
            console.error(`DatabaseRepository: Failed to select from ${table}:`, error);
            throw error;
        }
    }

    /**
     * Ejecuta una query SELECT con JOIN
     */
    static async selectWithJoin(table, options = {}, useServiceClient = false) {
        const client = useServiceClient ? this.getServiceClient() : this.getClient();
        
        try {
            let query = client.from(table).select(options.select || '*');
            
            // Aplicar filtros
            if (options.filters) {
                Object.entries(options.filters).forEach(([column, value]) => {
                    if (value !== null && value !== undefined) {
                        query = query.eq(column, value);
                    }
                });
            }

            // Aplicar ordenamiento
            if (options.orderBy) {
                const { column, ascending = true } = options.orderBy;
                query = query.order(column, { ascending });
            }

            const { data, error } = await query;

            if (error) {
                console.error(`DatabaseRepository: Error selecting with join from ${table}:`, error);
                throw error;
            }

            return data || [];

        } catch (error) {
            console.error(`DatabaseRepository: Failed to select with join from ${table}:`, error);
            throw error;
        }
    }

    /**
     * Inserta un nuevo registro
     */
    static async insert(table, data, useServiceClient = false) {
        const client = useServiceClient ? this.getServiceClient() : this.getClient();
        
        try {
            const { data: result, error } = await client
                .from(table)
                .insert(data)
                .select()
                .single();

            if (error) {
                console.error(`DatabaseRepository: Error inserting into ${table}:`, error);
                throw error;
            }

            return result;

        } catch (error) {
            console.error(`DatabaseRepository: Failed to insert into ${table}:`, error);
            throw error;
        }
    }

    /**
     * Actualiza un registro existente
     */
    static async update(table, id, data, useServiceClient = false) {
        const client = useServiceClient ? this.getServiceClient() : this.getClient();
        
        try {
            const { data: result, error } = await client
                .from(table)
                .update(data)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error(`DatabaseRepository: Error updating ${table}:`, error);
                throw error;
            }

            return result;

        } catch (error) {
            console.error(`DatabaseRepository: Failed to update ${table}:`, error);
            throw error;
        }
    }

    /**
     * Elimina un registro
     */
    static async delete(table, id, useServiceClient = false) {
        const client = useServiceClient ? this.getServiceClient() : this.getClient();
        
        try {
            const { error } = await client
                .from(table)
                .delete()
                .eq('id', id);

            if (error) {
                console.error(`DatabaseRepository: Error deleting from ${table}:`, error);
                throw error;
            }

            return true;

        } catch (error) {
            console.error(`DatabaseRepository: Failed to delete from ${table}:`, error);
            throw error;
        }
    }

    /**
     * Ejecuta una consulta RPC (función almacenada)
     */
    static async rpc(functionName, params = {}, useServiceClient = false) {
        const client = useServiceClient ? this.getServiceClient() : this.getClient();
        
        try {
            const { data, error } = await client.rpc(functionName, params);

            if (error) {
                console.error(`DatabaseRepository: Error calling RPC ${functionName}:`, error);
                throw error;
            }

            return data;

        } catch (error) {
            console.error(`DatabaseRepository: Failed to call RPC ${functionName}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene traducciones por idioma
     */
    static async getTranslations(language) {
        return await this.select('translations', {
            filters: { language },
            orderBy: { column: 'translation_key', ascending: true }
        });
    }

    /**
     * Obtiene contenido rico por clave
     */
    static async getRichContent(contentKey) {
        const result = await this.select('rich_content', {
            filters: { content_key: contentKey },
            limit: 1
        });
        
        return result.length > 0 ? result[0] : null;
    }

    /**
     * Verifica la salud de la conexión
     */
    static async healthCheck() {
        try {
            const client = this.getClient();
            const { data, error } = await client
                .from('restaurant_info')
                .select('id')
                .limit(1);

            if (error) {
                throw error;
            }

            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                connected: true,
                service_client_available: this.isServiceClientAvailable()
            };

        } catch (error) {
            console.error('DatabaseRepository: Health check failed:', error);
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                connected: false,
                service_client_available: this.isServiceClientAvailable(),
                error: error.message
            };
        }
    }

    /**
     * Obtiene estadísticas de la base de datos
     */
    static async getStats() {
        try {
            const [
                cartaCategories,
                cartaItems,
                translations,
                images
            ] = await Promise.all([
                this.select('carta_categories'),
                this.select('carta_items'),
                this.select('translations'),
                this.select('images')
            ]);

            return {
                carta_categories: cartaCategories.length,
                carta_items: cartaItems.length,
                translations: translations.length,
                images: images.length,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('DatabaseRepository: Failed to get stats:', error);
            return {
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Ejecuta una query personalizada usando SQL raw (solo service client)
     */
    static async executeSQL(query, params = []) {
        if (!this.isServiceClientAvailable()) {
            throw new Error('Service client required for raw SQL queries');
        }

        try {
            const client = this.getServiceClient();
            const { data, error } = await client.rpc('exec_sql', { 
                query: query,
                params: params 
            });

            if (error) {
                console.error('DatabaseRepository: Error executing SQL:', error);
                throw error;
            }

            return data;

        } catch (error) {
            console.error('DatabaseRepository: Failed to execute SQL:', error);
            throw error;
        }
    }

    /**
     * Cierra las conexiones (cleanup)
     */
    static disconnect() {
        if (this.publicClient) {
            this.publicClient = null;
        }
        
        if (this.serviceClient) {
            this.serviceClient = null;
        }
        
        this.isConnected = false;
        this.instance = null;
        
        if (import.meta.env.DEV) {
            console.log('DatabaseRepository: Disconnected from Supabase');
        }
    }
}

// Auto-inicialización en entornos de servidor
if (typeof window === 'undefined') {
    try {
        DatabaseRepository.initialize();
    } catch (error) {
        console.error('Failed to auto-initialize DatabaseRepository:', error);
    }
}

export default DatabaseRepository;