// Authentication service for API calls
import { AuthController } from '../controllers/AuthController';
import { UserController } from '../controllers/UserController';
import type { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest,
  User 
} from '../types/api';

export class AuthService {
  // User registration
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    return AuthController.register(data);
  }

  // User login
  static async login(data: LoginRequest): Promise<AuthResponse> {
    return AuthController.login(data);
  }

  // Get current user profile
  static async getCurrentUser(): Promise<User> {
    return AuthController.getCurrentUser();
  }

  // User logout
  static async logout(): Promise<void> {
    return AuthController.logout();
  }

  // Update user profile
  static async updateProfile(userId: number, data: Partial<User>): Promise<User> {
    return UserController.updateProfile(userId, data);
  }

  // Check if user is authenticated (token validation)
  static async validateToken(): Promise<User | null> {
    return AuthController.validateToken();
  }
}