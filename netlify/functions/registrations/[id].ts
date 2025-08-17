// Individual registration management endpoint
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { Database } from '../_shared/database.js';
import { requireAuth, requireRole } from '../_shared/auth.js';
import { responses, corsResponse } from '../_shared/response.js';
import { validateInput, schemas, parsePathParams } from '../_shared/validation.js';
import { z } from 'zod';

// Registration update schema
const registrationUpdateSchema = z.object({
  status: z.enum(['registered', 'completed', 'dns', 'dnf']).optional(),
  bib_number: z.number().int().positive().optional(),
  finish_time: z.string().optional(), // ISO 8601 duration format (PT1H30M45S)
  strava_activity_id: z.string().optional(),
});

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return corsResponse();
  }

  try {
    // Extract registration ID from path
    const pathParams = parsePathParams(event.path, '/api/registrations/[id]');
    const validation = validateInput(schemas.idParam, pathParams);
    
    if (!validation.success) {
      return validation.response;
    }

    const { id: registrationId } = validation.data;

    if (event.httpMethod === 'GET') {
      return await getRegistration(event, registrationId);
    } else if (event.httpMethod === 'PUT') {
      return await updateRegistration(event, registrationId);
    } else if (event.httpMethod === 'DELETE') {
      return await deleteRegistration(event, registrationId);
    } else {
      return responses.badRequest('Method not allowed. Use GET, PUT, or DELETE.');
    }
  } catch (error) {
    console.error('Registration endpoint error:', error);
    return responses.internalServerError('Failed to process request');
  }
};

// GET /api/registrations/:id - Get registration details
async function getRegistration(event: HandlerEvent, registrationId: number) {
  try {
    // Require authentication
    const authResult = await requireAuth(event.headers);
    if (!authResult.success) {
      return authResult.response;
    }

    // Get registration with event and user details
    const registration = await Database.queryOne(`
      SELECT 
        r.*,
        e.title as event_title,
        e.description as event_description,
        e.event_date,
        e.location as event_location,
        e.banner_image as event_banner_image,
        e.status as event_status,
        u.name as user_name,
        u.email as user_email,
        u.profile_image as user_profile_image,
        o.name as organizer_name
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN users u ON r.user_id = u.id
      LEFT JOIN users o ON e.created_by = o.id
      WHERE r.id = $1
    `, [registrationId]);

    if (!registration) {
      return responses.notFound('Registration not found');
    }

    // Check authorization (user can see their own registration, organizer can see event registrations, admin can see all)
    const canView = (
      registration.user_id === authResult.user.id ||
      authResult.user.role === 'admin' ||
      (authResult.user.role === 'organizer' && registration.created_by === authResult.user.id)
    );

    if (!canView) {
      return responses.forbidden('You do not have permission to view this registration');
    }

    // Format response
    const formattedRegistration = {
      id: registration.id,
      user_id: registration.user_id,
      event_id: registration.event_id,
      distance: registration.distance,
      status: registration.status,
      bib_number: registration.bib_number,
      finish_time: registration.finish_time,
      strava_activity_id: registration.strava_activity_id,
      registered_at: registration.registered_at,
      completed_at: registration.completed_at,
      event: {
        id: registration.event_id,
        title: registration.event_title,
        description: registration.event_description,
        event_date: registration.event_date,
        location: registration.event_location,
        banner_image: registration.event_banner_image,
        status: registration.event_status,
        organizer: {
          name: registration.organizer_name,
        },
      },
      user: {
        id: registration.user_id,
        name: registration.user_name,
        email: registration.user_email,
        profile_image: registration.user_profile_image,
      },
    };

    return responses.ok(formattedRegistration);

  } catch (error) {
    console.error('Get registration error:', error);
    return responses.internalServerError('Failed to fetch registration');
  }
}

