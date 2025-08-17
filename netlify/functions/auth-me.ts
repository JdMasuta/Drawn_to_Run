// Get current user profile endpoint
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { requireAuth } from './_shared/auth.js';
import { responses, corsResponse } from './_shared/response.js';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return corsResponse();
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return responses.badRequest('Method not allowed. Use GET.');
  }

  try {
    // Require authentication
    const authResult = await requireAuth(event.headers);
    if (!authResult.success) {
      return authResult.response;
    }

    // Return user profile
    return responses.ok({
      user: authResult.user,
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    return responses.internalServerError('Failed to get user profile');
  }
};

export { handler };