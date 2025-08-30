// Event comments endpoint
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { Database } from './_shared/database.js';
import { requireAuth } from './_shared/auth.js';
import { responses, corsResponse } from './_shared/response.js';
import { validateInput, schemas, parsePathParams, parseQueryParams } from './_shared/validation.js';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return corsResponse();
  }

  try {
    // Extract event ID from path
    const pathParams = parsePathParams(event.path, '/api/events/[id]/comments');
    const validation = validateInput(schemas.idParam, pathParams);
    
    if (!validation.success) {
      return validation.response;
    }

    const { id: eventId } = validation.data;

    if (event.httpMethod === 'GET') {
      return await getEventComments(event, eventId);
    } else if (event.httpMethod === 'POST') {
      return await addComment(event, eventId);
    } else {
      return responses.badRequest('Method not allowed. Use GET or POST.');
    }
  } catch (error) {
    console.error('Event comments endpoint error:', error);
    return responses.internalServerError('Failed to process request');
  }
};

// GET /api/events/:id/comments - Get event comments
async function getEventComments(event: HandlerEvent, eventId: number) {
  try {
    // Check if event exists
    const existingEvent = await Database.queryOne(
      'SELECT id, title FROM events WHERE id = $1',
      [eventId]
    );

    if (!existingEvent) {
      return responses.notFound('Event not found');
    }

    // Parse query parameters for pagination
    const queryParams = parseQueryParams(event.rawUrl || `${event.headers.host}${event.path}?${event.rawQuery || ''}`);
    const page = parseInt(queryParams.page || '1');
    const limit = Math.min(parseInt(queryParams.limit || '50'), 100); // Max 100 comments per page

    // Get comments with user info and threading
    const comments = await Database.query(`
      WITH RECURSIVE comment_tree AS (
        -- Base case: top-level comments
        SELECT 
          c.id,
          c.event_id,
          c.user_id,
          c.parent_id,
          c.content,
          c.created_at,
          c.updated_at,
          u.name as user_name,
          u.profile_image as user_profile_image,
          0 as depth,
          ARRAY[c.created_at, c.id::text] as sort_path
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.event_id = $1 AND c.parent_id IS NULL
        
        UNION ALL
        
        -- Recursive case: replies
        SELECT 
          c.id,
          c.event_id,
          c.user_id,
          c.parent_id,
          c.content,
          c.created_at,
          c.updated_at,
          u.name as user_name,
          u.profile_image as user_profile_image,
          ct.depth + 1,
          ct.sort_path || ARRAY[c.created_at, c.id::text]
        FROM comments c
        JOIN users u ON c.user_id = u.id
        JOIN comment_tree ct ON c.parent_id = ct.id
        WHERE ct.depth < 3  -- Limit nesting to 3 levels
      )
      SELECT *
      FROM comment_tree
      ORDER BY sort_path
      LIMIT $2 OFFSET $3
    `, [eventId, limit, (page - 1) * limit]);

    // Get total count for pagination
    const totalResult = await Database.queryOne<{ total: string }>(
      'SELECT COUNT(*) as total FROM comments WHERE event_id = $1',
      [eventId]
    );

    const total = parseInt(totalResult?.total || '0');
    const totalPages = Math.ceil(total / limit);

    // Format comments with user info
    const formattedComments = comments.map((comment: any) => ({
      id: comment.id,
      event_id: comment.event_id,
      parent_id: comment.parent_id,
      content: comment.content,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      depth: comment.depth,
      user: {
        id: comment.user_id,
        name: comment.user_name,
        profile_image: comment.user_profile_image,
      },
    }));

    return responses.ok(formattedComments, {
      page,
      limit,
      total,
      totalPages,
    });

  } catch (error) {
    console.error('Get event comments error:', error);
    return responses.internalServerError('Failed to fetch comments');
  }
}

// POST /api/events/:id/comments - Add comment
async function addComment(event: HandlerEvent, eventId: number) {
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

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validation = validateInput(schemas.commentCreate, body);
    
    if (!validation.success) {
      return validation.response;
    }

    const { content, parent_id } = validation.data;

    // If parent_id is provided, verify it exists and belongs to this event
    if (parent_id) {
      const parentComment = await Database.queryOne(
        'SELECT id, event_id FROM comments WHERE id = $1',
        [parent_id]
      );

      if (!parentComment) {
        return responses.badRequest('Parent comment not found');
      }

      if (parentComment.event_id !== eventId) {
        return responses.badRequest('Parent comment does not belong to this event');
      }

      // Check nesting depth (limit to 3 levels)
      const depth = await Database.queryOne<{ depth: number }>(`
        WITH RECURSIVE comment_depth AS (
          SELECT id, parent_id, 0 as depth
          FROM comments
          WHERE id = $1
          
          UNION ALL
          
          SELECT c.id, c.parent_id, cd.depth + 1
          FROM comments c
          JOIN comment_depth cd ON c.id = cd.parent_id
        )
        SELECT MAX(depth) as depth FROM comment_depth
      `, [parent_id]);

      if ((depth?.depth || 0) >= 2) {
        return responses.badRequest('Maximum comment nesting depth reached');
      }
    }

    // Create comment
    const comment = await Database.queryOne(`
      INSERT INTO comments (event_id, user_id, parent_id, content)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [eventId, authResult.user.id, parent_id, content]);

    if (!comment) {
      return responses.internalServerError('Failed to create comment');
    }

    // Return comment with user info
    const commentWithUser = {
      ...comment,
      user: {
        id: authResult.user.id,
        name: authResult.user.name,
        profile_image: authResult.user.profile_image,
      },
    };

    return responses.created(commentWithUser);

  } catch (error) {
    console.error('Add comment error:', error);
    
    if (error instanceof SyntaxError) {
      return responses.badRequest('Invalid JSON in request body');
    }
    
    return responses.internalServerError('Failed to add comment');
  }
}

export { handler };