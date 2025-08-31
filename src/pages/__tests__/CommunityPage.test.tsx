import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CommunityPage from '../CommunityPage';

// Mock useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the React Query hooks
jest.mock('../../hooks/useStats', () => ({
  useCommunityStats: jest.fn(),
}));

jest.mock('../../hooks/usePublicActivityFeed', () => ({
  usePublicActivityFeed: jest.fn(),
}));

const mockUseAuth = require('../../hooks/useAuth').useAuth as jest.MockedFunction<any>;
const mockUseCommunityStats = require('../../hooks/useStats').useCommunityStats as jest.MockedFunction<any>;
const mockUsePublicActivityFeed = require('../../hooks/usePublicActivityFeed').usePublicActivityFeed as jest.MockedFunction<any>;

const renderWithRouter = (component: React.ReactElement, authState = { isAuthenticated: false }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  mockUseAuth.mockReturnValue({
    user: authState.isAuthenticated ? { id: 1, name: 'Test User', email: 'test@example.com' } : null,
    isLoading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    ...authState,
  });

  // Mock the React Query hooks with default data
  mockUseCommunityStats.mockReturnValue({
    data: {
      community: {
        totalUsers: 500,
        activeMembers: 350,
        totalEvents: 150,
        totalRegistrations: 850,
        totalCities: 25,
        estimatedMilesRun: 2500,
      },
      growth: {
        recentUsers: 45,
        growthRate: 12,
      },
      engagement: {
        averageEventsPerUser: 2.8,
        averageRegistrationsPerEvent: 5.7,
      }
    },
    isLoading: false,
    error: null,
  });

  mockUsePublicActivityFeed.mockReturnValue({
    data: {
      activities: [
        {
          id: 'placeholder-1',
          type: 'registration',
          user: {
            initials: 'JD',
            displayName: 'John D.',
            avatarColor: 'bg-blue-500',
          },
          event: {
            id: 1,
            title: 'Central Park 5K Fun Run',
          },
          message: 'registered for the',
          distance: '5K',
          timeAgo: '2 hours ago',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'placeholder-2',
          type: 'registration',
          user: {
            initials: 'SM',
            displayName: 'Sarah M.',
            avatarColor: 'bg-green-500',
          },
          event: {
            id: 2,
            title: 'Brooklyn Bridge 10K',
          },
          message: 'registered for the',
          distance: '10K',
          timeAgo: '5 hours ago',
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'placeholder-3',
          type: 'comment',
          user: {
            initials: 'MR',
            displayName: 'Mike R.',
            avatarColor: 'bg-orange-500',
          },
          event: {
            id: 3,
            title: 'Marathon Training Tips',
          },
          message: 'commented on',
          content: 'Great advice for beginners!',
          timeAgo: '1 day ago',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      total: 3,
    },
    isLoading: false,
    error: null,
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('CommunityPage', () => {
  describe('Content and Layout', () => {
    it('renders the main heading', () => {
      renderWithRouter(<CommunityPage />);
      expect(screen.getByRole('heading', { name: /join our running community/i })).toBeInTheDocument();
    });

    it('renders the subtitle', () => {
      renderWithRouter(<CommunityPage />);
      expect(screen.getByText(/connect with fellow runners, share experiences/i)).toBeInTheDocument();
    });

    it('renders all three community features cards', () => {
      renderWithRouter(<CommunityPage />);
      expect(screen.getByRole('heading', { name: /follow runners/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /share & discuss/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /event community/i })).toBeInTheDocument();
    });

    it('renders community highlights section', () => {
      renderWithRouter(<CommunityPage />);
      expect(screen.getByRole('heading', { name: /community highlights/i })).toBeInTheDocument();
      expect(screen.getByText('350+')).toBeInTheDocument();
      expect(screen.getByText('Active Members')).toBeInTheDocument();
    });

    it('renders getting started section', () => {
      renderWithRouter(<CommunityPage />);
      expect(screen.getByRole('heading', { name: /getting started/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /for new members/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /community guidelines/i })).toBeInTheDocument();
    });

    it('renders recent activity section', () => {
      renderWithRouter(<CommunityPage />);
      expect(screen.getByRole('heading', { name: /recent community activity/i })).toBeInTheDocument();
      expect(screen.getByText(/john d\./i)).toBeInTheDocument();
      expect(screen.getByText(/sarah m\./i)).toBeInTheDocument();
      expect(screen.getByText(/mike r\./i)).toBeInTheDocument();
    });
  });

  describe('Authentication-based UI', () => {
    it('shows join community and sign in buttons when not authenticated', () => {
      renderWithRouter(<CommunityPage />);
      expect(screen.getByRole('link', { name: /join community/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows discover events button when authenticated', () => {
      renderWithRouter(<CommunityPage />, { isAuthenticated: true });
      expect(screen.getByRole('link', { name: /discover events/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /join community/i })).not.toBeInTheDocument();
    });

    it('shows "view full feed" link when authenticated', () => {
      renderWithRouter(<CommunityPage />, { isAuthenticated: true });
      expect(screen.getByRole('link', { name: /view full feed/i })).toBeInTheDocument();
    });

    it('shows "join to see full activity" text when not authenticated', () => {
      renderWithRouter(<CommunityPage />);
      expect(screen.getByText(/join to see full activity/i)).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('has correct navigation links for unauthenticated users', () => {
      renderWithRouter(<CommunityPage />);
      
      const joinLink = screen.getByRole('link', { name: /join community/i });
      expect(joinLink).toHaveAttribute('href', '/register');

      const signInLink = screen.getByRole('link', { name: /sign in/i });
      expect(signInLink).toHaveAttribute('href', '/login');
    });

    it('has correct navigation links for authenticated users', () => {
      renderWithRouter(<CommunityPage />, { isAuthenticated: true });
      
      const discoverLink = screen.getByRole('link', { name: /discover events/i });
      expect(discoverLink).toHaveAttribute('href', '/events');

      const feedLink = screen.getByRole('link', { name: /view full feed/i });
      expect(feedLink).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderWithRouter(<CommunityPage />);
      
      // Main page heading should be h1
      const mainHeading = screen.getByRole('heading', { name: /join our running community/i });
      expect(mainHeading.tagName).toBe('H1');

      // Section headings should exist
      expect(screen.getByRole('heading', { name: /community highlights/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /getting started/i })).toBeInTheDocument();
    });

    it('has proper semantic structure', () => {
      renderWithRouter(<CommunityPage />);
      
      // Check for list structures in guidelines
      const lists = screen.getAllByRole('list');
      expect(lists.length).toBeGreaterThan(0);
    });
  });

  describe('Content Quality', () => {
    it('includes engaging community statistics', () => {
      renderWithRouter(<CommunityPage />);
      expect(screen.getByText('350+')).toBeInTheDocument();
      expect(screen.getByText('150+')).toBeInTheDocument();
      expect(screen.getByText('2,500+')).toBeInTheDocument();
      expect(screen.getByText('25+')).toBeInTheDocument();
    });

    it('provides clear getting started guidance', () => {
      renderWithRouter(<CommunityPage />);
      expect(screen.getByText(/create your free account/i)).toBeInTheDocument();
      expect(screen.getByText(/browse and register for upcoming/i)).toBeInTheDocument();
      expect(screen.getByText(/follow other runners/i)).toBeInTheDocument();
    });

    it('includes community guidelines', () => {
      renderWithRouter(<CommunityPage />);
      expect(screen.getByText(/be supportive and encouraging/i)).toBeInTheDocument();
      expect(screen.getByText(/share constructive advice/i)).toBeInTheDocument();
      expect(screen.getByText(/respect diverse running abilities/i)).toBeInTheDocument();
    });
  });
});