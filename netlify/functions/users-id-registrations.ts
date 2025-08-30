// User registrations endpoint
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

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return responses.badRequest('Method not allowed. Use GET.');
  }

  try {
    // Extract user ID from path
    const pathParams = parsePathParams(event.path, '/api/users/[id]/registrations');
    const validation = validateInput(schemas.idParam, pathParams);
    
    if (!validation.success) {
      return validation.response;
    }

    const { id: userId } = validation.data;

    return await getUserRegistrations(event, userId);
  } catch (error) {
    console.error('User registrations endpoint error:', error);
    return responses.internalServerError('Failed to process request');
  }
};

// GET /api/users/:id/registrations - Get user's registrations
async function getUserRegistrations(event: HandlerEvent, userId: number) {
  try {
    // Require authentication
    const authResult = await requireAuth(event.headers);
    if (!authResult.success) {
      return authResult.response;
    }

    // Check authorization (users can only see their own registrations, unless admin)
    if (authResult.user.id !== userId && authResult.user.role !== 'admin') {
      return responses.forbidden('You can only view your own registrations');
    }

    // Check if user exists
    const existingUser = await Database.queryOne(
      'SELECT id, name, email FROM users WHERE id = $1',
      [userId]
    );

    if (!existingUser) {
      return responses.notFound('User not found');
    }

    // Parse query parameters
    const queryParams = parseQueryParams(event.rawUrl || `${event.headers.host}${event.path}?${event.rawQuery || ''}`);
    const page = parseInt(queryParams.page || '1');
    const limit = Math.min(parseInt(queryParams.limit || '20'), 100);
    const statusFilter = queryParams.status;

    // Build query with optional status filter
    let whereClause = 'WHERE r.user_id = $1';
    const queryParamsArray = [userId];
    let paramCount = 1;

    if (statusFilter && ['registered', 'completed', 'dns', 'dnf'].includes(statusFilter)) {
      paramCount++;
      whereClause += ` AND r.status = $${paramCount}`;
      queryParamsArray.push(statusFilter);
    }

    // Get registrations with event details
    const registrations = await Database.query(`
      SELECT 
        r.*,
        e.title as event_title,
        e.description as event_description,
        e.event_date,
        e.location as event_location,
        e.banner_image as event_banner_image,
        e.status as event_status,
        o.name as organizer_name
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      LEFT JOIN users o ON e.created_by = o.id
      ${whereClause}
      ORDER BY r.registered_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...queryParamsArray, limit, (page - 1) * limit]);

    // Get total count for pagination
    const totalResult = await Database.queryOne<{ total: string }>(`
      SELECT COUNT(*) as total
      FROM registrations r
      ${whereClause}
    `, queryParamsArray);

    const total = parseInt(totalResult?.total || '0');
    const totalPages = Math.ceil(total / limit);

    // Format registrations with event details
    const formattedRegistrations = registrations.map((reg: any) => ({
      id: reg.id,
      user_id: reg.user_id,
      event_id: reg.event_id,
      distance: reg.distance,
      status: reg.status,
      bib_number: reg.bib_number,
      finish_time: reg.finish_time,
      strava_activity_id: reg.strava_activity_id,
      registered_at: reg.registered_at,
      completed_at: reg.completed_at,
      event: {
        id: reg.event_id,
        title: reg.event_title,
        description: reg.event_description,
        event_date: reg.event_date,
        location: reg.event_location,
        banner_image: reg.event_banner_image,
        status: reg.event_status,
        organizer: {
          name: reg.organizer_name,
        },
      },
    }));

    // Calculate statistics
    const stats = {
      total_registrations: total,
      completed_events: formattedRegistrations.filter(r => r.status === 'completed').length,
      upcoming_events: formattedRegistrations.filter(r => {
        return r.status === 'registered' && new Date(r.event.event_date) > new Date();
      }).length,
      dns_count: formattedRegistrations.filter(r => r.status === 'dns').length,
      dnf_count: formattedRegistrations.filter(r => r.status === 'dnf').length,
    };

    return responses.ok({
      registrations: formattedRegistrations,
      user: existingUser,
      stats,
    }, {
      page,
      limit,
      total,
      totalPages,
    });

  } catch (error) {
    console.error('Get user registrations error:', error);
    return responses.internalServerError('Failed to fetch user registrations');
  }
}

export { handler };