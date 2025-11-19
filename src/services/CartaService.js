import { CartaRepository } from '../repositories/CartaRepository.js';
import { AuthService } from './AuthService.js';

/**
 * Servicio de Carta actualizado para usar el backend Spring Boot
 * Reemplaza los datos estáticos con llamadas a la API
 */
export class CartaService {

    /**
     * Ordena categorías, subcategorías e items por orderIndex
     * @param {Array} categories - Array de categorías
     * @returns {Array} Array de categorías ordenadas
     * @private
     */
    static sortByOrderIndex(categories) {
        if (!categories || !Array.isArray(categories)) {
            return categories;
        }

        // Ordenar categorías
        const sortedCategories = [...categories].sort((a, b) => {
            const orderA = a.orderIndex ?? Number.MAX_SAFE_INTEGER;
            const orderB = b.orderIndex ?? Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
        });

        // Ordenar subcategorías e items dentro de cada categoría
        return sortedCategories.map(category => ({
            ...category,
            subcategories: category.subcategories ?
                [...category.subcategories]
                    .sort((a, b) => {
                        const orderA = a.orderIndex ?? Number.MAX_SAFE_INTEGER;
                        const orderB = b.orderIndex ?? Number.MAX_SAFE_INTEGER;
                        return orderA - orderB;
                    })
                    .map(subcategory => ({
                        ...subcategory,
                        items: subcategory.items ?
                            [...subcategory.items].sort((a, b) => {
                                const orderA = a.orderIndex ?? Number.MAX_SAFE_INTEGER;
                                const orderB = b.orderIndex ?? Number.MAX_SAFE_INTEGER;
                                return orderA - orderB;
                            })
                            : subcategory.items
                    }))
                : category.subcategories
        }));
    }

    /**
     * Obtiene las categorías del menú traducidas
     * @param {string} language - Código de idioma (es, en, val)
     * @returns {Promise<Array>} Array de categorías con subcategorías e items ordenadas por orderIndex
     */
    static async getCategories(language = 'es') {
        try {
            const categories = await CartaRepository.getTranslatedCategories(language);
            return this.sortByOrderIndex(categories);
        } catch (error) {
            console.error('CartaService: Error getting categories:', error);
            throw error;
        }
    }

    /**
     * Obtiene categorías con fallback automático a español
     * @param {string} language - Código de idioma preferido
     * @returns {Promise<Array>} Array de categorías ordenadas por orderIndex
     */
    static async getCategoriesWithFallback(language = 'es') {
        try {
            const categories = await CartaRepository.getCategoriesWithFallback(language);
            return this.sortByOrderIndex(categories);
        } catch (error) {
            console.error('CartaService: Error getting categories with fallback:', error);
            throw error;
        }
    }

    /**
     * Obtiene solo las categorías y items disponibles
     * @param {string} language - Código de idioma
     * @returns {Promise<Array>} Array de categorías filtradas por disponibilidad y ordenadas por orderIndex
     */
    static async getAvailableCategories(language = 'es') {
        try {
            const categories = await CartaRepository.getAvailableCategories(language, true);
            return this.sortByOrderIndex(categories);
        } catch (error) {
            console.error('CartaService: Error getting available categories:', error);
            throw error;
        }
    }

