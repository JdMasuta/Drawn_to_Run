// Mock SQL function must be declared first
const mockSql = jest.fn();

// Mock the neon database connection module
jest.mock('@netlify/neon', () => ({
  neon: jest.fn(() => mockSql),
}));

import { FollowController } from '../FollowController';

describe('FollowController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('followUser', () => {
    it('should successfully follow a user', async () => {
      // Mock database responses
      mockSql
        .mockResolvedValueOnce([{ id: 1 }]) // follower exists
        .mockResolvedValueOnce([{ id: 2 }]) // following exists
        .mockResolvedValueOnce([]) // not already following
        .mockResolvedValueOnce(undefined) // insert follow
        .mockResolvedValueOnce([{ count: '5' }]) // follower count
        .mockResolvedValueOnce([{ count: '3' }]); // following count

      const result = await FollowController.followUser(1, 2);

      expect(result).toEqual({
        success: true,
        message: 'Successfully followed user',
        followerCount: 5,
        followingCount: 3,
      });

      expect(mockSql).toHaveBeenCalledTimes(6);
    });

    it('should throw error when trying to follow yourself', async () => {
      await expect(FollowController.followUser(1, 1)).rejects.toThrow(
        'Users cannot follow themselves'
      );
    });

    it('should throw error when follower does not exist', async () => {
      mockSql
        .mockResolvedValueOnce([]) // follower doesn't exist
        .mockResolvedValueOnce([{ id: 2 }]); // following exists

      await expect(FollowController.followUser(1, 2)).rejects.toThrow(
        'Follower user not found'
      );
    });

    it('should throw error when user to follow does not exist', async () => {
      mockSql
        .mockResolvedValueOnce([{ id: 1 }]) // follower exists
        .mockResolvedValueOnce([]); // following doesn't exist

      await expect(FollowController.followUser(1, 2)).rejects.toThrow(
        'User to follow not found'
      );
    });

    it('should throw error when already following', async () => {
      mockSql
        .mockResolvedValueOnce([{ id: 1 }]) // follower exists
        .mockResolvedValueOnce([{ id: 2 }]) // following exists
        .mockResolvedValueOnce([{ id: 1 }]); // already following

      await expect(FollowController.followUser(1, 2)).rejects.toThrow(
        'Already following this user'
      );
    });

    it('should validate input parameters', async () => {
      await expect(FollowController.followUser(-1, 2)).rejects.toThrow();
      await expect(FollowController.followUser(1, -2)).rejects.toThrow();
      await expect(FollowController.followUser(0, 2)).rejects.toThrow();
    });
  });

  describe('unfollowUser', () => {
    it('should successfully unfollow a user', async () => {
      mockSql
        .mockResolvedValueOnce([{ id: 1 }]) // follow relationship exists
        .mockResolvedValueOnce(undefined) // delete follow
        .mockResolvedValueOnce([{ count: '4' }]) // updated follower count
        .mockResolvedValueOnce([{ count: '2' }]); // updated following count

      const result = await FollowController.unfollowUser(1, 2);

      expect(result).toEqual({
        success: true,
        message: 'Successfully unfollowed user',
        followerCount: 4,
        followingCount: 2,
      });

      expect(mockSql).toHaveBeenCalledTimes(4);
    });

    it('should throw error when not following user', async () => {
      mockSql.mockResolvedValueOnce([]); // no follow relationship

      await expect(FollowController.unfollowUser(1, 2)).rejects.toThrow(
        'Not following this user'
      );
    });

    it('should validate input parameters', async () => {
      await expect(FollowController.unfollowUser(-1, 2)).rejects.toThrow();
      await expect(FollowController.unfollowUser(1, -2)).rejects.toThrow();
    });
  });

  describe('getFollowers', () => {
    it('should return followers list with pagination', async () => {
      const mockFollowers = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          profile_image: null,
          bio: 'Runner',
          followed_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 3,
          name: 'Jane Smith',
          email: 'jane@example.com',
          profile_image: 'avatar.jpg',
          bio: 'Marathon runner',
          followed_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockSql
        .mockResolvedValueOnce(mockFollowers) // followers query
        .mockResolvedValueOnce([{ count: '25' }]); // total count

      const result = await FollowController.getFollowers(2, 20, 0);

      expect(result).toEqual({
        followers: mockFollowers,
        total: 25,
        hasMore: true,
      });
    });

    it('should handle pagination correctly', async () => {
      mockSql
        .mockResolvedValueOnce([]) // followers query
        .mockResolvedValueOnce([{ count: '15' }]); // total count

      const result = await FollowController.getFollowers(2, 20, 10);

      expect(result.hasMore).toBe(false);
    });

    it('should use default pagination values', async () => {
      mockSql
        .mockResolvedValueOnce([]) // followers query
        .mockResolvedValueOnce([{ count: '0' }]); // total count

      await FollowController.getFollowers(2);

      // Check that default limit (20) and offset (0) were used in the SQL query
      // SQL template literals are called with template parts and values separately
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('LIMIT'),
          expect.stringContaining('OFFSET')
        ]),
        2, 20, 0
      );
    });
  });

  describe('getFollowing', () => {
    it('should return following list with pagination', async () => {
      const mockFollowing = [
        {
          id: 2,
          name: 'Alice Johnson',
          email: 'alice@example.com',
          profile_image: null,
          bio: 'Trail runner',
          followed_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSql
        .mockResolvedValueOnce(mockFollowing) // following query
        .mockResolvedValueOnce([{ count: '10' }]); // total count

      const result = await FollowController.getFollowing(1, 20, 0);

      expect(result).toEqual({
        following: mockFollowing,
        total: 10,
        hasMore: false,
      });
    });

    it('should handle empty following list', async () => {
      mockSql
        .mockResolvedValueOnce([]) // following query
        .mockResolvedValueOnce([{ count: '0' }]); // total count

      const result = await FollowController.getFollowing(1);

      expect(result.following).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('checkIsFollowing', () => {
    it('should return true when user is following', async () => {
      mockSql.mockResolvedValueOnce([{ id: 1 }]); // follow relationship exists

      const result = await FollowController.checkIsFollowing(1, 2);

      expect(result).toBe(true);
    });

    it('should return false when user is not following', async () => {
      mockSql.mockResolvedValueOnce([]); // no follow relationship

      const result = await FollowController.checkIsFollowing(1, 2);

      expect(result).toBe(false);
    });
  });

  describe('getFollowCounts', () => {
    it('should return correct follower and following counts', async () => {
      mockSql
        .mockResolvedValueOnce([{ count: '15' }]) // follower count
        .mockResolvedValueOnce([{ count: '8' }]); // following count

      const result = await FollowController.getFollowCounts(1);

      expect(result).toEqual({
        followers: 15,
        following: 8,
      });
    });

    it('should handle zero counts', async () => {
      mockSql
        .mockResolvedValueOnce([{ count: '0' }]) // follower count
        .mockResolvedValueOnce([{ count: '0' }]); // following count

      const result = await FollowController.getFollowCounts(1);

      expect(result).toEqual({
        followers: 0,
        following: 0,
      });
    });
  });

  describe('Error handling', () => {
    it('should handle database errors in followUser', async () => {
      mockSql.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(FollowController.followUser(1, 2)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle database errors in getFollowers', async () => {
      mockSql.mockRejectedValueOnce(new Error('Query failed'));

      await expect(FollowController.getFollowers(1)).rejects.toThrow(
        'Query failed'
      );
    });

    it('should handle database errors in checkIsFollowing', async () => {
      mockSql.mockRejectedValueOnce(new Error('Connection timeout'));

      await expect(FollowController.checkIsFollowing(1, 2)).rejects.toThrow(
        'Connection timeout'
      );
    });
  });
});