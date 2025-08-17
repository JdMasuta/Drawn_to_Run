// Tags endpoint - Get all available tags
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { Database } from './_shared/database.js';
import { responses, corsResponse } from './_shared/response.js';

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
    // Get all tags grouped by category
    const tags = await Database.query(`
      SELECT id, name, category, color
      FROM tags
      ORDER BY category, name
    `);

    // Group tags by category
    const tagsByCategory = tags.reduce((acc: any, tag: any) => {
      if (!acc[tag.category]) {
        acc[tag.category] = [];
      }
      acc[tag.category].push(tag);
      return acc;
    }, {});

    return responses.ok({
      tags,
      categories: tagsByCategory,
    });

  } catch (error) {
    console.error('Get tags error:', error);
    return responses.internalServerError('Failed to fetch tags');
  }
};

export { handler };