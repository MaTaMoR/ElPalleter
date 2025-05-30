// src/pages/api/admin/get-data.js
export const prerender = false;

import { verifyToken } from '../../../lib/auth.js';
import { getPageContent } from '../../../lib/database.js';

export async function GET({ request, cookies, url }) {
  try {
    // Verificar autenticación
    const token = cookies.get('admin-token')?.value;
    if (!token || !await verifyToken(token)) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener parámetro de sección
    const section = url.searchParams.get('section');
    if (!section) {
      return new Response(JSON.stringify({ error: 'Sección requerida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener datos de la sección
    const data = await getPageContent(section);
    
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get data error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Error obteniendo datos' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}