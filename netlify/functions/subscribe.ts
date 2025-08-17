// Email subscription endpoint
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { Database } from './_shared/database.js';
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
    const validation = validateInput(schemas.emailSubscription, body);
    
    if (!validation.success) {
      return validation.response;
    }

    const { email } = validation.data;

    // Check if email already exists
    const existingSubscriber = await Database.queryOne(
      'SELECT id, is_active FROM email_subscribers WHERE email = $1',
      [email]
    );

    if (existingSubscriber) {
      if (existingSubscriber.is_active) {
        return responses.conflict('Email is already subscribed to our newsletter');
      } else {
        // Reactivate subscription
        await Database.query(
          'UPDATE email_subscribers SET is_active = true, subscribed_at = CURRENT_TIMESTAMP WHERE email = $1',
          [email]
        );
        
        return responses.ok({
          message: 'Successfully resubscribed to newsletter',
          email,
        });
      }
    }

    // Create new subscription
    const newSubscriber = await Database.queryOne(
      'INSERT INTO email_subscribers (email) VALUES ($1) RETURNING *',
      [email]
    );

    if (!newSubscriber) {
      return responses.internalServerError('Failed to subscribe email');
    }

    return responses.created({
      message: 'Successfully subscribed to newsletter',
      email,
      subscribed_at: newSubscriber.subscribed_at,
    });

  } catch (error) {
    console.error('Email subscription error:', error);
    
    if (error instanceof SyntaxError) {
      return responses.badRequest('Invalid JSON in request body');
    }
    
    return responses.internalServerError('Failed to process subscription');
  }
};

export { handler };