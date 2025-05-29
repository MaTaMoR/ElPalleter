// src/pages/api/auth/verify.js
export const prerender = false;

import { verifyToken } from '../../../lib/auth.js';

export async function GET({ request, cookies }) {
  try {
    const token = cookies.get('admin-token')?.value;
    
    if (!token) {
      return new Response(JSON.stringify({ 
        authenticated: false 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const payload = await verifyToken(token);
    if (!payload) {
      return new Response(JSON.stringify({ 
        authenticated: false 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      authenticated: true,
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.name
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      authenticated: false 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
