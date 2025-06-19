import { AuthService } from '../../../services/AuthService.js';

export const prerender = false;

export async function POST({ request }) {
  try {
    const formData = await request.formData();
    const username = formData.get('username');
    const password = formData.get('password');

    if (!username || !password) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Username and password are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await AuthService.validateUser(username, password);
    
    if (!user) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Invalid credentials' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = AuthService.generateToken(user);
    const cookie = AuthService.createAuthCookie(token);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Login successful',
      user: user
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}