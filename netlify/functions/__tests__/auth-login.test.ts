// Test suite for auth-login function
import { handler } from '../auth-login';
import { createMockEvent, createMockContext, assertSuccessResponse, assertErrorResponse, createTestUserData } from './helpers';
import { createTestUser } from './fixtures';
import './setup';

describe('auth-login function', () => {
  const mockContext = createMockContext();

  describe('HTTP Method Validation', () => {
    it('should handle OPTIONS request (CORS preflight)', async () => {
      const event = createMockEvent({ httpMethod: 'OPTIONS' });
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(200);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('POST');
    });

    it('should reject non-POST requests', async () => {
      const event = createMockEvent({ httpMethod: 'GET' });
      const response = await handler(event, mockContext);

      assertErrorResponse(response, 400, 'Method not allowed');
    });
  });

  describe('Request Validation', () => {
    it('should reject requests with invalid JSON', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        body: 'invalid json',
      });
      const response = await handler(event, mockContext);

      assertErrorResponse(response, 400, 'Invalid JSON');
    });

    it('should reject requests with missing email', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({ password: 'testpassword123' }),
      });
      const response = await handler(event, mockContext);

      assertErrorResponse(response, 422);
    });

    it('should reject requests with missing password', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({ email: 'test@test.com' }),
      });
      const response = await handler(event, mockContext);

      assertErrorResponse(response, 422);
    });

    it('should reject requests with invalid email format', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({ email: 'invalid-email', password: 'testpassword123' }),
      });
      const response = await handler(event, mockContext);

      assertErrorResponse(response, 422, 'Invalid email');
    });

    it('should reject requests with empty password', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: '' }),
      });
      const response = await handler(event, mockContext);

      assertErrorResponse(response, 422, 'Password is required');
    });
  });

  describe('User Authentication', () => {
    it('should successfully authenticate valid user', async () => {
      // Create a test user
      const userData = createTestUserData();
      const testUser = await createTestUser(userData);
      
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: userData.password, // Use original password, not hash
        }),
      });
      const response = await handler(event, mockContext);

      const data = assertSuccessResponse(response, 200);
      
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testUser.email);
      expect(data.user.name).toBe(testUser.name);
      expect(data.user.role).toBe(testUser.role);
      expect(data.user.id).toBe(testUser.id);
      expect(data.user.password_hash).toBeUndefined(); // Should not return password hash
      
      expect(data.token).toBeDefined();
      expect(typeof data.token).toBe('string');
    });

    it('should reject login with non-existent email', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@test.com',
          password: 'testpassword123',
        }),
      });
      const response = await handler(event, mockContext);

      assertErrorResponse(response, 401, 'Invalid email or password');
    });

    it('should reject login with wrong password', async () => {
      // Create a test user
      const userData = createTestUserData();
      const testUser = await createTestUser(userData);
      
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: 'wrongpassword',
        }),
      });
      const response = await handler(event, mockContext);

      assertErrorResponse(response, 401, 'Invalid email or password');
    });
  });

  describe('Token Generation', () => {
    it('should generate valid JWT token with correct payload', async () => {
      const userData = createTestUserData();
      const testUser = await createTestUser(userData);
      
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: userData.password,
        }),
      });
      const response = await handler(event, mockContext);

      const data = assertSuccessResponse(response, 200);
      
      // Verify token is a valid JWT format (has 3 parts separated by dots)
      const tokenParts = data.token.split('.');
      expect(tokenParts).toHaveLength(3);
      
      // Decode the payload (middle part) to verify contents
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      expect(payload.userId).toBe(testUser.id);
      expect(payload.email).toBe(testUser.email);
      expect(payload.role).toBe(testUser.role);
      expect(payload.exp).toBeDefined(); // Should have expiration
      expect(payload.iss).toBe('drawn-to-run'); // Should have issuer
    });
  });

  describe('Role-based Authentication', () => {
    it('should authenticate participant user', async () => {
      const userData = createTestUserData({ role: 'participant' });
      const testUser = await createTestUser(userData);
      
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: userData.password,
        }),
      });
      const response = await handler(event, mockContext);

      const data = assertSuccessResponse(response, 200);
      expect(data.user.role).toBe('participant');
    });

    it('should authenticate organizer user', async () => {
      const userData = createTestUserData({ role: 'organizer' });
      const testUser = await createTestUser(userData);
      
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: userData.password,
        }),
      });
      const response = await handler(event, mockContext);

      const data = assertSuccessResponse(response, 200);
      expect(data.user.role).toBe('organizer');
    });

    it('should authenticate admin user', async () => {
      const userData = createTestUserData({ role: 'admin' });
      const testUser = await createTestUser(userData);
      
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: userData.password,
        }),
      });
      const response = await handler(event, mockContext);

      const data = assertSuccessResponse(response, 200);
      expect(data.user.role).toBe('admin');
    });
  });

  describe('Security', () => {
    it('should not leak password hash in response', async () => {
      const userData = createTestUserData();
      const testUser = await createTestUser(userData);
      
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: userData.password,
        }),
      });
      const response = await handler(event, mockContext);

      const data = assertSuccessResponse(response, 200);
      expect(data.user.password_hash).toBeUndefined();
    });

    it('should use consistent error message for invalid credentials', async () => {
      // Test with non-existent user
      const event1 = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@test.com',
          password: 'anypassword',
        }),
      });
      const response1 = await handler(event1, mockContext);
      const error1 = assertErrorResponse(response1, 401);

      // Test with wrong password for existing user
      const userData = createTestUserData();
      const testUser = await createTestUser(userData);
      
      const event2 = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: 'wrongpassword',
        }),
      });
      const response2 = await handler(event2, mockContext);
      const error2 = assertErrorResponse(response2, 401);

      // Both should return the same error message to prevent user enumeration
      expect(error1.message).toBe(error2.message);
      expect(error1.message).toBe('Invalid email or password');
    });
  });

  describe('Response Format', () => {
    it('should return consistent API response format', async () => {
      const userData = createTestUserData();
      const testUser = await createTestUser(userData);
      
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: userData.password,
        }),
      });
      const response = await handler(event, mockContext);

      expect(response.statusCode).toBe(200);
      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
    });
  });
});