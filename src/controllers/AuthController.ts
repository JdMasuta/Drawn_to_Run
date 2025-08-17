// Authentication Controller - Handles all auth-related API calls
import { ApiRouter } from '../lib/apiRouter';
import type { 
  ApiResponse, 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest,
  User 
} from '../types/api';

export class AuthController {
  /**
   * Register a new user
   */
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await ApiRouter.post<ApiResponse<AuthResponse>>('/auth/register', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Registration failed');
    }
    
    return response.data;
  }

  /**
   * Login user with email and password
   */
  static async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await ApiRouter.post<ApiResponse<AuthResponse>>('/auth/login', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Login failed');
    }
    
    return response.data;
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser(): Promise<User> {
    const response = await ApiRouter.get<ApiResponse<{ user: User }>>('/auth/me');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get user profile');
    }
    
    return response.data.user;
  }

  /**
   * Logout current user
   */
  static async logout(): Promise<void> {
    try {
      const response = await ApiRouter.post<ApiResponse>('/auth/logout');
      
      if (!response.success) {
        console.warn('Logout API call returned error:', response.error?.message);
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    }
  }

  /**
   * Validate authentication token
   */
  static async validateToken(): Promise<User | null> {
    try {
      const user = await this.getCurrentUser();
      return user;
    } catch (error) {
      // Token is invalid or expired
      return null;
    }
  }
}