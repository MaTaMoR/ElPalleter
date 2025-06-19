import { AuthService } from '../../../services/AuthService.js';

export const prerender = false;

export async function POST({ request }) {
  const cookie = AuthService.createLogoutCookie();

  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Logout successful' 
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie
    }
  });
}