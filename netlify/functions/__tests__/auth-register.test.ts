// Test suite for auth-register function
import { handler } from '../auth-register';
import { createMockEvent, createMockContext, assertSuccessResponse, assertErrorResponse, createTestUserData } from './helpers';
import { createTestUser } from './fixtures';
import './setup';

describe('auth-register function', () => {
  const mockContext = createMockContext();

  describe('HTTP Method Validation', () => {
    it('should handle OPTIONS request (CORS preflight)', async () => {
      const event = createMockEvent({ httpMethod: 'OPTIONS' });
      const response = await handler(event, mockContext);

      expect(response).toBeDefined();
      expect((response as any).statusCode).toBe(200);
      expect((response as any).headers['Access-Control-Allow-Origin']).toBe('*');
      expect((response as any).headers['Access-Control-Allow-Methods']).toContain('POST');
    });

    it('should reject non-POST requests', async () => {
      const event = createMockEvent({ httpMethod: 'GET' });
      const response = await handler(event, mockContext);

      assertErrorResponse(response as any, 400, 'Method not allowed');
    });
  });

  describe('Request Validation', () => {
    it('should reject requests with invalid JSON', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        body: 'invalid json',
      });
      const response = await handler(event, mockContext);

      assertErrorResponse(response as any, 400, 'Invalid JSON');
    });

    it('should reject requests with missing required fields', async () => {
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify({}),
      });
      const response = await handler(event, mockContext);

      assertErrorResponse(response as any, 422);
    });

    it('should reject requests with invalid email format', async () => {
      const userData = createTestUserData({ email: 'invalid-email' });
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(userData),
      });
      const response = await handler(event, mockContext);

      assertErrorResponse(response as any, 422, 'Invalid email');
    });

    it('should reject requests with short password', async () => {
      const userData = createTestUserData({ password: '123' });
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(userData),
      });
      const response = await handler(event, mockContext);

      assertErrorResponse(response as any, 422, 'Password must be at least 8 characters');
    });

    it('should reject requests with short name', async () => {
      const userData = createTestUserData({ name: 'A' });
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(userData),
      });
      const response = await handler(event, mockContext);

      assertErrorResponse(response as any, 422, 'Name must be at least 2 characters');
    });
  });

  describe('User Registration', () => {
    it('should successfully register a new user', async () => {
      const userData = createTestUserData();
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(userData),
      });
      const response = await handler(event, mockContext);

      const data = assertSuccessResponse(response as any, 201);
      
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(userData.email);
      expect(data.user.name).toBe(userData.name);
      expect(data.user.role).toBe(userData.role);
      expect(data.user.id).toBeDefined();
      expect(data.user.password_hash).toBeUndefined(); // Should not return password hash
      
      expect(data.token).toBeDefined();
      expect(typeof data.token).toBe('string');
    });

    it('should register user with default participant role', async () => {
      const userData = createTestUserData();
      delete userData.role; // Remove role to test default
      
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(userData),
      });
      const response = await handler(event, mockContext);

      const data = assertSuccessResponse(response as any, 201);
      expect(data.user.role).toBe('participant');
    });

    it('should register user with organizer role', async () => {
      const userData = createTestUserData({ role: 'organizer' });
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(userData),
      });
      const response = await handler(event, mockContext);

      const data = assertSuccessResponse(response as any, 201);
      expect(data.user.role).toBe('organizer');
    });

    it('should register user with admin role', async () => {
      const userData = createTestUserData({ role: 'admin' });
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(userData),
      });
      const response = await handler(event, mockContext);

      const data = assertSuccessResponse(response as any, 201);
      expect(data.user.role).toBe('admin');
    });
  });

  describe('Duplicate Email Prevention', () => {
    it('should reject registration with existing email', async () => {
      // Create a user first
      const existingUser = await createTestUser();
      
      // Try to register with the same email
      const userData = createTestUserData({ email: existingUser.email });
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(userData),
      });
      const response = await handler(event, mockContext);

      assertErrorResponse(response as any, 409, 'Email address is already registered');
    });
  });

  describe('Token Generation', () => {
    it('should generate valid JWT token with user data', async () => {
      const userData = createTestUserData();
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(userData),
      });
      const response = await handler(event, mockContext);

      const data = assertSuccessResponse(response as any, 201);
      
      // Verify token is a valid JWT format (has 3 parts separated by dots)
      const tokenParts = data.token.split('.');
      expect(tokenParts).toHaveLength(3);
      
      // The token should be usable for authentication
      expect(data.token).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Test with extremely long name to potentially trigger database error
      const userData = createTestUserData({ 
        name: 'A'.repeat(1000) // Very long name that might exceed database limits
      });
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(userData),
      });
      const response = await handler(event, mockContext);

      // Should return 500 or validation error, not crash
      expect([400, 422, 500]).toContain((response as any).statusCode);
    });
  });

  describe('Response Format', () => {
    it('should return consistent API response format', async () => {
      const userData = createTestUserData();
      const event = createMockEvent({
        httpMethod: 'POST',
        body: JSON.stringify(userData),
      });
      const response = await handler(event, mockContext);

      expect((response as any).statusCode).toBe(201);
      expect((response as any).headers['Content-Type']).toBe('application/json');
      expect((response as any).headers['Access-Control-Allow-Origin']).toBe('*');
      
      const body = JSON.parse((response as any).body);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
    });
  });
});