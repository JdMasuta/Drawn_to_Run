// HTTP response utilities for Netlify functions

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export function successResponse<T>(
  data: T,
  statusCode: number = 200,
  meta?: ApiResponse<T>['meta']
) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: JSON.stringify({
      success: true,
      data,
      ...(meta && { meta }),
    } as ApiResponse<T>),
  };
}

export function errorResponse(
  message: string,
  statusCode: number = 400,
  code?: string,
  details?: any
) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: JSON.stringify({
      success: false,
      error: {
        message,
        ...(code && { code }),
        ...(details && { details }),
      },
    } as ApiResponse),
  };
}

// Common error responses
export const responses = {
  // Success responses
  ok: <T>(data: T, meta?: ApiResponse<T>['meta']) => successResponse(data, 200, meta),
  created: <T>(data: T) => successResponse(data, 201),
  noContent: () => ({ statusCode: 204, headers: {}, body: '' }),

  // Client error responses
  badRequest: (message: string = 'Bad Request', details?: any) => 
    errorResponse(message, 400, 'BAD_REQUEST', details),
  unauthorized: (message: string = 'Unauthorized') => 
    errorResponse(message, 401, 'UNAUTHORIZED'),
  forbidden: (message: string = 'Forbidden') => 
    errorResponse(message, 403, 'FORBIDDEN'),
  notFound: (message: string = 'Resource not found') => 
    errorResponse(message, 404, 'NOT_FOUND'),
  conflict: (message: string = 'Resource already exists') => 
    errorResponse(message, 409, 'CONFLICT'),
  unprocessableEntity: (message: string = 'Validation failed', details?: any) => 
    errorResponse(message, 422, 'VALIDATION_ERROR', details),

  // Server error responses
  internalServerError: (message: string = 'Internal Server Error') => 
    errorResponse(message, 500, 'INTERNAL_ERROR'),
  serviceUnavailable: (message: string = 'Service Unavailable') => 
    errorResponse(message, 503, 'SERVICE_UNAVAILABLE'),
};

// CORS preflight response
export function corsResponse() {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
    body: '',
  };
}