// PUT /api/registrations/:id - Update registration
async function updateRegistration(event: HandlerEvent, registrationId: number) {
  try {
    // Require authentication
    const authResult = await requireAuth(event.headers);
    if (!authResult.success) {
      return authResult.response;
    }

    // Get registration with event details
    const existingRegistration = await Database.queryOne(`
      SELECT 
        r.*,
        e.created_by as event_creator_id,
        e.status as event_status,
        e.event_date
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = $1
    `, [registrationId]);

    if (!existingRegistration) {
      return responses.notFound('Registration not found');
    }

    // Check authorization
    const isOwner = existingRegistration.user_id === authResult.user.id;
    const isEventOrganizer = existingRegistration.event_creator_id === authResult.user.id && authResult.user.role === 'organizer';
    const isAdmin = authResult.user.role === 'admin';

    if (!isOwner && !isEventOrganizer && !isAdmin) {
      return responses.forbidden('You do not have permission to update this registration');
    }

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validation = validateInput(registrationUpdateSchema, body);
    
    if (!validation.success) {
      return validation.response;
    }

    const updateData = validation.data;

    // Business rules for updates
    if (updateData.status) {
      // Only organizers and admins can change status to completed, dns, or dnf
      if (['completed', 'dns', 'dnf'].includes(updateData.status) && !isEventOrganizer && !isAdmin) {
        return responses.forbidden('Only event organizers can update race completion status');
      }

      // Users can only cancel their own registration (change to cancelled, but we delete instead)
      if (updateData.status === 'cancelled' && isOwner) {
        return responses.badRequest('Use DELETE method to cancel registration');
      }
    }

    // Only organizers and admins can set bib numbers and finish times
    if ((updateData.bib_number || updateData.finish_time) && !isEventOrganizer && !isAdmin) {
      return responses.forbidden('Only event organizers can update bib numbers and finish times');
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

    // Set completed_at timestamp if status is being changed to completed
    if (updateData.status === 'completed') {
      paramCount++;
      updateFields.push(`completed_at = $${paramCount}`);
      updateValues.push(new Date().toISOString());
    }

    // Add WHERE clause
    paramCount++;
    updateValues.push(registrationId);

    const updateQuery = `
      UPDATE registrations 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const updatedRegistration = await Database.queryOne(updateQuery, updateValues);

    if (!updatedRegistration) {
      return responses.internalServerError('Failed to update registration');
    }

    // Get full registration details
    return await getRegistration(event, registrationId);

  } catch (error) {
    console.error('Update registration error:', error);
    
    if (error instanceof SyntaxError) {
      return responses.badRequest('Invalid JSON in request body');
    }
    
    return responses.internalServerError('Failed to update registration');
  }
}

// DELETE /api/registrations/:id - Cancel registration
async function deleteRegistration(event: HandlerEvent, registrationId: number) {
  try {
    // Require authentication
    const authResult = await requireAuth(event.headers);
    if (!authResult.success) {
      return authResult.response;
    }

    // Get registration details
    const registration = await Database.queryOne(`
      SELECT 
        r.*,
        e.title as event_title,
        e.event_date,
        e.created_by as event_creator_id
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = $1
    `, [registrationId]);

    if (!registration) {
      return responses.notFound('Registration not found');
    }

    // Check authorization (user can cancel their own registration, admin can cancel any)
    const isOwner = registration.user_id === authResult.user.id;
    const isAdmin = authResult.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return responses.forbidden('You can only cancel your own registrations');
    }

    // Check if event is in the future
    const eventDate = new Date(registration.event_date);
    if (eventDate < new Date() && !isAdmin) {
      return responses.badRequest('Cannot cancel registration for past events');
    }

    // Delete registration
    await Database.query('DELETE FROM registrations WHERE id = $1', [registrationId]);

    return responses.ok({
      message: 'Registration cancelled successfully',
      cancelled_registration: {
        id: registration.id,
        event_title: registration.event_title,
        distance: registration.distance,
      },
    });

  } catch (error) {
    console.error('Delete registration error:', error);
    return responses.internalServerError('Failed to cancel registration');
  }
}

export { handler };