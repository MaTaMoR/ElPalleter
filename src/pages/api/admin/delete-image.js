export const prerender = false;

import { verifyToken } from '../../../lib/auth.js';
import { supabase } from '../../../lib/database.js';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function DELETE({ request, cookies }) {
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

    const { filename, mediaId } = await request.json();

    if (!filename && !mediaId) {
      return new Response(JSON.stringify({ 
        error: 'Se requiere filename o mediaId' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let mediaRecord = null;

    // Obtener información del archivo de la BD
    if (mediaId) {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('id', mediaId)
        .single();
      
      if (!error && data) {
        mediaRecord = data;
      }
    } else if (filename) {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('filename', filename)
        .single();
      
      if (!error && data) {
        mediaRecord = data;
      }
    }

    // Eliminar archivo físico
    if (mediaRecord?.file_path) {
      const filePath = path.join('public', mediaRecord.file_path);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    }

    // Eliminar registro de la BD
    if (mediaRecord?.id) {
      await supabase
        .from('media_files')
        .delete()
        .eq('id', mediaRecord.id);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Imagen eliminada correctamente'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Delete error:', error);
    return new Response(JSON.stringify({ 
      error: 'Error eliminando la imagen' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}