import { createClient } from '@supabase/supabase-js';

/**
 * Servicio centralizado para gestionar la conexión a Supabase
 * Maneja la configuración, conexión y queries básicas
 */
export class DatabaseService {
    static instance = null;
    static client = null;
    static isConnected = false;

    /**
     * Inicializa la conexión a Supabase (Singleton)
     */
    static initialize() {
        if (this.instance) {
            return this.instance;
        }

        const supabaseUrl = import.meta.env.SUPABASE_URL;
        const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_ANON_KEY');
        }

        try {
            this.client = createClient(supabaseUrl, supabaseKey);
            this.isConnected = true;
            this.instance = this;

            if (import.meta.env.DEV) {
                console.log('DatabaseService: Connected to Supabase');
            }

            return this.instance;
        } catch (error) {
            console.error('DatabaseService: Failed to connect to Supabase:', error);
            throw error;
        }
    }

    /**
     * Obtiene el cliente de Supabase
     */
    static getClient() {
        if (!this.client) {
            this.initialize();
        }
        return this.client;
    }

    /**
     * Verifica si la conexión está activa
     */
    static isConnectionActive() {
        return this.isConnected && this.client;
    }

    /**
     * Ejecuta una query SELECT básica con manejo de errores
     */
    static async select(table, options = {}) {
        const client = this.getClient();
        
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
                console.error(`DatabaseService: Error selecting from ${table}:`, error);
                throw new Error(`Database error: ${error.message}`);
            }

            return data || [];

        } catch (error) {
            console.error(`DatabaseService: Failed to select from ${table}:`, error);
            throw error;
        }
    }

    /**
     * Ejecuta una query SELECT con JOIN
     */
    static async selectWithJoin(table, options = {}) {
        const client = this.getClient();
        
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
                console.error(`DatabaseService: Error selecting with join from ${table}:`, error);
                throw error;
            }

            return data || [];

        } catch (error) {
            console.error(`DatabaseService: Failed to select with join from ${table}:`, error);
            throw error;
        }
    }

    /**
     * Inserta un nuevo registro
     */
    static async insert(table, data) {
        const client = this.getClient();
        
        try {
            const { data: result, error } = await client
                .from(table)
                .insert(data)
                .select()
                .single();

            if (error) {
                console.error(`DatabaseService: Error inserting into ${table}:`, error);
                throw error;
            }

            return result;

        } catch (error) {
            console.error(`DatabaseService: Failed to insert into ${table}:`, error);
            throw error;
        }
    }

    /**
     * Actualiza un registro existente
     */
    static async update(table, id, data) {
        const client = this.getClient();
        
        try {
            const { data: result, error } = await client
                .from(table)
                .update(data)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error(`DatabaseService: Error updating ${table}:`, error);
                throw error;
            }

            return result;

        } catch (error) {
            console.error(`DatabaseService: Failed to update ${table}:`, error);
            throw error;
        }
    }

    /**
     * Elimina un registro
     */
    static async delete(table, id) {
        const client = this.getClient();
        
        try {
            const { error } = await client
                .from(table)
                .delete()
                .eq('id', id);

            if (error) {
                console.error(`DatabaseService: Error deleting from ${table}:`, error);
                throw error;
            }

            return true;

        } catch (error) {
            console.error(`DatabaseService: Failed to delete from ${table}:`, error);
            throw error;
        }
    }

    /**
     * Ejecuta una consulta RPC (función almacenada)
     */
    static async rpc(functionName, params = {}) {
        const client = this.getClient();
        
        try {
            const { data, error } = await client.rpc(functionName, params);

            if (error) {
                console.error(`DatabaseService: Error calling RPC ${functionName}:`, error);
                throw error;
            }

            return data;

        } catch (error) {
            console.error(`DatabaseService: Failed to call RPC ${functionName}:`, error);
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
                connected: true
            };

        } catch (error) {
            console.error('DatabaseService: Health check failed:', error);
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                connected: false,
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
            console.error('DatabaseService: Failed to get stats:', error);
            return {
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Cierra la conexión (cleanup)
     */
    static disconnect() {
        if (this.client) {
            // Supabase no tiene método explícito de desconexión
            this.client = null;
            this.isConnected = false;
            this.instance = null;
            
            if (import.meta.env.DEV) {
                console.log('DatabaseService: Disconnected from Supabase');
            }
        }
    }
}

// Auto-inicialización en entornos de servidor
if (typeof window === 'undefined') {
    try {
        DatabaseService.initialize();
    } catch (error) {
        console.error('Failed to auto-initialize DatabaseService:', error);
    }
}

export default DatabaseService;