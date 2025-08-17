// User login endpoint
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { AuthService } from '../_shared/auth.js';
import { responses, corsResponse } from '../_shared/response.js';
import { validateInput, schemas } from '../_shared/validation.js';

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
    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validation = validateInput(schemas.userLogin, body);
    
    if (!validation.success) {
      return validation.response;
    }

    const { email, password } = validation.data;

    // Get user by email (including password hash)
    const user = await AuthService.getUserByEmail(email);
    if (!user) {
      return responses.unauthorized('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await AuthService.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return responses.unauthorized('Invalid email or password');
    }

    // Generate authentication token
    const token = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user data (without password hash) and token
    const { password_hash, ...userWithoutPassword } = user;
    
    return responses.ok({
      user: userWithoutPassword,
      token,
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return responses.badRequest('Invalid JSON in request body');
    }
    
    return responses.internalServerError('Failed to process login');
  }
};

export { handler };