// User followers endpoint
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { Database } from './_shared/database.js';
import { responses, corsResponse } from './_shared/response.js';
import { validateInput, schemas, parsePathParams, parseQueryParams } from './_shared/validation.js';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return corsResponse();
  }

  try {
    // Extract user ID from path
    const pathParams = parsePathParams(event.path, '/api/users/[id]/followers');
    const validation = validateInput(schemas.idParam, pathParams);
    
    if (!validation.success) {
      return validation.response;
    }

    const { id: userId } = validation.data;

    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
      return responses.badRequest('Method not allowed. Use GET.');
    }

    // Check if user exists
    const user = await Database.queryOne(
      'SELECT id, name FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      return responses.notFound('User not found');
    }

    // Parse query parameters for pagination
    const queryParams = parseQueryParams(event.rawUrl || `${event.headers.host}${event.path}?${event.rawQuery || ''}`);
    const page = parseInt(queryParams.page || '1');
    const limit = Math.min(parseInt(queryParams.limit || '20'), 100);

    // Get followers with user details
    const followers = await Database.query(`
      SELECT 
        u.id,
        u.name,
        u.profile_image,
        u.bio,
        uf.followed_at
      FROM user_follows uf
      JOIN users u ON uf.follower_id = u.id
      WHERE uf.following_id = $1
      ORDER BY uf.followed_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, (page - 1) * limit]);

    // Get total count for pagination
    const totalResult = await Database.queryOne<{ total: string }>(
      'SELECT COUNT(*) as total FROM user_follows WHERE following_id = $1',
      [userId]
    );

    const total = parseInt(totalResult?.total || '0');
    const totalPages = Math.ceil(total / limit);

    return responses.ok(followers || [], {
      page,
      limit,
      total,
      totalPages,
    });

  } catch (error) {
    console.error('Get followers error:', error);
    return responses.internalServerError('Failed to fetch followers');
  }
};

export { handler };