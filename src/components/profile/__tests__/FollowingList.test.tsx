import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FollowingList } from '../FollowingList';

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

describe('FollowingList', () => {
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
        <FollowingList {...props} />
      </QueryClientProvider>
    );
  };

  const mockFollowingResponse = {
    data: {
      following: [
        {
          id: 3,
          name: 'Alice Johnson',
          email: 'alice@example.com',
          profile_image: 'avatar1.jpg',
          bio: 'Ultra marathon enthusiast',
          followed_at: '2024-01-15T00:00:00Z',
        },
        {
          id: 4,
          name: 'Bob Rodriguez',
          email: 'bob@example.com',
          profile_image: null,
          bio: null,
          followed_at: '2024-01-20T00:00:00Z',
        },
      ],
      total: 12,
      hasMore: true,
    },
  };

  describe('Loading state', () => {
    it('should show loading spinner on initial load', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithProvider({ userId: 1 });

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toHaveTextContent('medium');
    });

    it('should not show main loading spinner when loading more items', async () => {
      // Initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFollowingResponse,
      } as Response);

      renderWithProvider({ userId: 1 });

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Mock loading more items
      mockFetch.mockImplementation(() => new Promise(() => {}));

      fireEvent.click(screen.getByText('Load More'));

      // Should not show main loading spinner
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  describe('Successful data display', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFollowingResponse,
      } as Response);
    });

    it('should display following list correctly', async () => {
      renderWithProvider({ userId: 1 });

      await waitFor(() => {
        expect(screen.getByText('Following (12)')).toBeInTheDocument();
        expect(screen.getByText('People this user follows')).toBeInTheDocument();
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.getByText('Bob Rodriguez')).toBeInTheDocument();
      });
    });

    it('should display user bio when available', async () => {
      renderWithProvider({ userId: 1 });

      await waitFor(() => {
        expect(screen.getByText('Ultra marathon enthusiast')).toBeInTheDocument();
      });
    });

    it('should not display bio section when user has no bio', async () => {
      renderWithProvider({ userId: 1 });

      await waitFor(() => {
        expect(screen.getByText('Bob Rodriguez')).toBeInTheDocument();
      });

      // Bob Rodriguez has no bio, so bio text should not appear
      const bobContainer = screen.getByText('Bob Rodriguez').closest('div');
      expect(bobContainer).not.toHaveTextContent('Ultra marathon enthusiast');
    });

    it('should display formatted follow dates', async () => {
      renderWithProvider({ userId: 1 });

      await waitFor(() => {
        expect(screen.getByText('Followed 1/15/2024')).toBeInTheDocument();
        expect(screen.getByText('Followed 1/20/2024')).toBeInTheDocument();
      });
    });

    it('should show Load More button when hasMore is true', async () => {
      renderWithProvider({ userId: 1 });

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
            ...mockFollowingResponse.data,
            hasMore: false,
          },
        }),
      } as Response);

      renderWithProvider({ userId: 1 });

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should show empty state when not following anyone', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            following: [],
            total: 0,
            hasMore: false,
          },
        }),
      } as Response);

      renderWithProvider({ userId: 1 });

      await waitFor(() => {
        expect(screen.getByText('👤')).toBeInTheDocument();
        expect(screen.getByText('Not following anyone')).toBeInTheDocument();
        expect(screen.getByText("This user isn't following anyone yet.")).toBeInTheDocument();
      });
    });

    it('should show empty state when following array is undefined', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            following: undefined,
            total: 0,
            hasMore: false,
          },
        }),
      } as Response);

      renderWithProvider({ userId: 1 });

      await waitFor(() => {
        expect(screen.getByText('Not following anyone')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should show error message on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to get following list' }),
      } as Response);

      renderWithProvider({ userId: 1 });

      await waitFor(() => {
        expect(screen.getByText('Failed to get following list')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should show generic error message when error details unavailable', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      renderWithProvider({ userId: 1 });

      await waitFor(() => {
        expect(screen.getByText('Failed to load following list')).toBeInTheDocument();
      });
    });

    it('should retry on clicking Try Again button', async () => {
      // First call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Temporary server error' }),
      } as Response);

      renderWithProvider({ userId: 1 });

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFollowingResponse,
      } as Response);

      fireEvent.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Pagination', () => {
    it('should load more following when Load More is clicked', async () => {
      // Initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFollowingResponse,
      } as Response);

      renderWithProvider({ userId: 1 });

      await waitFor(() => {
        expect(screen.getByText('Load More')).toBeInTheDocument();
      });

      // Load more
      const moreFollowingResponse = {
        data: {
          following: [
            {
              id: 5,
              name: 'Charlie Davis',
              email: 'charlie@example.com',
              profile_image: 'avatar2.jpg',
              bio: 'Sprint specialist',
              followed_at: '2024-01-25T00:00:00Z',
            },
          ],
          total: 12,
          hasMore: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => moreFollowingResponse,
      } as Response);

      fireEvent.click(screen.getByText('Load More'));

      await waitFor(() => {
        expect(screen.getByText('Charlie Davis')).toBeInTheDocument();
      });

      // Should call API with correct offset
      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/users/1/following?limit=20&offset=20',
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
        json: async () => mockFollowingResponse,
      } as Response);

      renderWithProvider({ userId: 1 });

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
        json: async () => mockFollowingResponse,
      } as Response);

      renderWithProvider({ userId: 1 });

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
        json: async () => mockFollowingResponse,
      } as Response);
    });

    it('should navigate to user profile when avatar is clicked', async () => {
      renderWithProvider({ userId: 1 });

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      const avatars = screen.getAllByTestId('user-avatar');
      fireEvent.click(avatars[0]);

      expect(window.location.href).toBe('/profile?id=3');
    });

    it('should navigate to user profile when View Profile is clicked', async () => {
      renderWithProvider({ userId: 1 });

      await waitFor(() => {
        expect(screen.getAllByText('View Profile')).toHaveLength(2);
      });

      const viewProfileButtons = screen.getAllByText('View Profile');
      fireEvent.click(viewProfileButtons[1]); // Click second button (Bob)

      expect(window.location.href).toBe('/profile?id=4');
    });
  });

  describe('API call structure', () => {
    it('should make correct API call with authentication', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFollowingResponse,
      } as Response);

      renderWithProvider({ userId: 1 });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/users/1/following?limit=20&offset=0',
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
        json: async () => mockFollowingResponse,
      } as Response);

      renderWithProvider({ userId: 1 });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/users/1/following?limit=20&offset=0',
          {
            headers: {
              Authorization: 'Bearer null',
            },
          }
        );
      });
    });

    it('should use correct API endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFollowingResponse,
      } as Response);

      renderWithProvider({ userId: 42 });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/users/42/following?limit=20&offset=0',
          expect.any(Object)
        );
      });
    });
  });

  describe('Component styling', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFollowingResponse,
      } as Response);
    });

    it('should apply custom className', async () => {
      const { container } = renderWithProvider({ userId: 1, className: 'custom-following-class' });

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      expect(container.firstChild).toHaveClass('custom-following-class');
    });

    it('should have correct header text for following', async () => {
      renderWithProvider({ userId: 1 });

      await waitFor(() => {
        expect(screen.getByText('Following (12)')).toBeInTheDocument();
        expect(screen.getByText('People this user follows')).toBeInTheDocument();
      });
    });
  });

  describe('Data consistency', () => {
    it('should maintain correct count across pagination', async () => {
      // Initial load shows 12 total
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFollowingResponse,
      } as Response);

      renderWithProvider({ userId: 1 });

      await waitFor(() => {
        expect(screen.getByText('Following (12)')).toBeInTheDocument();
      });

      // Load more should maintain same total
      const moreResponse = {
        data: {
          following: [
            {
              id: 6,
              name: 'Diana Wilson',
              email: 'diana@example.com',
              profile_image: null,
              bio: 'Cross country runner',
              followed_at: '2024-01-30T00:00:00Z',
            },
          ],
          total: 12, // Same total
          hasMore: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => moreResponse,
      } as Response);

      fireEvent.click(screen.getByText('Load More'));

      await waitFor(() => {
        expect(screen.getByText('Diana Wilson')).toBeInTheDocument();
        // Header should still show same count
        expect(screen.getByText('Following (12)')).toBeInTheDocument();
      });
    });

    it('should handle edge case with zero total but items present', async () => {
      const inconsistentResponse = {
        data: {
          following: [
            {
              id: 7,
              name: 'Edge Case User',
              email: 'edge@example.com',
              profile_image: null,
              bio: null,
              followed_at: '2024-01-01T00:00:00Z',
            },
          ],
          total: 0, // Inconsistent with having items
          hasMore: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => inconsistentResponse,
      } as Response);

      renderWithProvider({ userId: 1 });

      await waitFor(() => {
        expect(screen.getByText('Following (0)')).toBeInTheDocument();
        expect(screen.getByText('Edge Case User')).toBeInTheDocument();
      });
    });
  });
});