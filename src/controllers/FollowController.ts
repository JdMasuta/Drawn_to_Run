import { neon } from '@netlify/neon';
import { z } from 'zod';

const sql = neon(process.env.DATABASE_URL!);

// Validation schemas
const FollowUserSchema = z.object({
  userId: z.number().int().positive(),
});

export class FollowController {
  // Follow a user
  static async followUser(followerId: number, followingId: number) {
    // Validate input
    FollowUserSchema.parse({ userId: followerId });
    FollowUserSchema.parse({ userId: followingId });

    // Prevent self-following
    if (followerId === followingId) {
      throw new Error('Users cannot follow themselves');
    }

    try {
      // Check if both users exist
      const [followerExists, followingExists] = await Promise.all([
        sql`SELECT id FROM users WHERE id = ${followerId}`,
        sql`SELECT id FROM users WHERE id = ${followingId}`,
      ]);

      if (followerExists.length === 0) {
        throw new Error('Follower user not found');
      }
      if (followingExists.length === 0) {
        throw new Error('User to follow not found');
      }

      // Check if already following
      const existingFollow = await sql`
        SELECT 1 FROM user_follows 
        WHERE follower_id = ${followerId} AND following_id = ${followingId}
      `;

      if (existingFollow.length > 0) {
        throw new Error('Already following this user');
      }

      // Create follow relationship
      await sql`
        INSERT INTO user_follows (follower_id, following_id)
        VALUES (${followerId}, ${followingId})
      `;

      // Get updated follower counts
      const [followerCount, followingCount] = await Promise.all([
        sql`SELECT COUNT(*) as count FROM user_follows WHERE following_id = ${followingId}`,
        sql`SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ${followerId}`,
      ]);

      return {
        success: true,
        message: 'Successfully followed user',
        followerCount: parseInt(followerCount[0].count),
        followingCount: parseInt(followingCount[0].count),
      };

    } catch (error) {
      throw error;
    }
  }

  // Unfollow a user
  static async unfollowUser(followerId: number, followingId: number) {
    // Validate input
    FollowUserSchema.parse({ userId: followerId });
    FollowUserSchema.parse({ userId: followingId });

    try {
      // Check if follow relationship exists
      const existingFollow = await sql`
        SELECT 1 FROM user_follows 
        WHERE follower_id = ${followerId} AND following_id = ${followingId}
      `;

      if (existingFollow.length === 0) {
        throw new Error('Not following this user');
      }

      // Remove follow relationship
      await sql`
        DELETE FROM user_follows 
        WHERE follower_id = ${followerId} AND following_id = ${followingId}
      `;

      // Get updated follower counts
      const [followerCount, followingCount] = await Promise.all([
        sql`SELECT COUNT(*) as count FROM user_follows WHERE following_id = ${followingId}`,
        sql`SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ${followerId}`,
      ]);

      return {
        success: true,
        message: 'Successfully unfollowed user',
        followerCount: parseInt(followerCount[0].count),
        followingCount: parseInt(followingCount[0].count),
      };

    } catch (error) {
      throw error;
    }
  }

  // Get user's followers
  static async getFollowers(userId: number, limit = 20, offset = 0) {
    try {
      const followers = await sql`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.profile_image,
          u.bio,
          uf.created_at as followed_at
        FROM user_follows uf
        JOIN users u ON uf.follower_id = u.id
        WHERE uf.following_id = ${userId}
        ORDER BY uf.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const totalCount = await sql`
        SELECT COUNT(*) as count FROM user_follows WHERE following_id = ${userId}
      `;

      return {
        followers,
        total: parseInt(totalCount[0].count),
        hasMore: offset + limit < parseInt(totalCount[0].count),
      };

    } catch (error) {
      throw error;
    }
  }

  // Get users that a user is following
  static async getFollowing(userId: number, limit = 20, offset = 0) {
    try {
      const following = await sql`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.profile_image,
          u.bio,
          uf.created_at as followed_at
        FROM user_follows uf
        JOIN users u ON uf.following_id = u.id
        WHERE uf.follower_id = ${userId}
        ORDER BY uf.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const totalCount = await sql`
        SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ${userId}
      `;

      return {
        following,
        total: parseInt(totalCount[0].count),
        hasMore: offset + limit < parseInt(totalCount[0].count),
      };

    } catch (error) {
      throw error;
    }
  }

  // Check if user A follows user B
  static async checkIsFollowing(followerId: number, followingId: number) {
    try {
      const result = await sql`
        SELECT 1 FROM user_follows 
        WHERE follower_id = ${followerId} AND following_id = ${followingId}
      `;

      return result.length > 0;

    } catch (error) {
      throw error;
    }
  }

  // Get follower/following counts for a user
  static async getFollowCounts(userId: number) {
    try {
      const [followerCount, followingCount] = await Promise.all([
        sql`SELECT COUNT(*) as count FROM user_follows WHERE following_id = ${userId}`,
        sql`SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ${userId}`,
      ]);

      return {
        followers: parseInt(followerCount[0].count),
        following: parseInt(followingCount[0].count),
      };

    } catch (error) {
      throw error;
    }
  }
}