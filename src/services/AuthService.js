import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';
import adminUsers from '../data/admin-users.json';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const COOKIE_NAME = 'admin_token';

export class AuthService {
  static async validateUser(username, password) {
    const user = adminUsers.users.find(u => 
      (u.username === username || u.email === username) && u.active
    );
    
    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  static createAuthCookie(token) {
    return serialize(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/admin'
    });
  }

  static createLogoutCookie() {
    return serialize(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/admin'
    });
  }

  static getUserFromRequest(request) {
    try {
      const cookies = request.headers.get('cookie');
      if (!cookies) return null;

      const parsedCookies = parse(cookies);
      const token = parsedCookies[COOKIE_NAME];
      
      if (!token) return null;

      return this.verifyToken(token);
    } catch (error) {
      console.error('Error getting user from request:', error);
      return null;
    }
  }
}