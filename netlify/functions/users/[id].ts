// User profile API endpoint - GET, PUT /users/{id}
import type { Handler } from '@netlify/functions';
import { withAuth } from '../_shared/auth';
import { withDatabase } from '../_shared/database';
import { createErrorResponse, createSuccessResponse } from '../_shared/response';
import { z } from 'zod';

// Validation schemas
const UpdateUserSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(500).optional(),
  profile_image: z.string().url().optional().or(z.literal('')),
});

const handler: Handler = async (event, context) => {
  // Extract user ID from path
  const userId = parseInt(event.path.split('/').pop() || '');
  if (!userId || isNaN(userId)) {
    return createErrorResponse('Invalid user ID', 400);
  }

  try {
    return await withAuth(event, async (currentUser) => {
      return await withDatabase(async (client) => {
        
        if (event.httpMethod === 'GET') {
          // Get user profile
          const result = await client.query(
            `SELECT id, name, email, bio, profile_image, role, email_verified, created_at, updated_at 
             FROM users WHERE id = $1`,
            [userId]
          );

          if (result.rows.length === 0) {
            return createErrorResponse('User not found', 404);
          }

          const user = result.rows[0];

          // Check if current user can view this profile
          // Users can view their own profile, or if profile is public (for now, all profiles are viewable)
          return createSuccessResponse(user);
        }

        if (event.httpMethod === 'PUT') {
          // Update user profile
          if (!event.body) {
            return createErrorResponse('Request body is required', 400);
          }

          // Check authorization - users can only update their own profile, unless they're admin
          if (currentUser.id !== userId && currentUser.role !== 'admin') {
            return createErrorResponse('Unauthorized', 403);
          }

          let updateData;
          try {
            updateData = JSON.parse(event.body);
          } catch (error) {
            return createErrorResponse('Invalid JSON in request body', 400);
          }

          // Validate update data
          const validation = UpdateUserSchema.safeParse(updateData);
          if (!validation.success) {
            return createErrorResponse(
              'Validation failed: ' + validation.error.errors.map(e => e.message).join(', '),
              400
            );
          }

          const validatedData = validation.data;

          // Check if user exists
          const userCheck = await client.query('SELECT id, email FROM users WHERE id = $1', [userId]);
          if (userCheck.rows.length === 0) {
            return createErrorResponse('User not found', 404);
          }

          // Check if email is being changed and if new email already exists
          if (validatedData.email && validatedData.email !== userCheck.rows[0].email) {
            const emailCheck = await client.query('SELECT id FROM users WHERE email = $1 AND id != $2', [validatedData.email, userId]);
            if (emailCheck.rows.length > 0) {
              return createErrorResponse('Email address is already in use', 400);
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
            return createErrorResponse('No valid fields to update', 400);
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

          const updateResult = await client.query(updateQuery, updateValues);

          if (updateResult.rows.length === 0) {
            return createErrorResponse('Failed to update user', 500);
          }

          const updatedUser = updateResult.rows[0];
          return createSuccessResponse(updatedUser);
        }

        return createErrorResponse('Method not allowed', 405);
      });
    });
  } catch (error) {
    console.error('User API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

export { handler };