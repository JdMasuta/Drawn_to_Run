// Request validation utilities using Zod
import { z } from 'zod';
import { responses } from './response.js';

// Common validation schemas
export const schemas = {
  // User schemas
  userRegistration: z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['participant', 'organizer', 'admin']).optional().default('participant'),
  }),

  userLogin: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),

  // Event schemas
  eventCreate: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    event_date: z.string().datetime('Invalid date format'),
    location: z.string().min(1, 'Location is required'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    distance_options: z.array(z.string()).min(1, 'At least one distance option required'),
    capacity: z.number().int().positive().optional(),
    registration_fee: z.number().nonnegative().optional(),
    early_bird_fee: z.number().nonnegative().optional(),
    early_bird_deadline: z.string().datetime().optional(),
    banner_image: z.string().url().optional(),
  }),

  eventUpdate: z.object({
    title: z.string().min(1, 'Title is required').optional(),
    description: z.string().optional(),
    event_date: z.string().datetime('Invalid date format').optional(),
    location: z.string().min(1, 'Location is required').optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    distance_options: z.array(z.string()).min(1, 'At least one distance option required').optional(),
    capacity: z.number().int().positive().optional(),
    registration_fee: z.number().nonnegative().optional(),
    early_bird_fee: z.number().nonnegative().optional(),
    early_bird_deadline: z.string().datetime().optional(),
    banner_image: z.string().url().optional(),
    status: z.enum(['active', 'cancelled', 'completed']).optional(),
  }),

  // Registration schemas
  eventRegistration: z.object({
    distance: z.string().min(1, 'Distance selection is required'),
  }),

  // Comment schemas
  commentCreate: z.object({
    content: z.string().min(1, 'Comment content is required'),
    parent_id: z.number().int().positive().optional(),
  }),

  // Email subscription schema
  emailSubscription: z.object({
    email: z.string().email('Invalid email address'),
  }),

  // Query parameter schemas
  eventQuery: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    location: z.string().optional(),
    distance: z.string().optional(),
    date_from: z.string().datetime().optional(),
    date_to: z.string().datetime().optional(),
    tags: z.string().optional(), // comma-separated tag IDs
    sort: z.enum(['date', 'event_date', 'title', 'location', 'created_at']).default('event_date'),
    order: z.enum(['asc', 'desc']).default('asc'),
  }),

  // Path parameter schemas
  idParam: z.object({
    id: z.coerce.number().int().positive(),
  }),
};

// Validation helper function
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: any } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetails = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      return {
        success: false,
        response: responses.unprocessableEntity(
          'Validation failed',
          errorDetails
        ),
      };
    }
    
    return {
      success: false,
      response: responses.badRequest('Invalid input data'),
    };
  }
}

// Helper to parse query parameters
export function parseQueryParams(url: string) {
  const urlObj = new URL(url);
  const params: Record<string, string> = {};
  
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
}

// Helper to parse path parameters
export function parsePathParams(path: string, pattern: string): Record<string, string> {
  const pathParts = path.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);
  const params: Record<string, string> = {};
  
  patternParts.forEach((part, index) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      const paramName = part.slice(1, -1);
      params[paramName] = pathParts[index] || '';
    }
  });
  
  return params;
}