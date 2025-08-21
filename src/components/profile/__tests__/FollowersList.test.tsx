import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FollowersList } from '../FollowersList';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock components
jest.mock('../../ui/UserAvatar', () => ({
  UserAvatar: ({ user, onClick }: any) => (
    <div data-testid="user-avatar" onClick={onClick}>
      {user.name}
    </div>
  ),
}));

jest.mock('../../ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size: string }) => (
    <div data-testid="loading-spinner">{size}</div>
  ),
}));

// Mock window.location.href to avoid JSDOM navigation warnings
const mockLocationAssign = jest.fn();
delete (window as any).location;
window.location = { 
  href: '', 
  assign: mockLocationAssign,
  replace: jest.fn(),
  reload: jest.fn(),
} as any;

describe('FollowersList', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    window.location.href = '';
  });

  const renderWithProvider = (props: any) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <FollowersList {...props} />
      </QueryClientProvider>
    );
  };

  const mockFollowersResponse = {
    data: {
      followers: [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          profile_image: null,
          bio: 'Marathon runner',
          followed_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 3,
          name: 'Jane Smith',
          email: 'jane@example.com',
          profile_image: 'avatar.jpg',
          bio: 'Trail runner who loves the mountains',
          followed_at: '2024-01-02T00:00:00Z',
        },
      ],
      total: 25,
      hasMore: true,
    },
  };

  describe('Loading state', () => {
    it('should show loading spinner on initial load', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithProvider({ userId: 2 });

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toHaveTextContent('medium');
    });

    it('should not show loading spinner when loading more items', async () => {
      // Initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFollowersResponse,
      } as Response);

      renderWithProvider({ userId: 2 });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Mock loading more items
      mockFetch.mockImplementation(() => new Promise(() => {}));

      fireEvent.click(screen.getByText('Load More'));

      // Should not show main loading spinner, but show loading in button
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  describe('Successful data display', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFollowersResponse,
      } as Response);
    });

    it('should display followers list correctly', async () => {
      renderWithProvider({ userId: 2 });

      await waitFor(() => {
        expect(screen.getByText('Followers (25)')).toBeInTheDocument();
        expect(screen.getByText('People who follow this user')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should display user bio when available', async () => {
      renderWithProvider({ userId: 2 });

      await waitFor(() => {
        expect(screen.getByText('Marathon runner')).toBeInTheDocument();
        expect(screen.getByText('Trail runner who loves the mountains')).toBeInTheDocument();
      });
    });

    it('should display formatted follow dates', async () => {
      renderWithProvider({ userId: 2 });

      await waitFor(() => {
        expect(screen.getByText('Followed 1/1/2024')).toBeInTheDocument();
        expect(screen.getByText('Followed 1/2/2024')).toBeInTheDocument();
      });
    });

    it('should show Load More button when hasMore is true', async () => {
      renderWithProvider({ userId: 2 });

      await waitFor(() => {
        expect(screen.getByText('Load More')).toBeInTheDocument();
      });
    });

    it('should not show Load More button when hasMore is false', async () => {
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            ...mockFollowersResponse.data,
            hasMore: false,
          },
        }),
      } as Response);

      renderWithProvider({ userId: 2 });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no followers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            followers: [],
            total: 0,
            hasMore: false,
          },
        }),
      } as Response);

      renderWithProvider({ userId: 2 });

      await waitFor(() => {
        expect(screen.getByText('👥')).toBeInTheDocument();
        expect(screen.getByText('No followers yet')).toBeInTheDocument();
        expect(screen.getByText("This user doesn't have any followers.")).toBeInTheDocument();
      });
    });

    it('should show empty state when followers array is undefined', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            followers: undefined,
            total: 0,
            hasMore: false,
          },
        }),
      } as Response);

      renderWithProvider({ userId: 2 });

      await waitFor(() => {
        expect(screen.getByText('No followers yet')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should show error message on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to fetch followers' }),
      } as Response);

      renderWithProvider({ userId: 2 });

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch followers')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should show generic error message when error details unavailable', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithProvider({ userId: 2 });

      await waitFor(() => {
        expect(screen.getByText('Failed to load followers')).toBeInTheDocument();
      });
    });

    it('should retry on clicking Try Again button', async () => {
      // First call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      } as Response);

      renderWithProvider({ userId: 2 });

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFollowersResponse,
      } as Response);

      fireEvent.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Pagination', () => {
    it('should load more followers when Load More is clicked', async () => {
      // Initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFollowersResponse,
      } as Response);

      renderWithProvider({ userId: 2 });

      await waitFor(() => {
        expect(screen.getByText('Load More')).toBeInTheDocument();
      });

      // Load more
      const moreFollowersResponse = {
        data: {
          followers: [
            {
              id: 4,
              name: 'Bob Wilson',
              email: 'bob@example.com',
              profile_image: null,
              bio: '5K specialist',
              followed_at: '2024-01-03T00:00:00Z',
            },
          ],
          total: 25,
          hasMore: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => moreFollowersResponse,
      } as Response);

      fireEvent.click(screen.getByText('Load More'));

      await waitFor(() => {
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      });

      // Should call API with correct offset
      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/users/2/followers?limit=20&offset=20',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer mock-token',
          },
        })
      );
    });

    it('should show loading state in Load More button', async () => {
      // Initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFollowersResponse,
      } as Response);

      renderWithProvider({ userId: 2 });

      await waitFor(() => {
        expect(screen.getByText('Load More')).toBeInTheDocument();
      });

      // Mock slow loading
      mockFetch.mockImplementation(() => new Promise(() => {}));

      fireEvent.click(screen.getByText('Load More'));

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      });
    });

    it('should disable Load More button during loading', async () => {
      // Initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFollowersResponse,
      } as Response);

      renderWithProvider({ userId: 2 });

      await waitFor(() => {
        expect(screen.getByText('Load More')).toBeInTheDocument();
      });

      // Mock slow loading
      mockFetch.mockImplementation(() => new Promise(() => {}));

      fireEvent.click(screen.getByText('Load More'));

      await waitFor(() => {
        const loadMoreButton = screen.getByRole('button', { name: /loading/i });
        expect(loadMoreButton).toBeDisabled();
      });
    });
  });

  describe('User interactions', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFollowersResponse,
      } as Response);
    });

    it('should navigate to user profile when avatar is clicked', async () => {
      renderWithProvider({ userId: 2 });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const avatars = screen.getAllByTestId('user-avatar');
      fireEvent.click(avatars[0]);

      expect(window.location.href).toBe('/profile?id=1');
    });

    it('should navigate to user profile when View Profile is clicked', async () => {
      renderWithProvider({ userId: 2 });

      await waitFor(() => {
        expect(screen.getAllByText('View Profile')).toHaveLength(2);
      });

      const viewProfileButtons = screen.getAllByText('View Profile');
      fireEvent.click(viewProfileButtons[0]);

      expect(window.location.href).toBe('/profile?id=1');
    });
  });

  describe('API call structure', () => {
    it('should make correct API call with authentication', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFollowersResponse,
      } as Response);

      renderWithProvider({ userId: 2 });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/users/2/followers?limit=20&offset=0',
          {
            headers: {
              Authorization: 'Bearer mock-token',
            },
          }
        );
      });
    });

    it('should handle missing authentication token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFollowersResponse,
      } as Response);

      renderWithProvider({ userId: 2 });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/users/2/followers?limit=20&offset=0',
          {
            headers: {
              Authorization: 'Bearer null',
            },
          }
        );
      });
    });
  });

  describe('Component styling', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFollowersResponse,
      } as Response);
    });

    it('should apply custom className', async () => {
      const { container } = renderWithProvider({ userId: 2, className: 'custom-class' });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should not show bio when user has no bio', async () => {
      const responseWithoutBio = {
        data: {
          followers: [
            {
              id: 1,
              name: 'John Doe',
              email: 'john@example.com',
              profile_image: null,
              bio: null,
              followed_at: '2024-01-01T00:00:00Z',
            },
          ],
          total: 1,
          hasMore: false,
        },
      };

      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithoutBio,
      } as Response);

      renderWithProvider({ userId: 2 });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Bio should not be rendered
      expect(screen.queryByText('Marathon runner')).not.toBeInTheDocument();
    });
  });
});