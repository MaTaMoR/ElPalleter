// src/pages/api/auth/login.js
export const prerender = false;

import { verifyPassword, generateToken } from '../../../lib/auth.js';
import { getAdminUser, updateLastLogin } from '../../../lib/database.js';

export async function POST({ request }) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ 
        error: 'Email y contraseña son requeridos' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Buscar usuario admin
    const user = await getAdminUser(email);
    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'Credenciales inválidas' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar contraseña
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return new Response(JSON.stringify({ 
        error: 'Credenciales inválidas' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generar token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name
    });
    
    // Actualizar último login
    await updateLastLogin(user.id);
    
    // Crear respuesta con cookie
    const response = new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Establecer cookie HTTP-only
    response.headers.set('Set-Cookie', 
      `admin-token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`
    );
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}