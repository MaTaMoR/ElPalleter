export const prerender = false;

import { verifyToken } from '../../../lib/auth.js';
import { supabase } from '../../../lib/database.js';

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

    // Parámetros de consulta
    const section = url.searchParams.get('section');
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    // Construir consulta
    let query = supabase
      .from('media_files')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (section) {
      query = query.ilike('file_path', `%${section}%`);
    }

    const { data: images, error } = await query;

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({
      images: images || [],
      count: images?.length || 0,
      offset,
      limit
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('List images error:', error);
    return new Response(JSON.stringify({ 
      error: 'Error obteniendo lista de imágenes' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}