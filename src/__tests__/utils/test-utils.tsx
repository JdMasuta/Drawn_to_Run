// Test utilities for React components
import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock auth store for testing
const mockAuthStore = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  updateUser: jest.fn(),
  setLoading: jest.fn(),
};

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
  },
});

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialEntries?: string[];
}

const customRender = (
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    initialEntries = ['/'],
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock user for testing
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  role: 'participant' as const,
  email_verified: true,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

// Mock admin user for testing
export const mockAdminUser = {
  ...mockUser,
  id: 2,
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin' as const,
};

// Mock organizer user for testing
export const mockOrganizerUser = {
  ...mockUser,
  id: 3,
  email: 'organizer@example.com',
  name: 'Organizer User',
  role: 'organizer' as const,
};

// Mock event for testing
export const mockEvent = {
  id: 1,
  title: 'Test 5K Run',
  description: 'A test running event',
  event_date: '2024-12-31T10:00:00.000Z',
  location: 'Test Park, Test City',
  distance_options: ['5K'],
  capacity: 100,
  registration_fee: 25.00,
  created_by: 1,
  status: 'active' as const,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  registration_count: 25,
};

// Mock API responses
export const mockApiResponse = <T,>(data: T) => ({
  success: true,
  data,
  error: null,
});

export const mockApiError = (message: string) => ({
  success: false,
  data: null,
  error: { message },
});

// Wait for loading states to resolve
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0));

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { customRender as render };
export { createTestQueryClient, mockAuthStore };