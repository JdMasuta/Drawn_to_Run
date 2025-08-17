// User Controller - Handles user management API calls
import { ApiRouter } from '../lib/apiRouter';
import type { 
  ApiResponse,
  User,
  Registration,
  UserRegistrationsQueryParams
} from '../types/api';

export class UserController {
  /**
   * Update user profile
   */
  static async updateProfile(userId: number, data: Partial<User>): Promise<User> {
    const response = await ApiRouter.put<ApiResponse<User>>(`/users/${userId}`, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update profile');
    }
    
    return response.data;
  }

  /**
   * Get user's event registrations
   */
  static async getUserRegistrations(
    userId: number, 
    params?: UserRegistrationsQueryParams
  ): Promise<Registration[]> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const response = await ApiRouter.get<ApiResponse<Registration[]>>(`/users/${userId}/registrations${queryString}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user registrations');
    }
    
    return response.data;
  }

  /**
   * Update registration status
   */
  static async updateRegistration(registrationId: number, data: Partial<Registration>): Promise<Registration> {
    const response = await ApiRouter.put<ApiResponse<Registration>>(`/registrations/${registrationId}`, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update registration');
    }
    
    return response.data;
  }
}