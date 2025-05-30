// src/pages/api/admin/stats.js
export const prerender = false;

import { verifyToken } from '../../../lib/auth.js';
import { supabase } from '../../../lib/database.js';

export async function GET({ request, cookies }) {
  try {
    // Verificar autenticación
    const token = cookies.get('admin-token')?.value;
    if (!token || !await verifyToken(token)) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener estadísticas
    const stats = await getAdminStats();
    
    return new Response(JSON.stringify(stats), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function getAdminStats() {
  // Obtener datos de la carta
  const { data: cartaData } = await supabase
    .from('page_content')
    .select('content, updated_at')
    .eq('section', 'carta')
    .single();

  // Contar platos en la carta
  let cartaItems = 0;
  if (cartaData?.content?.categories) {
    cartaData.content.categories.forEach(category => {
      category.sections?.forEach(section => {
        cartaItems += section.items?.length || 0;
      });
    });
  }

  // Calcular días desde última actualización
  const lastUpdate = new Date(cartaData?.updated_at || Date.now());
  const daysSinceUpdate = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

  // Contar secciones configuradas
  const { count: sectionsCount } = await supabase
    .from('page_content')
    .select('id', { count: 'exact' });

  return {
    cartaItems,
    daysSinceUpdate,
    sectionsCount: sectionsCount || 0
  };
}
