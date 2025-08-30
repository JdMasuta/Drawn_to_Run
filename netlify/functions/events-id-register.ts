// Event registration endpoint
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
    // Extract event ID from path
    const pathParams = parsePathParams(event.path, '/api/events/[id]/register');
    const validation = validateInput(schemas.idParam, pathParams);
    
    if (!validation.success) {
      return validation.response;
    }

    const { id: eventId } = validation.data;

    if (event.httpMethod === 'GET') {
      return await getRegistrationStatus(event, eventId);
    } else if (event.httpMethod === 'POST') {
      return await registerForEvent(event, eventId);
    } else if (event.httpMethod === 'DELETE') {
      return await cancelRegistration(event, eventId);
    } else {
      return responses.badRequest('Method not allowed. Use GET, POST, or DELETE.');
    }
  } catch (error) {
    console.error('Event registration endpoint error:', error);
    return responses.internalServerError('Failed to process request');
  }
};

// GET /api/events/:id/register - Get user's registration status
async function getRegistrationStatus(event: HandlerEvent, eventId: number) {
  try {
    // Require authentication
    const authResult = await requireAuth(event.headers);
    if (!authResult.success) {
      return authResult.response;
    }

    // Check if event exists
    const existingEvent = await Database.queryOne(
      'SELECT id, title, status FROM events WHERE id = $1',
      [eventId]
    );

    if (!existingEvent) {
      return responses.notFound('Event not found');
    }

    // Get user's registration for this event
    const registration = await Database.queryOne(`
      SELECT 
        r.*,
        e.title as event_title
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.event_id = $1 AND r.user_id = $2
    `, [eventId, authResult.user.id]);

    return responses.ok({
      is_registered: !!registration,
      registration: registration || null,
    });

  } catch (error) {
    console.error('Get registration status error:', error);
    return responses.internalServerError('Failed to get registration status');
  }
}

// POST /api/events/:id/register - Register for event
async function registerForEvent(event: HandlerEvent, eventId: number) {
  try {
    // Require authentication
    const authResult = await requireAuth(event.headers);
    if (!authResult.success) {
      return authResult.response;
    }

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validation = validateInput(schemas.eventRegistration, body);
    
    if (!validation.success) {
      return validation.response;
    }

    const { distance } = validation.data;

    // Get event details with capacity info
    const eventDetails = await Database.queryOne(`
      SELECT 
        e.*,
        COUNT(r.id) as current_registrations
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'registered'
      WHERE e.id = $1
      GROUP BY e.id
    `, [eventId]);

    if (!eventDetails) {
      return responses.notFound('Event not found');
    }

    // Check if event is active
    if (eventDetails.status !== 'active') {
      return responses.badRequest('Cannot register for inactive events');
    }

    // Check if event is in the future
    const eventDate = new Date(eventDetails.event_date);
    if (eventDate < new Date()) {
      return responses.badRequest('Cannot register for past events');
    }

    // Check if distance is available
    if (!eventDetails.distance_options.includes(distance)) {
      return responses.badRequest(`Distance "${distance}" is not available for this event`);
    }

    // Check capacity limits
    const currentRegistrations = parseInt(eventDetails.current_registrations || '0');
    if (eventDetails.capacity && currentRegistrations >= eventDetails.capacity) {
      return responses.conflict('Event is at full capacity');
    }

    // Check if user is already registered
    const existingRegistration = await Database.queryOne(
      'SELECT id FROM registrations WHERE event_id = $1 AND user_id = $2',
      [eventId, authResult.user.id]
    );

    if (existingRegistration) {
      return responses.conflict('You are already registered for this event');
    }

    // Create registration
    const registration = await Database.queryOne(`
      INSERT INTO registrations (user_id, event_id, distance)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [authResult.user.id, eventId, distance]);

    if (!registration) {
      return responses.internalServerError('Failed to create registration');
    }

    // Return registration with event details
    const registrationWithEvent = {
      ...registration,
      event: {
        id: eventDetails.id,
        title: eventDetails.title,
        event_date: eventDetails.event_date,
        location: eventDetails.location,
      },
      user: {
        id: authResult.user.id,
        name: authResult.user.name,
        email: authResult.user.email,
      },
    };

    return responses.created(registrationWithEvent);

  } catch (error) {
    console.error('Register for event error:', error);
    
    if (error instanceof SyntaxError) {
      return responses.badRequest('Invalid JSON in request body');
    }
    
    return responses.internalServerError('Failed to register for event');
  }
}

// DELETE /api/events/:id/register - Cancel registration
async function cancelRegistration(event: HandlerEvent, eventId: number) {
  try {
    // Require authentication
    const authResult = await requireAuth(event.headers);
    if (!authResult.success) {
      return authResult.response;
    }

    // Check if registration exists
    const registration = await Database.queryOne(`
      SELECT 
        r.*,
        e.title as event_title,
        e.event_date
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.event_id = $1 AND r.user_id = $2
    `, [eventId, authResult.user.id]);

    if (!registration) {
      return responses.notFound('Registration not found');
    }

    // Check if event is in the future (allow cancellation up to event date)
    const eventDate = new Date(registration.event_date);
    if (eventDate < new Date()) {
      return responses.badRequest('Cannot cancel registration for past events');
    }

    // Delete registration
    await Database.query(
      'DELETE FROM registrations WHERE event_id = $1 AND user_id = $2',
      [eventId, authResult.user.id]
    );

    return responses.ok({
      message: 'Registration cancelled successfully',
      cancelled_registration: {
        id: registration.id,
        event_title: registration.event_title,
        distance: registration.distance,
      },
    });

  } catch (error) {
    console.error('Cancel registration error:', error);
    return responses.internalServerError('Failed to cancel registration');
  }
}

export { handler };