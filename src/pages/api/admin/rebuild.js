// src/pages/api/admin/rebuild.js
export const prerender = false;

import { verifyToken } from '../../../lib/auth.js';

export async function POST({ request, cookies }) {
  try {
    // Verificar autenticación
    const token = cookies.get('admin-token')?.value;
    if (!token || !await verifyToken(token)) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Trigger rebuild manual
    await triggerRebuild();
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Rebuild iniciado correctamente'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Manual rebuild error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Error en rebuild manual' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function triggerRebuild() {
  const deployHook = import.meta.env.VERCEL_DEPLOY_HOOK;
  
  if (!deployHook) {
    throw new Error('Deploy hook no configurado');
  }

  const response = await fetch(deployHook, {
    method: 'POST'
  });

  if (!response.ok) {
    throw new Error(`Rebuild failed: ${response.statusText}`);
  }
  
  return response.json();
}