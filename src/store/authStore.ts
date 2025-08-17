// Authentication state management with Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user: User, token: string) => {
        // Store token in localStorage for API client
        localStorage.setItem('auth_token', token);
        
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        // Remove token from localStorage
        localStorage.removeItem('auth_token');
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateUser: (updatedUser: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...updatedUser },
          });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      // Only persist essential data, not loading states
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore token to localStorage after rehydration
        if (state?.token) {
          localStorage.setItem('auth_token', state.token);
        }
      },
    }
  )
);