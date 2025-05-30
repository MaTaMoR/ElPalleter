/ src/pages/api/admin/update-data.js
export const prerender = false;

import { verifyToken } from '../../../lib/auth.js';
import { updatePageContent } from '../../../lib/database.js';

export async function POST({ request, cookies }) {
  try {
    // Verificar autenticación
    const token = cookies.get('admin-token')?.value;
    const payload = await verifyToken(token);
    if (!token || !payload) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener datos del request
    const { section, content } = await request.json();
    
    if (!section || !content) {
      return new Response(JSON.stringify({ 
        error: 'Sección y contenido son requeridos' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Actualizar contenido
    await updatePageContent(section, content, payload.userId);
    
    // Trigger rebuild (opcional por ahora)
    try {
      await triggerRebuild();
    } catch (rebuildError) {
      console.warn('Rebuild failed:', rebuildError);
      // No fallar la actualización si el rebuild falla
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Contenido actualizado correctamente'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Update data error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Error actualizando datos' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function triggerRebuild() {
  const deployHook = import.meta.env.VERCEL_DEPLOY_HOOK;
  const rebuildSecret = import.meta.env.REBUILD_SECRET;
  
  if (!deployHook) {
    console.warn('No deploy hook configured');
    return;
  }

  // Trigger Vercel rebuild
  const response = await fetch(deployHook, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      secret: rebuildSecret
    })
  });

  if (!response.ok) {
    throw new Error(`Rebuild failed: ${response.statusText}`);
  }
  
  console.log('Rebuild triggered successfully');
}