    /**
     * Busca items específicos en el menú
     * @param {string} language - Código de idioma
     * @param {string} searchTerm - Término de búsqueda
     * @returns {Promise<Array>} Array de items que coinciden
     */
    static async searchItems(language = 'es', searchTerm = '') {
        try {
            return await CartaRepository.searchItems(language, searchTerm);
        } catch (error) {
            console.error('CartaService: Error searching items:', error);
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
            return await CartaRepository.getItemById(language, itemId);
        } catch (error) {
            console.error('CartaService: Error getting item by ID:', error);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas completas del menú
     * @param {string} language - Código de idioma
     * @returns {Promise<Object>} Estadísticas del menú
     */
    static async getMenuStats(language = 'es') {
        try {
            return await CartaRepository.getMenuStats(language);
        } catch (error) {
            console.error('CartaService: Error getting menu stats:', error);
            throw error;
        }
    }

    /**
     * MÉTODO LEGACY - Mantiene compatibilidad con código existente
     * @deprecated Usar getCategories() en su lugar
     * @returns {Promise<Object>} Datos de carta en formato legacy ordenados por orderIndex
     */
    static async getCartaData(language = 'es') {
        try {
            // getCategories ya devuelve datos ordenados
            const categories = await this.getCategories(language);

            // Convertir al formato legacy esperado por algunos componentes
            return {
                categories: categories,
                meta: {
                    totalCategories: categories.length,
                    totalItems: categories.reduce((total, cat) => {
                        return total + (cat.subcategories?.reduce((subTotal, sub) => {
                            return subTotal + (sub.items?.length || 0);
                        }, 0) || 0);
                    }, 0),
                    language: language,
                    lastUpdated: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('CartaService: Error getting carta data (legacy):', error);
            throw error;
        }
    }

    /**
     * Organiza items por categorías principales (sin subcategorías)
     * @param {string} language - Código de idioma
     * @returns {Promise<Array>} Array de categorías con items directos ordenados
     */
    static async getFlatCategories(language = 'es') {
        try {
            const categories = await this.getCategories(language);

            // getCategories ya devuelve datos ordenados
            return categories.map(category => ({
                ...category,
                items: category.subcategories?.reduce((allItems, subcategory) => {
                    return allItems.concat(subcategory.items?.map(item => ({
                        ...item,
                        subcategoryName: subcategory.nameKey,
                        subcategoryId: subcategory.id
                    })) || []);
                }, []) || []
            }));
        } catch (error) {
            console.error('CartaService: Error getting flat categories:', error);
            throw error;
        }
    }

    /**
     * Obtiene solo los items destacados/recomendados (si tienen esta propiedad)
     * @param {string} language - Código de idioma
     * @returns {Promise<Array>} Array de items destacados
     */
    static async getFeaturedItems(language = 'es') {
        try {
            const categories = await this.getCategories(language);
            const featuredItems = [];

            categories.forEach(category => {
                category.subcategories?.forEach(subcategory => {
                    subcategory.items?.forEach(item => {
                        // Buscar items que podrían estar marcados como destacados
                        if (item.featured || item.recommended || item.highlight) {
                            featuredItems.push({
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

            return featuredItems;
        } catch (error) {
            console.error('CartaService: Error getting featured items:', error);
            throw error;
        }
    }

    /**
     * Filtra items por rango de precios
     * @param {string} language - Código de idioma
     * @param {number} minPrice - Precio mínimo
     * @param {number} maxPrice - Precio máximo
     * @returns {Promise<Array>} Array de items en el rango de precios
     */
    static async getItemsByPriceRange(language = 'es', minPrice = 0, maxPrice = Infinity) {
        try {
            const categories = await this.getCategories(language);
            const itemsInRange = [];

            categories.forEach(category => {
                category.subcategories?.forEach(subcategory => {
                    subcategory.items?.forEach(item => {
                        if (item.price >= minPrice && item.price <= maxPrice) {
                            itemsInRange.push({
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

            // Ordenar por precio
            return itemsInRange.sort((a, b) => a.price - b.price);
        } catch (error) {
            console.error('CartaService: Error getting items by price range:', error);
            throw error;
        }
    }

    /**
     * Agrupa items por categoría principal (útil para navegación)
     * @param {string} language - Código de idioma
     * @returns {Promise<Object>} Objeto con items agrupados por categoría
     */
    static async getItemsByCategory(language = 'es') {
        try {
            const categories = await this.getCategories(language);
            const itemsByCategory = {};

            categories.forEach(category => {
                itemsByCategory[category.id] = {
                    categoryName: category.nameKey,
                    categoryOrder: category.orderIndex,
                    items: []
                };

                category.subcategories?.forEach(subcategory => {
                    subcategory.items?.forEach(item => {
                        itemsByCategory[category.id].items.push({
                            ...item,
                            subcategoryName: subcategory.nameKey,
                            subcategoryId: subcategory.id
                        });
                    });
                });
            });

            return itemsByCategory;
        } catch (error) {
            console.error('CartaService: Error grouping items by category:', error);
            throw error;
        }
    }

    /**
     * Verifica si el servicio está disponible
     * @returns {Promise<Object>} Estado del servicio
     */
    static async healthCheck() {
        try {
            const repoHealth = await CartaRepository.healthCheck();
            
            return {
                ...repoHealth,
                service: 'CartaService',
                lastCheck: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                service: 'CartaService',
                error: error.message,
                lastCheck: new Date().toISOString()
            };
        }
    }

    /**
     * Obtiene la configuración del servicio
     * @returns {Object} Configuración actual
     */
    static getConfig() {
        return {
            repository: CartaRepository.getConfig(),
            supportedLanguages: ['es', 'en', 'val'],
            defaultLanguage: 'es',
            cacheEnabled: false // Implementar cache si es necesario
        };
    }

    /**
     * Método helper para componentes Astro que necesitan datos síncronos
     * NOTA: Este método debe usarse solo en server-side con await
     * @param {string} language - Código de idioma
     * @returns {Promise<Object>} Datos para renderizado en Astro
     */
    static async getDataForAstro(language = 'es') {
        try {
            const [categories, stats] = await Promise.all([
                this.getAvailableCategories(language),
                this.getMenuStats(language)
            ]);

            return {
                categories,
                stats,
                language,
                meta: {
                    generatedAt: new Date().toISOString(),
                    isFromBackend: true
                }
            };
        } catch (error) {
            console.error('CartaService: Error getting data for Astro:', error);
            throw error;
        }
    }

    /**
     * Método de conveniencia para obtener datos con traducción personalizada
     * @param {string} language - Código de idioma
     * @param {Function} translateFn - Función de traducción personalizada
     * @returns {Promise<Object>} Datos con traducciones aplicadas y ordenados por orderIndex
     */
    static async getTranslatedData(language = 'es', translateFn = null) {
        try {
            // getCategories ya devuelve datos ordenados
            const categories = await this.getCategories(language);

            if (!translateFn) {
                return categories;
            }

            // Aplicar traducciones personalizadas si se proporciona la función
            return categories.map(category => ({
                ...category,
                translatedName: translateFn(category.nameKey, language),
                subcategories: category.subcategories?.map(subcategory => ({
                    ...subcategory,
                    translatedName: translateFn(subcategory.nameKey, language),
                    items: subcategory.items?.map(item => ({
                        ...item,
                        translatedName: translateFn(item.nameKey, language),
                        translatedDescription: translateFn(item.descriptionKey, language)
                    }))
                }))
            }));
        } catch (error) {
            console.error('CartaService: Error getting translated data:', error);
            throw error;
        }
    }

    /**
     * Guarda/actualiza cambios en la carta
     * REQUIERE AUTENTICACIÓN - Solo para panel de administración
     * @param {Array} menuData - Array de categorías con subcategorías e items
     * @param {string} language - Código de idioma
     * @param {string} token - Token de autenticación (opcional)
     * @returns {Promise<Object>} Respuesta del backend
     */
    static async saveMenu(menuData, language = 'es') {
        try {
            return await CartaRepository.updateMenu(menuData, language, AuthService.getToken());
        } catch (error) {
            console.error('CartaService: Error saving menu:', error);
            throw error;
        }
    }
}

export default CartaService;