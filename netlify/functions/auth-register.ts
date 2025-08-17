// User registration endpoint
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { AuthService } from './_shared/auth.js';
import { responses, corsResponse } from './_shared/response.js';
import { validateInput, schemas } from './_shared/validation.js';

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
    const validation = validateInput(schemas.userRegistration, body);
    
    if (!validation.success) {
      return validation.response;
    }

    const { email, name, password, role } = validation.data;

    // Check if email already exists
    const emailExists = await AuthService.emailExists(email);
    if (emailExists) {
      return responses.conflict('Email address is already registered');
    }

    // Create new user
    const user = await AuthService.createUser({
      email,
      name,
      password,
      role,
    });

    if (!user) {
      return responses.internalServerError('Failed to create user account');
    }

    // Generate authentication token
    const token = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user data and token
    return responses.created({
      user,
      token,
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return responses.badRequest('Invalid JSON in request body');
    }
    
    return responses.internalServerError('Failed to process registration');
  }
};

export { handler };