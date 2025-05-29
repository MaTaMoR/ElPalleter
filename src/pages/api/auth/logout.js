
// src/pages/api/auth/logout.js
export const prerender = false;

export async function POST({ request }) {
  const response = new Response(JSON.stringify({ 
    success: true 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  // Limpiar cookie
  response.headers.set('Set-Cookie', 
    'admin-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
  );
  
  return response;
}