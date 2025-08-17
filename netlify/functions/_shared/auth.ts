// Authentication utilities for Netlify functions
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Database } from './database.js';
import { responses } from './response.js';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'participant' | 'organizer' | 'admin';
  email_verified: boolean;
  profile_image?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthTokenPayload {
  userId: number;
  email: string;
  role: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';
const SALT_ROUNDS = 12;

export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  static generateToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '7d',
      issuer: 'drawn-to-run',
    });
  }

  // Verify JWT token
  static verifyToken(token: string): AuthTokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    } catch (error) {
      return null;
    }
  }

  // Get user by ID
  static async getUserById(id: number): Promise<User | null> {
    try {
      const user = await Database.queryOne<User>(
        'SELECT id, email, name, role, email_verified, profile_image, bio, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );
      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
    try {
      const user = await Database.queryOne<User & { password_hash: string }>(
        'SELECT id, email, name, password_hash, role, email_verified, profile_image, bio, created_at, updated_at FROM users WHERE email = $1',
        [email]
      );
      return user;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }

  // Create new user
  static async createUser(userData: {
    email: string;
    name: string;
    password: string;
    role?: string;
  }): Promise<User | null> {
    try {
      const hashedPassword = await this.hashPassword(userData.password);
      
      const user = await Database.queryOne<User>(
        `INSERT INTO users (email, name, password_hash, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, name, role, email_verified, profile_image, bio, created_at, updated_at`,
        [userData.email, userData.name, hashedPassword, userData.role || 'participant']
      );
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  // Check if email exists
  static async emailExists(email: string): Promise<boolean> {
    try {
      const result = await Database.queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM users WHERE email = $1',
        [email]
      );
      return parseInt(result?.count || '0') > 0;
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false;
    }
  }
}

// Middleware to extract and verify authentication
export function extractAuthToken(headers: Record<string, string | undefined>): AuthTokenPayload | null {
  const authHeader = headers.authorization || headers.Authorization;
  
  if (!authHeader) {
    return null;
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  return AuthService.verifyToken(token);
}

// Authentication middleware
export async function requireAuth(headers: Record<string, string | undefined>): Promise<
  { success: true; user: User; auth: AuthTokenPayload } | 
  { success: false; response: any }
> {
  const auth = extractAuthToken(headers);
  
  if (!auth) {
    return {
      success: false,
      response: responses.unauthorized('Authentication required'),
    };
  }

  const user = await AuthService.getUserById(auth.userId);
  
  if (!user) {
    return {
      success: false,
      response: responses.unauthorized('Invalid authentication token'),
    };
  }

  return { success: true, user, auth };
}

// Role-based authorization middleware
export async function requireRole(
  headers: Record<string, string | undefined>,
  requiredRoles: string[]
): Promise<
  { success: true; user: User; auth: AuthTokenPayload } | 
  { success: false; response: any }
> {
  const authResult = await requireAuth(headers);
  
  if (!authResult.success) {
    return authResult;
  }

  if (!requiredRoles.includes(authResult.user.role)) {
    return {
      success: false,
      response: responses.forbidden('Insufficient permissions'),
    };
  }

  return authResult;
}