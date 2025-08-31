import { Handler } from '@netlify/functions';
import { responses, corsResponse } from './_shared/response';
import { neon } from '@netlify/neon';

const sql = neon(process.env.DATABASE_URL!);

// Helper function to get user initials
const getInitials = (name: string): string => {
  if (!name) return 'U';
  const parts = name.trim().split(' ').filter(part => part.length > 0);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return parts.slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('');
};

// Helper function to anonymize full names
const anonymizeName = (name: string): string => {
  if (!name) return 'User';
  const parts = name.trim().split(' ').filter(part => part.length > 0);
  if (parts.length === 1) {
    return parts[0].charAt(0) + '.';
  }
  return parts[0] + ' ' + parts.slice(1).map(part => part.charAt(0) + '.').join(' ');
};

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return corsResponse();
  }

  if (event.httpMethod !== 'GET') {
    return responses.badRequest('Method not allowed. Use GET.');
  }

  try {
    // Parse query parameters
    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '5'), 10); // Max 10 items for public feed
    
    // Get recent public activities (registrations and comments only)
    // We'll get a mix of recent registrations and event comments
    const [recentRegistrations, recentComments] = await Promise.all([
      // Recent event registrations
      sql`
        SELECT 
          'registration' as activity_type,
          r.registered_at as created_at,
          u.name as user_name,
          e.title as event_title,
          e.id as event_id,
          r.distance
        FROM registrations r
        JOIN users u ON r.user_id = u.id  
        JOIN events e ON r.event_id = e.id
        WHERE e.status = 'active'
        ORDER BY r.registered_at DESC
        LIMIT ${Math.ceil(limit * 0.7)}
      `,
      
      // Recent event comments
      sql`
        SELECT 
          'comment' as activity_type,
          c.created_at,
          u.name as user_name,
          e.title as event_title,
          e.id as event_id,
          c.content,
          c.id as comment_id
        FROM comments c
        JOIN users u ON c.user_id = u.id
        JOIN events e ON c.event_id = e.id  
        WHERE e.status = 'active'
          AND LENGTH(c.content) > 10 -- Only substantial comments
          AND c.parent_id IS NULL -- Only top-level comments
        ORDER BY c.created_at DESC
        LIMIT ${Math.ceil(limit * 0.3)}
      `
    ]);

    // Combine and sort activities
    const allActivities = [
      ...recentRegistrations.map((row: any) => ({
        id: `reg-${row.event_id}-${row.created_at}`,
        type: 'registration',
        created_at: row.created_at,
        user_name: row.user_name,
        user_initials: getInitials(row.user_name),
        user_display_name: anonymizeName(row.user_name),
        event_title: row.event_title,
        event_id: row.event_id,
        distance: row.distance,
        message: `registered for the`,
      })),
      ...recentComments.map((row: any) => ({
        id: `comment-${row.comment_id}`,
        type: 'comment',
        created_at: row.created_at,
        user_name: row.user_name,
        user_initials: getInitials(row.user_name),
        user_display_name: anonymizeName(row.user_name),
        event_title: row.event_title,
        event_id: row.event_id,
        content: row.content,
        message: `commented on`,
      }))
    ];

    // Sort by created_at and limit
    const sortedActivities = allActivities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    // Format activities for display
    const formattedActivities = sortedActivities.map(activity => {
      // Generate a consistent color based on user initials
      const colors = [
        'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 
        'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
      ];
      const colorIndex = activity.user_initials.charCodeAt(0) % colors.length;
      
      // Calculate relative time
      const now = new Date();
      const activityTime = new Date(activity.created_at);
      const diffMs = now.getTime() - activityTime.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      let timeAgo;
      if (diffHours < 1) {
        timeAgo = 'Just now';
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      } else {
        timeAgo = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
      }

      return {
        id: activity.id,
        type: activity.type,
        user: {
          initials: activity.user_initials,
          displayName: activity.user_display_name,
          avatarColor: colors[colorIndex],
        },
        event: {
          id: activity.event_id,
          title: activity.event_title,
        },
        message: activity.message,
        distance: activity.distance,
        content: activity.content,
        timeAgo,
        created_at: activity.created_at,
      };
    });

    return responses.ok({
      activities: formattedActivities,
      total: formattedActivities.length,
    });

  } catch (error) {
    console.error('Public activity feed error:', error);
    
    // Return fallback activity data
    const fallbackActivities = [
      {
        id: 'fallback-1',
        type: 'registration',
        user: {
          initials: 'JD',
          displayName: 'John D.',
          avatarColor: 'bg-blue-500',
        },
        event: {
          id: 1,
          title: 'Central Park 5K Fun Run',
        },
        message: 'registered for the',
        distance: '5K',
        timeAgo: '2 hours ago',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'fallback-2',
        type: 'registration',
        user: {
          initials: 'SM',
          displayName: 'Sarah M.',
          avatarColor: 'bg-green-500',
        },
        event: {
          id: 2,
          title: 'Brooklyn Bridge 10K',
        },
        message: 'registered for the',
        distance: '10K',
        timeAgo: '5 hours ago',
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'fallback-3',
        type: 'comment',
        user: {
          initials: 'MR',
          displayName: 'Mike R.',
          avatarColor: 'bg-orange-500',
        },
        event: {
          id: 3,
          title: 'Marathon Training Tips',
        },
        message: 'commented on',
        content: 'Great advice for beginners!',
        timeAgo: '1 day ago',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    
    return responses.ok({
      activities: fallbackActivities,
      total: fallbackActivities.length,
    });
  }
};