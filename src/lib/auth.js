// src/lib/auth.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = import.meta.env.JWT_SECRET || 'fallback-secret-for-dev';

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// src/middleware.js
import { defineMiddleware } from 'astro:middleware';
import { verifyToken } from './lib/auth.js';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  
  // Rutas que requieren autenticación
  if (pathname.startsWith('/administracion/dashboard')) {
    const token = context.cookies.get('admin-token')?.value;
    
    if (!token || !await verifyToken(token)) {
      return context.redirect('/administracion');
    }
  }
  
  return next();
});

// src/lib/database.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getAdminUser(email) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .single();
    
  if (error) return null;
  return data;
}

export async function updateLastLogin(userId) {
  await supabase
    .from('admin_users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', userId);
}

export async function getPageContent(section) {
  const { data, error } = await supabase
    .from('page_content')
    .select('*')
    .eq('section', section)
    .single();
    
  if (error) throw new Error(`Error getting ${section}: ${error.message}`);
  return data;
}

export async function updatePageContent(section, content, userId) {
  // Guardar versión anterior en historial
  const currentData = await getPageContent(section);
  if (currentData) {
    await supabase
      .from('content_history')
      .insert({
        section,
        content: currentData.content,
        updated_by: userId,
        version: currentData.version
      });
  }
  
  // Actualizar contenido actual
  const { error } = await supabase
    .from('page_content')
    .update({
      content,
      updated_at: new Date().toISOString(),
      updated_by: userId,
      version: (currentData?.version || 0) + 1
    })
    .eq('section', section);
    
  if (error) throw new Error(`Error updating ${section}: ${error.message}`);
}
