// Events list and create endpoint
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { Database } from './_shared/database';
import { requireRole } from './_shared/auth';
import { responses, corsResponse } from './_shared/response';
import { validateInput, schemas, parseQueryParams } from './_shared/validation';

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return corsResponse();
  }

  try {
    if (event.httpMethod === 'GET') {
      return await getEvents(event);
    } else if (event.httpMethod === 'POST') {
      return await createEvent(event);
    } else {
      return responses.badRequest('Method not allowed. Use GET or POST.');
    }
  } catch (error) {
    console.error('Events endpoint error:', error);
    return responses.internalServerError('Failed to process request');
  }
};

// GET /api/events - List events with filtering and pagination
async function getEvents(event: HandlerEvent) {
  try {
    // Parse and validate query parameters
    const urlParams = parseQueryParams(event.rawUrl || `${event.headers.host}${event.path}?${event.rawQuery || ''}`);
    const validation = validateInput(schemas.eventQuery, urlParams);
    
    if (!validation.success) {
      return validation.response;
    }

    const { page, limit, search, location, distance, date_from, date_to, tags, sort, order } = validation.data;

    // Build dynamic query
    let query = `
      SELECT 
        e.*,
        u.name as organizer_name,
        u.email as organizer_email,
        COUNT(r.id) as registration_count
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'registered'
    `;

    const conditions: string[] = [];
    const queryParams: any[] = [];
    let paramCount = 0;

    // Add search conditions
    if (search) {
      paramCount++;
      conditions.push(`(e.title ILIKE $${paramCount} OR e.description ILIKE $${paramCount} OR e.location ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    if (location) {
      paramCount++;
      conditions.push(`e.location ILIKE $${paramCount}`);
      queryParams.push(`%${location}%`);
    }

    if (date_from) {
      paramCount++;
      conditions.push(`e.event_date >= $${paramCount}`);
      queryParams.push(date_from);
    }

    if (date_to) {
      paramCount++;
      conditions.push(`e.event_date <= $${paramCount}`);
      queryParams.push(date_to);
    }

    if (distance) {
      paramCount++;
      conditions.push(`$${paramCount} = ANY(e.distance_options)`);
      queryParams.push(distance);
    }

    // Filter by tags if provided
    if (tags) {
      const tagIds = tags.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (tagIds.length > 0) {
        paramCount++;
        query += ` INNER JOIN event_tags et ON e.id = et.event_id`;
        conditions.push(`et.tag_id IN (${tagIds.map((_, i) => `$${paramCount + i}`).join(',')})`);
        queryParams.push(...tagIds);
        paramCount += tagIds.length - 1;
      }
    }

    // Only show active events by default
    conditions.push(`e.status = 'active'`);

    // Add WHERE clause if we have conditions
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Add GROUP BY for aggregation
    query += ` GROUP BY e.id, u.name, u.email`;

    // Add sorting
    const sortMap: Record<string, string> = {
      date: 'e.event_date',
      event_date: 'e.event_date',
      title: 'e.title',
      location: 'e.location',
      created_at: 'e.created_at',
    };
    
    query += ` ORDER BY ${sortMap[sort] || 'e.event_date'} ${order.toUpperCase()}`;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT e.id) as total
      FROM events e
      ${tags ? 'INNER JOIN event_tags et ON e.id = et.event_id' : ''}
      ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
    `;

    const [totalResult] = await Promise.all([
      Database.queryOne<{ total: string }>(countQuery, queryParams),
    ]);

    const total = parseInt(totalResult?.total || '0');
    const totalPages = Math.ceil(total / limit);

    // Add pagination
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    queryParams.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    queryParams.push((page - 1) * limit);

    // Execute main query
    const events = await Database.query(query, queryParams);

    // Get tags for each event
    const eventIds = events.map((e: any) => e.id);
    let eventTags: any[] = [];
    
    if (eventIds.length > 0) {
      eventTags = await Database.query(`
        SELECT et.event_id, t.id, t.name, t.category, t.color
        FROM event_tags et
        JOIN tags t ON et.tag_id = t.id
        WHERE et.event_id = ANY($1)
      `, [eventIds]);
    }

    // Group tags by event
    const tagsByEvent = eventTags.reduce((acc: any, tag: any) => {
      if (!acc[tag.event_id]) {
        acc[tag.event_id] = [];
      }
      acc[tag.event_id].push({
        id: tag.id,
        name: tag.name,
        category: tag.category,
        color: tag.color,
      });
      return acc;
    }, {});

    // Attach tags to events
    const eventsWithTags = events.map((event: any) => ({
      ...event,
      organizer: event.organizer_name ? {
        name: event.organizer_name,
        email: event.organizer_email,
      } : null,
      tags: tagsByEvent[event.id] || [],
      registration_count: parseInt(event.registration_count || '0'),
    }));

    // Return data in expected EventListResponse format
    const responseData = {
      events: eventsWithTags,
      meta: {
        page,
        limit,
        total,
        totalPages,
      }
    };

    return responses.ok(responseData);

  } catch (error) {
    console.error('Get events error:', error);
    return responses.internalServerError('Failed to fetch events');
  }
}

// POST /api/events - Create new event (organizer+ only)
async function createEvent(event: HandlerEvent) {
  try {
    // Require organizer or admin role
    const authResult = await requireRole(event.headers, ['organizer', 'admin']);
    if (!authResult.success) {
      return authResult.response;
    }

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validation = validateInput(schemas.eventCreate, body);
    
    if (!validation.success) {
      return validation.response;
    }

    const eventData = validation.data;

    // Create event
    const newEvent = await Database.queryOne(`
      INSERT INTO events (
        title, description, event_date, location, latitude, longitude,
        distance_options, capacity, registration_fee, early_bird_fee,
        early_bird_deadline, banner_image, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      eventData.title,
      eventData.description,
      eventData.event_date,
      eventData.location,
      eventData.latitude,
      eventData.longitude,
      eventData.distance_options,
      eventData.capacity,
      eventData.registration_fee,
      eventData.early_bird_fee,
      eventData.early_bird_deadline,
      eventData.banner_image,
      authResult.user.id,
    ]);

    if (!newEvent) {
      return responses.internalServerError('Failed to create event');
    }

    // Return created event with organizer info
    const eventWithOrganizer = {
      ...newEvent,
      organizer: {
        name: authResult.user.name,
        email: authResult.user.email,
      },
      tags: [],
      registration_count: 0,
    };

    return responses.created(eventWithOrganizer);

  } catch (error) {
    console.error('Create event error:', error);
    
    if (error instanceof SyntaxError) {
      return responses.badRequest('Invalid JSON in request body');
    }
    
    return responses.internalServerError('Failed to create event');
  }
}

export { handler };