import { createResponse } from '../../_shared/response';
import { authenticateToken } from '../../_shared/auth';
import { FollowController } from '../../../../src/controllers/FollowController';

export default async (request: Request, context: any) => {
  const url = new URL(request.url);
  const userId = parseInt(context.params.id);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return createResponse(200, { message: 'OK' });
  }

  if (request.method !== 'GET') {
    return createResponse(405, { error: 'Method not allowed' });
  }

  try {
    // Validate user ID
    if (isNaN(userId)) {
      return createResponse(400, { error: 'Invalid user ID' });
    }

    // Get pagination parameters
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      return createResponse(400, { error: 'Limit must be between 1 and 100' });
    }
    if (offset < 0) {
      return createResponse(400, { error: 'Offset must be non-negative' });
    }

    // Get following
    const result = await FollowController.getFollowing(userId, limit, offset);
    
    return createResponse(200, {
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Get following error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get following list';
    return createResponse(500, { error: message });
  }
};