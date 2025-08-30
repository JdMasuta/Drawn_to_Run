// User follow/unfollow endpoint
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { Database } from './_shared/database.js';
import { requireAuth } from './_shared/auth.js';
import { responses, corsResponse } from './_shared/response.js';
import { validateInput, schemas, parsePathParams } from './_shared/validation.js';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return corsResponse();
  }

  try {
    // Extract target user ID from path
    const pathParams = parsePathParams(event.path, '/api/users/[id]/follow');
    const validation = validateInput(schemas.idParam, pathParams);
    
    if (!validation.success) {
      return validation.response;
    }

    const { id: targetUserId } = validation.data;

    // Require authentication
    const authResult = await requireAuth(event.headers);
    if (!authResult.success) {
      return authResult.response;
    }

    const currentUserId = authResult.user.id;

    // Prevent self-following
    if (currentUserId === targetUserId) {
      return responses.badRequest('Cannot follow yourself');
    }

    // Check if target user exists
    const targetUser = await Database.queryOne(
      'SELECT id, name FROM users WHERE id = $1',
      [targetUserId]
    );

    if (!targetUser) {
      return responses.notFound('User not found');
    }

    if (event.httpMethod === 'POST') {
      // Follow user
      try {
        await Database.query(`
          INSERT INTO user_follows (follower_id, following_id, followed_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT (follower_id, following_id) DO NOTHING
        `, [currentUserId, targetUserId]);

        return responses.ok({ message: 'User followed successfully' });
      } catch (error) {
        console.error('Follow user error:', error);
        return responses.internalServerError('Failed to follow user');
      }
    }

    if (event.httpMethod === 'DELETE') {
      // Unfollow user
      try {
        const result = await Database.query(
          'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2',
          [currentUserId, targetUserId]
        );

        return responses.ok({ message: 'User unfollowed successfully' });
      } catch (error) {
        console.error('Unfollow user error:', error);
        return responses.internalServerError('Failed to unfollow user');
      }
    }

    if (event.httpMethod === 'GET') {
      // Check if following and get counts
      try {
        const isFollowingResult = await Database.queryOne(
          'SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2',
          [currentUserId, targetUserId]
        );

        const followCounts = await Database.queryOne(`
          SELECT 
            (SELECT COUNT(*) FROM user_follows WHERE following_id = $1) as followers,
            (SELECT COUNT(*) FROM user_follows WHERE follower_id = $1) as following
        `, [targetUserId]);
        
        return responses.ok({
          isFollowing: !!isFollowingResult,
          targetUserId,
          followerCount: parseInt(followCounts?.followers || '0'),
          followingCount: parseInt(followCounts?.following || '0'),
        });
      } catch (error) {
        console.error('Check follow status error:', error);
        return responses.internalServerError('Failed to check follow status');
      }
    }

    return responses.badRequest('Method not allowed. Use GET, POST, or DELETE.');

  } catch (error) {
    console.error('Follow endpoint error:', error);
    return responses.internalServerError('Failed to process request');
  }
};

export { handler };