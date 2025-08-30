// User profile API endpoint - GET, PUT /users/{id}
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { Database } from './_shared/database.js';
import { requireAuth } from './_shared/auth.js';
import { responses, corsResponse } from './_shared/response.js';
import { validateInput, schemas, parsePathParams } from './_shared/validation.js';
import { z } from 'zod';

// Validation schemas
const UpdateUserSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(500).optional(),
  profile_image: z.string().url().optional().or(z.literal('')),
});

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return corsResponse();
  }

  try {
    // Extract user ID from path
    const pathParams = parsePathParams(event.path, '/api/users/[id]');
    const validation = validateInput(schemas.idParam, pathParams);
    
    if (!validation.success) {
      return validation.response;
    }

    const { id: userId } = validation.data;

    if (event.httpMethod === 'GET') {
      // Get user profile
      const user = await Database.queryOne(`
        SELECT id, name, email, bio, profile_image, role, email_verified, created_at, updated_at 
        FROM users WHERE id = $1
      `, [userId]);

      if (!user) {
        return responses.notFound('User not found');
      }

      return responses.ok(user);
    }

    if (event.httpMethod === 'PUT') {
      // Require authentication for updates
      const authResult = await requireAuth(event.headers);
      if (!authResult.success) {
        return authResult.response;
      }

      // Check authorization - users can only update their own profile, unless they're admin
      if (authResult.user.id !== userId && authResult.user.role !== 'admin') {
        return responses.forbidden('You can only update your own profile');
      }

      // Parse and validate request body
      const body = JSON.parse(event.body || '{}');
      const updateValidation = UpdateUserSchema.safeParse(body);
      
      if (!updateValidation.success) {
        return responses.badRequest(
          'Validation failed: ' + updateValidation.error.errors.map(e => e.message).join(', ')
        );
      }

      const validatedData = updateValidation.data;

      // Check if user exists
      const existingUser = await Database.queryOne(
        'SELECT id, email FROM users WHERE id = $1', 
        [userId]
      );
      
      if (!existingUser) {
        return responses.notFound('User not found');
      }

      // Check if email is being changed and if new email already exists
      if (validatedData.email && validatedData.email !== existingUser.email) {
        const emailCheck = await Database.queryOne(
          'SELECT id FROM users WHERE email = $1 AND id != $2', 
          [validatedData.email, userId]
        );
        
        if (emailCheck) {
          return responses.badRequest('Email address is already in use');
        }
      }

      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];
      let paramCounter = 1;

      if (validatedData.name !== undefined) {
        updateFields.push(`name = $${paramCounter}`);
        updateValues.push(validatedData.name);
        paramCounter++;
      }

      if (validatedData.email !== undefined) {
        updateFields.push(`email = $${paramCounter}`);
        updateValues.push(validatedData.email);
        paramCounter++;
        
        // If email is being changed, mark as unverified
        updateFields.push(`email_verified = $${paramCounter}`);
        updateValues.push(false);
        paramCounter++;
      }

      if (validatedData.bio !== undefined) {
        updateFields.push(`bio = $${paramCounter}`);
        updateValues.push(validatedData.bio || null);
        paramCounter++;
      }

      if (validatedData.profile_image !== undefined) {
        updateFields.push(`profile_image = $${paramCounter}`);
        updateValues.push(validatedData.profile_image || null);
        paramCounter++;
      }

      if (updateFields.length === 0) {
        return responses.badRequest('No valid fields to update');
      }

      // Add updated_at timestamp
      updateFields.push(`updated_at = $${paramCounter}`);
      updateValues.push(new Date().toISOString());
      paramCounter++;

      // Add user ID for WHERE clause
      updateValues.push(userId);

      const updateQuery = `
        UPDATE users 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramCounter}
        RETURNING id, name, email, bio, profile_image, role, email_verified, created_at, updated_at
      `;

      const updatedUser = await Database.queryOne(updateQuery, updateValues);

      if (!updatedUser) {
        return responses.internalServerError('Failed to update user');
      }

      return responses.ok(updatedUser);
    }

    return responses.badRequest('Method not allowed. Use GET or PUT.');

  } catch (error) {
    console.error('User API error:', error);
    
    if (error instanceof SyntaxError) {
      return responses.badRequest('Invalid JSON in request body');
    }
    
    return responses.internalServerError('Internal server error');
  }
};

export { handler };