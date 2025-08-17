// Authentication hook
import { useCallback, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { AuthService } from '../services/authService';
import type { LoginRequest, RegisterRequest, User } from '../types/api';

export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    login: setLogin,
    logout: setLogout,
    updateUser,
    setLoading,
  } = useAuthStore();

  // Initialize authentication state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      
      // If we have a token but no user in store, validate it
      if (storedToken && !user) {
        setLoading(true);
        try {
          const validatedUser = await AuthService.validateToken();
          if (validatedUser) {
            setLogin(validatedUser, storedToken);
          } else {
            // Token is invalid, clear it
            setLogout();
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          setLogout();
        } finally {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, [user, setLogin, setLogout, setLoading]);

  // Login function
  const login = useCallback(async (credentials: LoginRequest) => {
    setLoading(true);
    try {
      const { user: loggedInUser, token: authToken } = await AuthService.login(credentials);
      setLogin(loggedInUser, authToken);
      return { success: true };
    } catch (error: any) {
      setLoading(false);
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  }, [setLogin, setLoading]);

  // Register function
  const register = useCallback(async (userData: RegisterRequest) => {
    setLoading(true);
    try {
      const { user: newUser, token: authToken } = await AuthService.register(userData);
      setLogin(newUser, authToken);
      return { success: true };
    } catch (error: any) {
      setLoading(false);
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    }
  }, [setLogin, setLoading]);

  // Logout function
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await AuthService.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      setLogout();
    }
  }, [setLogout, setLoading]);

  // Update profile function
  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const updatedUser = await AuthService.updateProfile(user.id, data);
      updateUser(updatedUser);
      return { success: true };
    } catch (error: any) {
      setLoading(false);
      return { 
        success: false, 
        error: error.message || 'Profile update failed' 
      };
    } finally {
      setLoading(false);
    }
  }, [user, updateUser, setLoading]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const refreshedUser = await AuthService.getCurrentUser();
      updateUser(refreshedUser);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If refresh fails, user might need to re-authenticate
      setLogout();
    }
  }, [isAuthenticated, updateUser, setLogout]);

  // Check if user has specific role
  const hasRole = useCallback((role: string | string[]) => {
    if (!user) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }, [user]);

  // Check if user can perform action on resource
  const canEdit = useCallback((resourceOwnerId?: number) => {
    if (!user) return false;
    
    // Admins can edit anything
    if (user.role === 'admin') return true;
    
    // Users can edit their own resources
    if (resourceOwnerId && user.id === resourceOwnerId) return true;
    
    return false;
  }, [user]);

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    
    // Utilities
    hasRole,
    canEdit,
  };
};