// User logout endpoint
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { responses, corsResponse } from './_shared/response.js';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return corsResponse();
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return responses.badRequest('Method not allowed. Use POST.');
  }

  try {
    // Since we're using stateless JWT tokens, logout is primarily handled client-side
    // The client should remove the token from storage
    // For enhanced security, we could implement a token blacklist in the future
    
    return responses.ok({
      message: 'Successfully logged out',
      instructions: 'Remove the authentication token from client storage',
    });

  } catch (error) {
    console.error('Logout error:', error);
    return responses.internalServerError('Failed to process logout');
  }
};

export { handler };