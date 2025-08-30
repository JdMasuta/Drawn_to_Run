// Individual event CRUD endpoint
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { Database } from './_shared/database.js';
import { requireAuth, requireRole } from './_shared/auth.js';
import { responses, corsResponse } from './_shared/response.js';
import { validateInput, schemas, parsePathParams } from './_shared/validation.js';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return corsResponse();
  }

  try {
    // Extract event ID from path
    const pathParams = parsePathParams(event.path, '/api/events/[id]');
    const validation = validateInput(schemas.idParam, pathParams);
    
    if (!validation.success) {
      return validation.response;
    }

    const { id: eventId } = validation.data;

    if (event.httpMethod === 'GET') {
      return await getEvent(eventId);
    } else if (event.httpMethod === 'PUT') {
      return await updateEvent(event, eventId);
    } else if (event.httpMethod === 'DELETE') {
      return await deleteEvent(event, eventId);
    } else {
      return responses.badRequest('Method not allowed. Use GET, PUT, or DELETE.');
    }
  } catch (error) {
    console.error('Event endpoint error:', error);
    return responses.internalServerError('Failed to process request');
  }
};

// GET /api/events/:id - Get event details
async function getEvent(eventId: number) {
  try {
    // Get event with organizer details
    const event = await Database.queryOne(`
      SELECT 
        e.*,
        u.name as organizer_name,
        u.email as organizer_email,
        u.profile_image as organizer_image,
        COUNT(DISTINCT r.id) as registration_count,
        COUNT(DISTINCT c.id) as comment_count
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'registered'
      LEFT JOIN comments c ON e.id = c.event_id
      WHERE e.id = $1
      GROUP BY e.id, u.name, u.email, u.profile_image
    `, [eventId]);

    if (!event) {
      return responses.notFound('Event not found');
    }

    // Get event tags
    const tags = await Database.query(`
      SELECT t.id, t.name, t.category, t.color
      FROM event_tags et
      JOIN tags t ON et.tag_id = t.id
      WHERE et.event_id = $1
    `, [eventId]);

    // Format response
    const eventWithDetails = {
      ...event,
      organizer: event.organizer_name ? {
        name: event.organizer_name,
        email: event.organizer_email,
        profile_image: event.organizer_image,
      } : null,
      tags: tags || [],
      registration_count: parseInt(event.registration_count || '0'),
      comment_count: parseInt(event.comment_count || '0'),
    };

    // Remove redundant fields
    delete eventWithDetails.organizer_name;
    delete eventWithDetails.organizer_email;
    delete eventWithDetails.organizer_image;

    return responses.ok(eventWithDetails);

  } catch (error) {
    console.error('Get event error:', error);
    return responses.internalServerError('Failed to fetch event');
  }
}

// PUT /api/events/:id - Update event
async function updateEvent(event: HandlerEvent, eventId: number) {
  try {
    // Require authentication
    const authResult = await requireAuth(event.headers);
    if (!authResult.success) {
      return authResult.response;
    }

    // Check if event exists and get current data
    const existingEvent = await Database.queryOne(
      'SELECT id, created_by, status FROM events WHERE id = $1',
      [eventId]
    );

    if (!existingEvent) {
      return responses.notFound('Event not found');
    }

    // Check authorization (event creator or admin)
    if (existingEvent.created_by !== authResult.user.id && authResult.user.role !== 'admin') {
      return responses.forbidden('You can only update events you created');
    }

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validation = validateInput(schemas.eventUpdate, body);
    
    if (!validation.success) {
      return validation.response;
    }

    const updateData = validation.data;

    // Prevent updates to completed events (unless admin)
    if (existingEvent.status === 'completed' && authResult.user.role !== 'admin') {
      return responses.forbidden('Cannot update completed events');
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      return responses.badRequest('No valid fields to update');
    }

    // Add updated_at
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateValues.push(new Date().toISOString());

    // Add WHERE clause
    paramCount++;
    updateValues.push(eventId);

    const updateQuery = `
      UPDATE events 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const updatedEvent = await Database.queryOne(updateQuery, updateValues);

    if (!updatedEvent) {
      return responses.internalServerError('Failed to update event');
    }

    // Get full event details including organizer and tags
    return await getEvent(eventId);

  } catch (error) {
    console.error('Update event error:', error);
    
    if (error instanceof SyntaxError) {
      return responses.badRequest('Invalid JSON in request body');
    }
    
    return responses.internalServerError('Failed to update event');
  }
}

// DELETE /api/events/:id - Delete event (admin only)
async function deleteEvent(event: HandlerEvent, eventId: number) {
  try {
    // Require admin role
    const authResult = await requireRole(event.headers, ['admin']);
    if (!authResult.success) {
      return authResult.response;
    }

    // Check if event exists
    const existingEvent = await Database.queryOne(
      'SELECT id, title FROM events WHERE id = $1',
      [eventId]
    );

    if (!existingEvent) {
      return responses.notFound('Event not found');
    }

    // Check if event has registrations
    const registrationCount = await Database.queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM registrations WHERE event_id = $1',
      [eventId]
    );

    if (parseInt(registrationCount?.count || '0') > 0) {
      return responses.conflict(
        'Cannot delete event with existing registrations. Consider cancelling the event instead.'
      );
    }

    // Delete event (CASCADE will handle related records)
    await Database.query('DELETE FROM events WHERE id = $1', [eventId]);

    return responses.ok({
      message: 'Event deleted successfully',
      deleted_event: {
        id: existingEvent.id,
        title: existingEvent.title,
      },
    });

  } catch (error) {
    console.error('Delete event error:', error);
    return responses.internalServerError('Failed to delete event');
  }
}

export { handler };