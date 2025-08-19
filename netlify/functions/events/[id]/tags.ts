// Event tags endpoint - Manage tags for specific events
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { Database } from '../../_shared/database.js';
import { requireRole } from '../../_shared/auth.js';
import { responses, corsResponse } from '../../_shared/response.js';
import { validateInput, schemas } from '../../_shared/validation.js';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return corsResponse();
  }

  try {
    // Extract event ID from path
    const eventId = parseInt(event.path.split('/')[3]);
    if (isNaN(eventId)) {
      return responses.badRequest('Invalid event ID');
    }

    if (event.httpMethod === 'POST') {
      return await assignTagsToEvent(event, eventId);
    } else if (event.httpMethod === 'DELETE') {
      return await removeTagsFromEvent(event, eventId);
    } else {
      return responses.badRequest('Method not allowed. Use POST or DELETE.');
    }
  } catch (error) {
    console.error('Event tags endpoint error:', error);
    return responses.internalServerError('Failed to process request');
  }
};

// POST /api/events/:id/tags - Assign tags to event
async function assignTagsToEvent(event: HandlerEvent, eventId: number) {
  try {
    // Require organizer or admin role
    const authResult = await requireRole(event.headers, ['organizer', 'admin']);
    if (!authResult.success) {
      return authResult.response;
    }

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validation = validateInput(schemas.assignTags, body);
    
    if (!validation.success) {
      return validation.response;
    }

    const { tagIds } = validation.data;

    // Check if event exists and user has permission
    const eventRecord = await Database.queryOne(`
      SELECT id, created_by FROM events WHERE id = $1
    `, [eventId]);

    if (!eventRecord) {
      return responses.notFound('Event not found');
    }

    // Check if user owns the event or is admin
    if (authResult.user.role !== 'admin' && eventRecord.created_by !== authResult.user.id) {
      return responses.forbidden('You can only manage tags for your own events');
    }

    // Verify all tag IDs exist
    if (tagIds.length > 0) {
      const existingTags = await Database.query(`
        SELECT id FROM tags WHERE id = ANY($1)
      `, [tagIds]);

      const existingTagIds = existingTags.map((t: any) => t.id);
      const invalidTagIds = tagIds.filter((id: number) => !existingTagIds.includes(id));

      if (invalidTagIds.length > 0) {
        return responses.badRequest(`Invalid tag IDs: ${invalidTagIds.join(', ')}`);
      }

      // Remove existing tags for this event (to avoid duplicates)
      await Database.query(`
        DELETE FROM event_tags WHERE event_id = $1 AND tag_id = ANY($2)
      `, [eventId, tagIds]);

      // Insert new tag assignments
      const insertValues = tagIds.map((tagId: number) => `(${eventId}, ${tagId})`).join(', ');
      await Database.query(`
        INSERT INTO event_tags (event_id, tag_id) VALUES ${insertValues}
      `);
    }

    return responses.ok({ message: 'Tags assigned successfully' });

  } catch (error) {
    console.error('Assign tags error:', error);
    
    if (error instanceof SyntaxError) {
      return responses.badRequest('Invalid JSON in request body');
    }
    
    return responses.internalServerError('Failed to assign tags');
  }
}

// DELETE /api/events/:id/tags - Remove tags from event
async function removeTagsFromEvent(event: HandlerEvent, eventId: number) {
  try {
    // Require organizer or admin role
    const authResult = await requireRole(event.headers, ['organizer', 'admin']);
    if (!authResult.success) {
      return authResult.response;
    }

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validation = validateInput(schemas.assignTags, body);
    
    if (!validation.success) {
      return validation.response;
    }

    const { tagIds } = validation.data;

    // Check if event exists and user has permission
    const eventRecord = await Database.queryOne(`
      SELECT id, created_by FROM events WHERE id = $1
    `, [eventId]);

    if (!eventRecord) {
      return responses.notFound('Event not found');
    }

    // Check if user owns the event or is admin
    if (authResult.user.role !== 'admin' && eventRecord.created_by !== authResult.user.id) {
      return responses.forbidden('You can only manage tags for your own events');
    }

    // Remove specified tags from event
    if (tagIds.length > 0) {
      await Database.query(`
        DELETE FROM event_tags WHERE event_id = $1 AND tag_id = ANY($2)
      `, [eventId, tagIds]);
    }

    return responses.ok({ message: 'Tags removed successfully' });

  } catch (error) {
    console.error('Remove tags error:', error);
    
    if (error instanceof SyntaxError) {
      return responses.badRequest('Invalid JSON in request body');
    }
    
    return responses.internalServerError('Failed to remove tags');
  }
}

export { handler };