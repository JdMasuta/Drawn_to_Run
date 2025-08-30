// Testing helpers for Netlify functions
import { HandlerEvent, HandlerContext } from '@netlify/functions';
import { AuthService } from '../_shared/auth';

// Create a mock Netlify HandlerEvent
export function createMockEvent(options: {
  httpMethod?: string;
  path?: string;
  body?: string;
  headers?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
}): HandlerEvent {
  const { 
    httpMethod = 'GET', 
    path = '/', 
    body = null,
    headers = {},
    queryStringParameters = null
  } = options;

  // Build query string for rawUrl
  const queryString = queryStringParameters 
    ? '?' + new URLSearchParams(queryStringParameters).toString()
    : '';

  return {
    rawUrl: `https://test.netlify.app${path}${queryString}`,
    rawQuery: queryString.replace('?', ''),
    path,
    httpMethod,
    headers: {
      'content-type': 'application/json',
      'user-agent': 'test-agent',
      'host': 'test.netlify.app',
      ...headers,
    },
    multiValueHeaders: {},
    queryStringParameters,
    multiValueQueryStringParameters: null,
    body,
    isBase64Encoded: false,
  };
}

// Create a mock Netlify HandlerContext
export function createMockContext(): HandlerContext {
  return {
    callbackWaitsForEmptyEventLoop: true,
    functionName: 'test-function',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2023/01/01/[$LATEST]test-stream',
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  };
}

// Create authenticated request with JWT token
export async function createAuthenticatedRequest(
  user: { id: number; email: string; role: string },
  options: Parameters<typeof createMockEvent>[0] = {}
): Promise<HandlerEvent> {
  const token = AuthService.generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return createMockEvent({
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}

// Parse response body from Netlify function response
export function parseResponseBody(response: any): any {
  if (!response || !response.body) return null;
  try {
    return JSON.parse(response.body);
  } catch {
    return response.body;
  }
}

// Assert standard API response format
export function assertApiResponse(response: any, expectedStatus: number): any {
  expect(response).toBeDefined();
  expect(response).not.toBeNull();
  expect(typeof response).toBe('object');
  expect(response.statusCode).toBe(expectedStatus);
  expect(response.headers).toBeDefined();
  expect(response.headers['Content-Type']).toBe('application/json');
  
  const body = parseResponseBody(response);
  expect(body).toBeDefined();
  expect(typeof body.success).toBe('boolean');
  
  return body;
}

// Assert successful API response
export function assertSuccessResponse(response: any, expectedStatus: number = 200): any {
  const body = assertApiResponse(response, expectedStatus);
  expect(body.success).toBe(true);
  expect(body.data).toBeDefined();
  return body.data;
}

// Assert error API response
export function assertErrorResponse(response: any, expectedStatus: number, expectedMessage?: string): any {
  const body = assertApiResponse(response, expectedStatus);
  expect(body.success).toBe(false);
  expect(body.error).toBeDefined();
  expect(body.error.message).toBeDefined();
  
  if (expectedMessage) {
    expect(body.error.message).toContain(expectedMessage);
  }
  
  return body.error;
}

// Test data counter for unique test data
let testCounter = 0;

// Generate unique test identifier
export function getTestId(): string {
  testCounter++;
  return `test_${Date.now()}_${testCounter}`;
}

// Create test user data
export function createTestUserData(overrides: Partial<any> = {}): any {
  const id = getTestId();
  return {
    email: `test_${id}@test.com`,
    name: `Test User ${id}`,
    password: 'testpassword123',
    role: 'participant',
    ...overrides,
  };
}

// Create test event data
export function createTestEventData(createdBy: number, overrides: Partial<any> = {}): any {
  const id = getTestId();
  return {
    title: `Test Event ${id}`,
    description: `Test event description ${id}`,
    event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    location: `Test Location ${id}`,
    distance_options: ['5K', '10K'],
    created_by: createdBy,
    ...overrides,
  };
}

// Create test comment data
export function createTestCommentData(eventId: number, userId: number, overrides: Partial<any> = {}): any {
  const id = getTestId();
  return {
    content: `Test comment ${id}`,
    event_id: eventId,
    user_id: userId,
    ...overrides,
  };
}

// Create test registration data
export function createTestRegistrationData(eventId: number, userId: number, overrides: Partial<any> = {}): any {
  return {
    distance: '5K',
    event_id: eventId,
    user_id: userId,
    ...overrides,
  };
}

// Create mock event with query string parameters
export function createQueryStringEvent(queryParams: Record<string, string>): HandlerEvent {
  return createMockEvent({
    httpMethod: 'GET',
    path: '/api/events',
    queryStringParameters: queryParams,
    headers: {
      host: 'test.netlify.app',
    },
  });
}

// Assert event response format
export function assertEventResponse(response: any, expectedStatus: number = 200): any {
  const body = assertApiResponse(response, expectedStatus);
  
  if (expectedStatus === 200 && body.data) {
    // Validate event structure
    if (Array.isArray(body.data.events)) {
      // Event list response
      expect(body.data.events).toBeDefined();
      expect(body.data.meta).toBeDefined();
      expect(body.data.meta.page).toBeDefined();
      expect(body.data.meta.limit).toBeDefined();
      expect(body.data.meta.total).toBeDefined();
      expect(body.data.meta.totalPages).toBeDefined();
    } else {
      // Single event response
      expect(body.data.id).toBeDefined();
      expect(body.data.title).toBeDefined();
      expect(body.data.event_date).toBeDefined();
      expect(body.data.location).toBeDefined();
    }
  }
  
  return body.data;
}

// Assert paginated response format
export function assertPaginatedResponse(response: any, expectedStatus: number = 200): any {
  const body = assertApiResponse(response, expectedStatus);
  
  expect(body.data).toBeDefined();
  expect(body.meta).toBeDefined();
  expect(typeof body.meta.page).toBe('number');
  expect(typeof body.meta.limit).toBe('number');
  expect(typeof body.meta.total).toBe('number');
  expect(typeof body.meta.totalPages).toBe('number');
  
  return body;
}

// Assert registration response format
export function assertRegistrationResponse(response: any, expectedStatus: number = 201): any {
  const body = assertApiResponse(response, expectedStatus);
  
  if (expectedStatus === 201 && body.data) {
    expect(body.data.id).toBeDefined();
    expect(body.data.user_id).toBeDefined();
    expect(body.data.event_id).toBeDefined();
    expect(body.data.distance).toBeDefined();
    expect(body.data.status).toBeDefined();
  }
  
  return body.data;
}

// Assert comment response format
export function assertCommentResponse(response: any, expectedStatus: number = 201): any {
  const body = assertApiResponse(response, expectedStatus);
  
  if (expectedStatus === 201 && body.data) {
    expect(body.data.id).toBeDefined();
    expect(body.data.event_id).toBeDefined();
    expect(body.data.user_id || body.data.user).toBeDefined();
    expect(body.data.content).toBeDefined();
    expect(body.data.created_at).toBeDefined();
  }
  
  return body.data;
}