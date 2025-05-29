export const prerender = false;

import { verifyToken } from '../../../lib/auth.js';
import { supabase } from '../../../lib/database.js';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Configuración de upload
const UPLOAD_DIR = 'public/uploads';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];

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

    // Obtener datos del formulario
    const formData = await request.formData();
    const file = formData.get('file');
    const section = formData.get('section') || 'general';
    const type = formData.get('type') || 'image';
    const index = formData.get('index');

    if (!file || file.size === 0) {
      return new Response(JSON.stringify({ 
        error: 'No se proporcionó ningún archivo' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ 
        error: 'El archivo es demasiado grande. Máximo 5MB.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ 
        error: 'Tipo de archivo no permitido. Solo se aceptan imágenes.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generar nombre único
    const timestamp = Date.now();
    const extension = path.extname(file.name);
    const fileName = `${section}_${type}_${timestamp}${extension}`;
    
    // Crear directorio si no existe
    const sectionDir = path.join(UPLOAD_DIR, section);
    if (!existsSync(sectionDir)) {
      await mkdir(sectionDir, { recursive: true });
    }

    // Guardar archivo
    const filePath = path.join(sectionDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // URL pública del archivo
    const publicUrl = `/uploads/${section}/${fileName}`;

    // Guardar información en la base de datos
    const { data: mediaRecord, error: dbError } = await supabase
      .from('media_files')
      .insert({
        filename: fileName,
        original_name: file.name,
        file_path: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        alt_text: `${section} ${type} image`,
        uploaded_by: payload.userId
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // El archivo ya está guardado, pero no se registró en BD
      // Continuar con el proceso
    }

    return new Response(JSON.stringify({
      success: true,
      url: publicUrl,
      filename: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
      mediaId: mediaRecord?.id
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor durante la subida' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}