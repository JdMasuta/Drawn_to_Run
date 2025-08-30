import { Handler } from '@netlify/functions';
import { responses, corsResponse } from './_shared/response';
import { requireAuth } from './_shared/auth';
import { neon } from '@netlify/neon';

const sql = neon(process.env.DATABASE_URL!);

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return corsResponse();
  }

  if (event.httpMethod !== 'GET') {
    return responses.badRequest('Method not allowed. Use GET.');
  }

  try {
    // Require authentication
    const authResult = await requireAuth(event.headers);
    if (!authResult.success) {
      return authResult.response;
    }

    const userId = authResult.user.id;

    // Parse query parameters
    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '20'), 50); // Max 50 items
    const offset = Math.max(parseInt(event.queryStringParameters?.offset || '0'), 0);

    // Get activities from users that the current user follows
    const activities = await sql`
      WITH user_following AS (
        SELECT following_id 
        FROM user_follows 
        WHERE follower_id = ${userId}
      )
      SELECT 
        a.id,
        a.user_id,
        a.type,
        a.target_type,
        a.target_id,
        a.metadata,
        a.created_at,
        -- User data
        u.name as user_name,
        u.email as user_email,
        u.profile_image as user_profile_image,
        u.bio as user_bio,
        -- Event data (for event-related activities)
        e.title as event_title,
        e.description as event_description,
        e.event_date as event_event_date,
        e.location as event_location,
        e.distance_options as event_distance_options,
        -- Target user data (for follow activities)
        tu.name as target_user_name,
        tu.email as target_user_email,
        tu.profile_image as target_user_profile_image,
        tu.bio as target_user_bio,
        -- Comment data (for comment activities)
        c.content as comment_content,
        c.event_id as comment_event_id
      FROM activities a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN events e ON (a.target_type = 'event' AND a.target_id = e.id)
      LEFT JOIN users tu ON (a.target_type = 'user' AND a.target_id = tu.id)
      LEFT JOIN comments c ON (a.target_type = 'comment' AND a.target_id = c.id)
      WHERE a.user_id IN (SELECT following_id FROM user_following)
      ORDER BY a.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Get total count for pagination
    const totalResult = await sql`
      WITH user_following AS (
        SELECT following_id 
        FROM user_follows 
        WHERE follower_id = ${userId}
      )
      SELECT COUNT(*) as total
      FROM activities a
      WHERE a.user_id IN (SELECT following_id FROM user_following)
    `;

    const total = Number(totalResult[0]?.total || 0);
    const hasMore = offset + activities.length < total;

    // Transform the flat SQL result into properly structured objects
    const transformedActivities = activities.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      target_type: row.target_type,
      target_id: row.target_id,
      metadata: row.metadata,
      created_at: row.created_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        profile_image: row.user_profile_image,
        bio: row.user_bio,
        role: 'participant', // Default role for feed display
        email_verified: true,
        created_at: '',
        updated_at: '',
      },
      target_event: row.event_title ? {
        id: row.target_id,
        title: row.event_title,
        description: row.event_description,
        event_date: row.event_event_date,
        location: row.event_location,
        distance_options: row.event_distance_options || [],
        created_by: 0, // Not needed for feed display
        status: 'active',
        created_at: '',
        updated_at: '',
      } : undefined,
      target_user: row.target_user_name ? {
        id: row.target_id,
        name: row.target_user_name,
        email: row.target_user_email,
        profile_image: row.target_user_profile_image,
        bio: row.target_user_bio,
        role: 'participant',
        email_verified: true,
        created_at: '',
        updated_at: '',
      } : undefined,
      target_comment: row.comment_content ? {
        id: row.target_id,
        event_id: row.comment_event_id,
        user_id: row.user_id,
        content: row.comment_content,
        created_at: row.created_at,
        updated_at: row.created_at,
      } : undefined,
    }));

    const responseData = {
      activities: transformedActivities,
      total,
      hasMore,
    };

    return responses.ok(responseData);

  } catch (error) {
    console.error('Activity feed error:', error);
    return responses.internalServerError('Failed to fetch activity feed');
  }
};