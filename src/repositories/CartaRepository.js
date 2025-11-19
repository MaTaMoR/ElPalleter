// src/repositories/CartaRepository.js

import { BaseRepository } from './BaseRepository.js';
import { AuthService } from '../services/AuthService.js';

/**
 * Repositorio para operaciones de carta/menú
 * Conecta con los endpoints /carta del backend Spring Boot
 */
export class CartaRepository extends BaseRepository {

    /**
     * Obtiene categorías traducidas del menú
     * GET /carta/translated-categories?language={language}
     * @param {string} language - Código de idioma (es, en, val)
     * @returns {Promise<Array>} Array de categorías con subcategorías e items
     */
    static async getTranslatedCategories(language = 'es') {
        try {
            const response = await this.get('/carta/translated-categories', {
                params: { language }
            });
            
            return response || [];
        } catch (error) {
            console.error('CartaRepository: Error getting translated categories:', error);
            throw error;
        }
    }

    /**
     * Obtiene todas las categorías con fallback a español si falla el idioma solicitado
     * @param {string} language - Código de idioma preferido
     * @returns {Promise<Array>} Array de categorías
     */
    static async getCategoriesWithFallback(language = 'es') {
        try {
            return await this.getTranslatedCategories(language);
        } catch (error) {
            console.warn(`Failed to get categories for language ${language}, falling back to Spanish:`, error);
            
            if (language !== 'es') {
                try {
                    return await this.getTranslatedCategories('es');
                } catch (fallbackError) {
                    console.error('CartaRepository: Even Spanish fallback failed:', fallbackError);
                    throw fallbackError;
                }
            }
            
            throw error;
        }
    }

    /**
     * Filtra categorías por disponibilidad de items
     * @param {string} language - Código de idioma
     * @param {boolean} onlyAvailable - Si true, solo devuelve categorías con items disponibles
     * @returns {Promise<Array>} Array de categorías filtradas
     */
    static async getAvailableCategories(language = 'es', onlyAvailable = true) {
        try {
            const categories = await this.getTranslatedCategories(language);
            
            if (!onlyAvailable) {
                return categories;
            }

            return categories.filter(category => {
                // Verificar si la categoría tiene subcategorías con items disponibles
                return category.subcategories && category.subcategories.some(subcategory => {
                    return subcategory.items && subcategory.items.some(item => item.available === true);
                });
            }).map(category => ({
                ...category,
                subcategories: category.subcategories.filter(subcategory => {
                    return subcategory.items && subcategory.items.some(item => item.available === true);
                }).map(subcategory => ({
                    ...subcategory,
                    items: subcategory.items.filter(item => item.available === true)
                }))
            }));
        } catch (error) {
            console.error('CartaRepository: Error filtering available categories:', error);
            throw error;
        }
    }

    /**
     * Busca items específicos en el menú
     * @param {string} language - Código de idioma
     * @param {string} searchTerm - Término de búsqueda
     * @returns {Promise<Array>} Array de items que coinciden con la búsqueda
     */
    static async searchItems(language = 'es', searchTerm = '') {
        try {
            const categories = await this.getTranslatedCategories(language);
            const searchResults = [];

            if (!searchTerm.trim()) {
                return searchResults;
            }

            const searchLower = searchTerm.toLowerCase();

            categories.forEach(category => {
                category.subcategories?.forEach(subcategory => {
                    subcategory.items?.forEach(item => {
                        const nameMatch = item.nameKey?.toLowerCase().includes(searchLower);
                        const descMatch = item.descriptionKey?.toLowerCase().includes(searchLower);
                        
                        if (nameMatch || descMatch) {
                            searchResults.push({
                                ...item,
                                categoryName: category.nameKey,
                                subcategoryName: subcategory.nameKey,
                                categoryId: category.id,
                                subcategoryId: subcategory.id
                            });
                        }
                    });
                });
            });

            return searchResults;
        } catch (error) {
            console.error('CartaRepository: Error searching items:', error);
            throw error;
        }
    }

    /**
     * Obtiene un item específico por ID
     * @param {string} language - Código de idioma
     * @param {string} itemId - ID del item
     * @returns {Promise<Object|null>} Item encontrado o null
     */
    static async getItemById(language = 'es', itemId) {
        try {
            const categories = await this.getTranslatedCategories(language);

            for (const category of categories) {
                for (const subcategory of category.subcategories || []) {
                    const item = subcategory.items?.find(item => item.id === itemId);
                    if (item) {
                        return {
                            ...item,
                            categoryName: category.nameKey,
                            subcategoryName: subcategory.nameKey,
                            categoryId: category.id,
                            subcategoryId: subcategory.id
                        };
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('CartaRepository: Error getting item by ID:', error);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas del menú
     * @param {string} language - Código de idioma
     * @returns {Promise<Object>} Estadísticas del menú
     */
    static async getMenuStats(language = 'es') {
        try {
            const categories = await this.getTranslatedCategories(language);
            
            let totalCategories = categories.length;
            let totalSubcategories = 0;
            let totalItems = 0;
            let availableItems = 0;
            let unavailableItems = 0;

            categories.forEach(category => {
                totalSubcategories += category.subcategories?.length || 0;
                
                category.subcategories?.forEach(subcategory => {
                    totalItems += subcategory.items?.length || 0;
                    
                    subcategory.items?.forEach(item => {
                        if (item.available) {
                            availableItems++;
                        } else {
                            unavailableItems++;
                        }
                    });
                });
            });

            return {
                totalCategories,
                totalSubcategories,
                totalItems,
                availableItems,
                unavailableItems,
                availabilityPercentage: totalItems > 0 ? Math.round((availableItems / totalItems) * 100) : 0
            };
        } catch (error) {
            console.error('CartaRepository: Error getting menu stats:', error);
            throw error;
        }
    }

    /**
     * Verifica si el servicio de carta está disponible
     * @returns {Promise<Object>} Estado del servicio
     */
    static async healthCheck() {
        try {
            // Intentar obtener categorías en español como test
            await this.getTranslatedCategories('es');
            
            return {
                status: 'healthy',
                service: 'CartaRepository',
                endpoints: {
                    translatedCategories: '/carta/translated-categories'
                },
                lastCheck: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                service: 'CartaRepository',
                error: error.message,
                lastCheck: new Date().toISOString()
            };
        }
    }

    /**
     * Actualiza/guarda cambios en la carta
     * POST /carta/update?language={language}
     * REQUIERE AUTENTICACIÓN
     * @param {Array} menuData - Array de categorías con subcategorías e items
     * @param {string} language - Código de idioma
     * @param {string} token - Token de autenticación (opcional, se obtiene de AuthService)
     * @returns {Promise<Object>} Respuesta del backend
     */
    static async updateMenu(menuData, language = 'es', token = null) {
        try {
            // POST usa el endpoint directamente, agregamos params a la URL
            const endpoint = `/carta/update?language=${encodeURIComponent(language)}`;

            const response = await this.post(endpoint, menuData, { 
                 headers: this.getAuthHeaders(token)
            });

            return response;
        } catch (error) {
            console.error('CartaRepository: Error updating menu:', error);
            throw error;
        }
    }

    /**
     * Obtiene la configuración del repositorio
     * @returns {Object} Configuración actual
     */
    static getConfig() {
        return {
            baseUrl: this.getBaseUrl(),
            endpoints: {
                translatedCategories: '/carta/translated-categories',
                updateMenu: '/carta/update'
            },
            supportedLanguages: ['es', 'en', 'val'],
            defaultLanguage: 'es'
        };
    }
}