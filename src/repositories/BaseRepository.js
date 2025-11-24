// src/repositories/BaseRepository.js

/**
 * Configuración base para todas las peticiones a la API
 */
export class BaseRepository {
    
    static getBaseUrl() {
        return import.meta.env.VITE_API_URL || 
            import.meta.env.PUBLIC_API_URL || 
            'http://localhost:8080';
    }

    /**
     * Headers comunes para todas las peticiones
     */
    static getBaseHeaders() {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Headers con autorización
     */
    static getAuthHeaders(token) {
        return {
            ...this.getBaseHeaders(),
            'Authorization': `Bearer ${token}`
        };
    }

    /**
     * Manejo central de errores HTTP
     */
    static async handleResponse(response) {
        if (!response.ok) {
            let errorDetails = null;
            
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    errorDetails = await response.json();
                } else {
                    errorDetails = { message: await response.text() };
                }
            } catch (e) {
                errorDetails = { message: 'Error desconocido' };
            }

            // Extraer información de rate limiting si está disponible
            const rateLimitHeaders = {
                'X-RateLimit-Limit': response.headers.get('X-RateLimit-Limit'),
                'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining'),
                'X-RateLimit-Reset-In': response.headers.get('X-RateLimit-Reset-In'),
                'X-RateLimit-Window': response.headers.get('X-RateLimit-Window')
            };

            const error = new Error(errorDetails.message || `HTTP ${response.status}`);
            error.status = response.status;
            error.details = {
                ...errorDetails,
                headers: rateLimitHeaders,
                retryAfter: rateLimitHeaders['X-RateLimit-Reset-In']
            };
            
            throw error;
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return await response.text();
    }

    /**
     * Petición GET genérica
     */
    static async get(endpoint, options = {}) {
        const { headers = {}, params = {}, ...fetchOptions } = options;
        
        const url = `${this.getBaseUrl()}${endpoint}`;
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                url.searchParams.append(key, value);
            }
        });

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                ...this.getBaseHeaders(),
                ...headers
            },
            ...fetchOptions
        });

        return this.handleResponse(response);
    }

    /**
     * Petición POST genérica
     */
    static async post(endpoint, data = null, options = {}) {
        const { headers = {}, ...fetchOptions } = options;

        const requestOptions = {
            method: 'POST',
            headers: {
                ...this.getBaseHeaders(),
                ...headers
            },
            ...fetchOptions
        };

        if (data !== null) {
            if (typeof data === 'string') {
                requestOptions.body = data;
                requestOptions.headers['Content-Type'] = 'text/plain';
            } else {
                requestOptions.body = JSON.stringify(data);
            }
        }

        const response = await fetch(`${this.getBaseUrl()}${endpoint}`, requestOptions);
        return this.handleResponse(response);
    }

    /**
     * Petición PUT genérica
     */
    static async put(endpoint, data, options = {}) {
        const { headers = {}, ...fetchOptions } = options;

        const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
            method: 'PUT',
            headers: {
                ...this.getBaseHeaders(),
                ...headers
            },
            body: JSON.stringify(data),
            ...fetchOptions
        });

        return this.handleResponse(response);
    }

    /**
     * Petición PUT con FormData (para archivos)
     */
    static async putFormData(endpoint, formData, options = {}) {
        const { headers = {}, ...fetchOptions } = options;

        // No establecer Content-Type para FormData, el navegador lo hará automáticamente
        const customHeaders = { ...headers };
        delete customHeaders['Content-Type'];

        const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
            method: 'PUT',
            headers: customHeaders,
            body: formData,
            ...fetchOptions
        });

        return this.handleResponse(response);
    }

    /**
     * Petición PATCH genérica
     */
    static async patch(endpoint, data, options = {}) {
        const { headers = {}, ...fetchOptions } = options;

        const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
            method: 'PATCH',
            headers: {
                ...this.getBaseHeaders(),
                ...headers
            },
            body: JSON.stringify(data),
            ...fetchOptions
        });

        return this.handleResponse(response);
    }

    /**
     * Petición DELETE genérica
     */
    static async delete(endpoint, options = {}) {
        const { headers = {}, ...fetchOptions } = options;

        const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
            method: 'DELETE',
            headers: {
                ...this.getBaseHeaders(),
                ...headers
            },
            ...fetchOptions
        });

        return this.handleResponse(response);
    }

    /**
     * Health check del backend
     */
    static async healthCheck() {
        try {
            const response = await this.get('/actuator/health');
            return {
                status: 'healthy',
                data: response
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * Obtiene timestamp actual del servidor
     */
    static async getCurrentTime() {
        try {
            return await this.get('/current-time');
        } catch (error) {
            console.warn('No se pudo obtener la hora del servidor:', error);
            return {
                timestamp: new Date().toISOString(),
                formatted: new Date().toLocaleString(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
        }
    }
}