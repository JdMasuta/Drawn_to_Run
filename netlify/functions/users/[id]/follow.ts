import { createResponse } from '../../_shared/response';
import { authenticateToken } from '../../_shared/auth';
import { FollowController } from '../../../../src/controllers/FollowController';

export default async (request: Request, context: any) => {
  const url = new URL(request.url);
  const targetUserId = parseInt(context.params.id);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return createResponse(200, { message: 'OK' });
  }

  try {
    // Authenticate user
    const authResult = await authenticateToken(request);
    if (!authResult.success || !authResult.user) {
      return createResponse(401, { error: 'Authentication required' });
    }

    const currentUserId = authResult.user.id;

    // Validate target user ID
    if (isNaN(targetUserId)) {
      return createResponse(400, { error: 'Invalid user ID' });
    }

    if (request.method === 'POST') {
      // Follow user
      try {
        const result = await FollowController.followUser(currentUserId, targetUserId);
        return createResponse(200, result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to follow user';
        return createResponse(400, { error: message });
      }
    }

    if (request.method === 'DELETE') {
      // Unfollow user
      try {
        const result = await FollowController.unfollowUser(currentUserId, targetUserId);
        return createResponse(200, result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to unfollow user';
        return createResponse(400, { error: message });
      }
    }

    if (request.method === 'GET') {
      // Check if following
      try {
        const isFollowing = await FollowController.checkIsFollowing(currentUserId, targetUserId);
        const followCounts = await FollowController.getFollowCounts(targetUserId);
        
        return createResponse(200, {
          isFollowing,
          targetUserId,
          followerCount: followCounts.followers,
          followingCount: followCounts.following,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to check follow status';
        return createResponse(500, { error: message });
      }
    }

    return createResponse(405, { error: 'Method not allowed' });

  } catch (error) {
    console.error('Follow endpoint error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};