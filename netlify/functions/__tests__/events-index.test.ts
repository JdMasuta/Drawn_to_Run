// Test suite for events/index.ts function
import { handler } from '../events/index';
import { 
  createMockEvent, 
  createMockContext, 
  createAuthenticatedRequest,
  createQueryStringEvent,
  assertErrorResponse, 
  assertEventResponse,
  createTestEventData 
} from './helpers';
import { 
  createTestUser, 
  createTestEvent,
  createTestEventWithTags
} from './fixtures';
import './setup';

describe('events/index function', () => {
  const mockContext = createMockContext();

  describe('HTTP Method Validation', () => {
    it('should handle OPTIONS request (CORS preflight)', async () => {
      const event = createMockEvent({ httpMethod: 'OPTIONS' });
      const response = await handler(event, mockContext);

      expect(response).toBeDefined();
      expect((response as any).statusCode).toBe(200);
      expect((response as any).headers['Access-Control-Allow-Origin']).toBe('*');
      expect((response as any).headers['Access-Control-Allow-Methods']).toContain('GET');
      expect((response as any).headers['Access-Control-Allow-Methods']).toContain('POST');
    });

    it('should reject unsupported HTTP methods', async () => {
      const event = createMockEvent({ httpMethod: 'PUT' });
      const response = await handler(event, mockContext);

      assertErrorResponse(response as any, 400, 'Method not allowed');
    });
  });

  describe('GET /api/events - Event Listing', () => {
    describe('Basic Functionality', () => {
      it('should return empty event list when no events exist', async () => {
        const event = createQueryStringEvent({});
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events).toEqual([]);
        expect(data.meta.total).toBe(0);
        expect(data.meta.page).toBe(1);
        expect(data.meta.limit).toBe(20);
        expect(data.meta.totalPages).toBe(0);
      });

      it('should return events with default pagination', async () => {
        // Create test events
        const organizer = await createTestUser({ role: 'organizer' });
        await createTestEvent(organizer.id);
        await createTestEvent(organizer.id);

        const event = createQueryStringEvent({});
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events).toHaveLength(2);
        expect(data.meta.total).toBe(2);
        expect(data.meta.page).toBe(1);
        expect(data.meta.limit).toBe(20);
        expect(data.meta.totalPages).toBe(1);
        
        // Verify event structure
        const returnedEvent = data.events[0];
        expect(returnedEvent.id).toBeDefined();
        expect(returnedEvent.title).toBeDefined();
        expect(returnedEvent.event_date).toBeDefined();
        expect(returnedEvent.location).toBeDefined();
        expect(returnedEvent.organizer).toBeDefined();
        expect(returnedEvent.organizer.name).toBe(organizer.name);
        expect(returnedEvent.tags).toEqual([]);
        expect(returnedEvent.registration_count).toBe(0);
      });
    });

    describe('Pagination', () => {
      beforeEach(async () => {
        // Create multiple events for pagination testing
        const organizer = await createTestUser({ role: 'organizer' });
        for (let i = 0; i < 25; i++) {
          await createTestEvent(organizer.id, { 
            title: `Test Event ${i + 1}`,
            event_date: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString()
          });
        }
      });

      it('should handle custom page and limit', async () => {
        const event = createQueryStringEvent({ page: '2', limit: '10' });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events).toHaveLength(10);
        expect(data.meta.page).toBe(2);
        expect(data.meta.limit).toBe(10);
        expect(data.meta.total).toBe(25);
        expect(data.meta.totalPages).toBe(3);
      });

      it('should handle last page correctly', async () => {
        const event = createQueryStringEvent({ page: '3', limit: '10' });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events).toHaveLength(5); // Remaining events
        expect(data.meta.page).toBe(3);
        expect(data.meta.totalPages).toBe(3);
      });

      it('should handle invalid page numbers', async () => {
        const event = createQueryStringEvent({ page: '0' });
        const response = await handler(event, mockContext);

        assertErrorResponse(response as any, 422);
      });

      it('should enforce maximum limit', async () => {
        const event = createQueryStringEvent({ limit: '150' });
        const response = await handler(event, mockContext);

        assertErrorResponse(response as any, 422);
      });
    });

    describe('Search Functionality', () => {
      beforeEach(async () => {
        const organizer = await createTestUser({ role: 'organizer' });
        await createTestEvent(organizer.id, {
          title: 'Boston Marathon',
          description: 'Annual marathon race in Boston',
          location: 'Boston, MA'
        });
        await createTestEvent(organizer.id, {
          title: 'Central Park 5K',
          description: 'Fun run in Central Park',
          location: 'New York, NY'
        });
        await createTestEvent(organizer.id, {
          title: 'Chicago Half Marathon',
          description: 'Half marathon through downtown Chicago',
          location: 'Chicago, IL'
        });
      });

      it('should search by title', async () => {
        const event = createQueryStringEvent({ search: 'Boston' });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events).toHaveLength(1);
        expect(data.events[0].title).toBe('Boston Marathon');
      });

      it('should search by description', async () => {
        const event = createQueryStringEvent({ search: 'Fun run' });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events).toHaveLength(1);
        expect(data.events[0].title).toBe('Central Park 5K');
      });

      it('should search by location', async () => {
        const event = createQueryStringEvent({ search: 'Chicago' });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events).toHaveLength(1);
        expect(data.events[0].title).toBe('Chicago Half Marathon');
      });

      it('should handle case-insensitive search', async () => {
        const event = createQueryStringEvent({ search: 'boston' });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events).toHaveLength(1);
        expect(data.events[0].title).toBe('Boston Marathon');
      });

      it('should return empty results for non-matching search', async () => {
        const event = createQueryStringEvent({ search: 'NonExistent' });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events).toHaveLength(0);
      });
    });

    describe('Location Filtering', () => {
      beforeEach(async () => {
        const organizer = await createTestUser({ role: 'organizer' });
        await createTestEvent(organizer.id, { location: 'Boston, MA' });
        await createTestEvent(organizer.id, { location: 'New York, NY' });
        await createTestEvent(organizer.id, { location: 'Boston Common, MA' });
      });

      it('should filter by location', async () => {
        const event = createQueryStringEvent({ location: 'Boston' });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events).toHaveLength(2);
        data.events.forEach((evt: any) => {
          expect(evt.location).toContain('Boston');
        });
      });
    });

    describe('Date Filtering', () => {
      beforeEach(async () => {
        const organizer = await createTestUser({ role: 'organizer' });
        await createTestEvent(organizer.id, {
          event_date: '2024-06-01T10:00:00Z'
        });
        await createTestEvent(organizer.id, {
          event_date: '2024-07-15T10:00:00Z'
        });
        await createTestEvent(organizer.id, {
          event_date: '2024-08-30T10:00:00Z'
        });
      });

      it('should filter by date_from', async () => {
        const event = createQueryStringEvent({ date_from: '2024-07-01T00:00:00Z' });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events).toHaveLength(2);
        data.events.forEach((evt: any) => {
          expect(new Date(evt.event_date) >= new Date('2024-07-01')).toBe(true);
        });
      });

      it('should filter by date_to', async () => {
        const event = createQueryStringEvent({ date_to: '2024-07-31T23:59:59Z' });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events).toHaveLength(2);
        data.events.forEach((evt: any) => {
          expect(new Date(evt.event_date) <= new Date('2024-07-31')).toBe(true);
        });
      });

      it('should filter by date range', async () => {
        const event = createQueryStringEvent({
          date_from: '2024-07-01T00:00:00Z',
          date_to: '2024-07-31T23:59:59Z'
        });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events).toHaveLength(1);
        expect(data.events[0].event_date).toBe('2024-07-15T10:00:00.000Z');
      });
    });

    describe('Distance Filtering', () => {
      beforeEach(async () => {
        const organizer = await createTestUser({ role: 'organizer' });
        await createTestEvent(organizer.id, {
          distance_options: ['5K', '10K']
        });
        await createTestEvent(organizer.id, {
          distance_options: ['Half Marathon', 'Marathon']
        });
        await createTestEvent(organizer.id, {
          distance_options: ['5K', 'Half Marathon']
        });
      });

      it('should filter by distance option', async () => {
        const event = createQueryStringEvent({ distance: '5K' });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events).toHaveLength(2);
        data.events.forEach((evt: any) => {
          expect(evt.distance_options).toContain('5K');
        });
      });

      it('should filter by marathon distance', async () => {
        const event = createQueryStringEvent({ distance: 'Marathon' });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events).toHaveLength(1);
        expect(data.events[0].distance_options).toContain('Marathon');
      });
    });

    describe('Tag Filtering', () => {
      it('should filter by tags', async () => {
        const organizer = await createTestUser({ role: 'organizer' });
        const { event, tags } = await createTestEventWithTags(organizer.id);
        
        // Create another event without tags
        await createTestEvent(organizer.id);

        const event_req = createQueryStringEvent({ 
          tags: tags.map((t: any) => t.id).join(',')
        });
        const response = await handler(event_req, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events).toHaveLength(1);
        expect(data.events[0].id).toBe(event.id);
        expect(data.events[0].tags).toHaveLength(2);
      });

      it('should handle invalid tag IDs', async () => {
        const event = createQueryStringEvent({ tags: 'invalid,999999' });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events).toHaveLength(0);
      });
    });

    describe('Sorting', () => {
      beforeEach(async () => {
        const organizer = await createTestUser({ role: 'organizer' });
        await createTestEvent(organizer.id, {
          title: 'Z Event',
          event_date: '2024-06-01T10:00:00Z'
        });
        await createTestEvent(organizer.id, {
          title: 'A Event',
          event_date: '2024-08-01T10:00:00Z'
        });
        await createTestEvent(organizer.id, {
          title: 'M Event',
          event_date: '2024-07-01T10:00:00Z'
        });
      });

      it('should sort by event_date ascending (default)', async () => {
        const event = createQueryStringEvent({});
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events).toHaveLength(3);
        expect(data.events[0].title).toBe('Z Event');
        expect(data.events[1].title).toBe('M Event');
        expect(data.events[2].title).toBe('A Event');
      });

      it('should sort by event_date descending', async () => {
        const event = createQueryStringEvent({ sort: 'event_date', order: 'desc' });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events[0].title).toBe('A Event');
        expect(data.events[1].title).toBe('M Event');
        expect(data.events[2].title).toBe('Z Event');
      });

      it('should sort by title ascending', async () => {
        const event = createQueryStringEvent({ sort: 'title', order: 'asc' });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events[0].title).toBe('A Event');
        expect(data.events[1].title).toBe('M Event');
        expect(data.events[2].title).toBe('Z Event');
      });
    });

    describe('Combined Filters', () => {
      it('should apply multiple filters together', async () => {
        const organizer = await createTestUser({ role: 'organizer' });
        
        // Create events with different characteristics
        await createTestEvent(organizer.id, {
          title: 'Boston 5K',
          location: 'Boston, MA',
          distance_options: ['5K'],
          event_date: '2024-07-15T10:00:00Z'
        });
        
        await createTestEvent(organizer.id, {
          title: 'Boston Marathon',
          location: 'Boston, MA',
          distance_options: ['Marathon'],
          event_date: '2024-07-20T10:00:00Z'
        });
        
        await createTestEvent(organizer.id, {
          title: 'NYC 5K',
          location: 'New York, NY',
          distance_options: ['5K'],
          event_date: '2024-07-25T10:00:00Z'
        });

        const event = createQueryStringEvent({
          search: 'Boston',
          distance: '5K',
          date_from: '2024-07-01T00:00:00Z',
          date_to: '2024-07-31T23:59:59Z'
        });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 200);
        expect(data.events).toHaveLength(1);
        expect(data.events[0].title).toBe('Boston 5K');
      });
    });
  });

  describe('POST /api/events - Event Creation', () => {
    describe('Authentication & Authorization', () => {
      it('should require authentication', async () => {
        const eventData = createTestEventData(1);
        const event = createMockEvent({
          httpMethod: 'POST',
          body: JSON.stringify(eventData)
        });
        const response = await handler(event, mockContext);

        assertErrorResponse(response as any, 401, 'Authentication required');
      });

      it('should require organizer or admin role', async () => {
        const participant = await createTestUser({ role: 'participant' });
        const eventData = createTestEventData(1);
        
        const event = await createAuthenticatedRequest(participant, {
          httpMethod: 'POST',
          body: JSON.stringify(eventData)
        });
        const response = await handler(event, mockContext);

        assertErrorResponse(response as any, 403, 'Insufficient permissions');
      });

      it('should allow organizer to create events', async () => {
        const organizer = await createTestUser({ role: 'organizer' });
        const eventData = createTestEventData(organizer.id);
        
        const event = await createAuthenticatedRequest(organizer, {
          httpMethod: 'POST',
          body: JSON.stringify(eventData)
        });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 201);
        expect(data.title).toBe(eventData.title);
        expect(data.created_by).toBe(organizer.id);
        expect(data.organizer.name).toBe(organizer.name);
      });

      it('should allow admin to create events', async () => {
        const admin = await createTestUser({ role: 'admin' });
        const eventData = createTestEventData(admin.id);
        
        const event = await createAuthenticatedRequest(admin, {
          httpMethod: 'POST',
          body: JSON.stringify(eventData)
        });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 201);
        expect(data.title).toBe(eventData.title);
        expect(data.created_by).toBe(admin.id);
      });
    });

    describe('Request Validation', () => {
      let organizer: any;

      beforeEach(async () => {
        organizer = await createTestUser({ role: 'organizer' });
      });

      it('should reject invalid JSON', async () => {
        const event = await createAuthenticatedRequest(organizer, {
          httpMethod: 'POST',
          body: 'invalid json'
        });
        const response = await handler(event, mockContext);

        assertErrorResponse(response as any, 400, 'Invalid JSON');
      });

      it('should require title', async () => {
        const eventData = createTestEventData(organizer.id);
        delete eventData.title;
        
        const event = await createAuthenticatedRequest(organizer, {
          httpMethod: 'POST',
          body: JSON.stringify(eventData)
        });
        const response = await handler(event, mockContext);

        assertErrorResponse(response as any, 422);
      });

      it('should require event_date', async () => {
        const eventData = createTestEventData(organizer.id);
        delete eventData.event_date;
        
        const event = await createAuthenticatedRequest(organizer, {
          httpMethod: 'POST',
          body: JSON.stringify(eventData)
        });
        const response = await handler(event, mockContext);

        assertErrorResponse(response as any, 422);
      });

      it('should require location', async () => {
        const eventData = createTestEventData(organizer.id);
        delete eventData.location;
        
        const event = await createAuthenticatedRequest(organizer, {
          httpMethod: 'POST',
          body: JSON.stringify(eventData)
        });
        const response = await handler(event, mockContext);

        assertErrorResponse(response as any, 422);
      });

      it('should require distance_options', async () => {
        const eventData = createTestEventData(organizer.id);
        delete eventData.distance_options;
        
        const event = await createAuthenticatedRequest(organizer, {
          httpMethod: 'POST',
          body: JSON.stringify(eventData)
        });
        const response = await handler(event, mockContext);

        assertErrorResponse(response as any, 422);
      });

      it('should validate date format', async () => {
        const eventData = createTestEventData(organizer.id);
        eventData.event_date = 'invalid-date';
        
        const event = await createAuthenticatedRequest(organizer, {
          httpMethod: 'POST',
          body: JSON.stringify(eventData)
        });
        const response = await handler(event, mockContext);

        assertErrorResponse(response as any, 422, 'Invalid date format');
      });

      it('should validate capacity is positive', async () => {
        const eventData = createTestEventData(organizer.id);
        eventData.capacity = -1;
        
        const event = await createAuthenticatedRequest(organizer, {
          httpMethod: 'POST',
          body: JSON.stringify(eventData)
        });
        const response = await handler(event, mockContext);

        assertErrorResponse(response as any, 422);
      });
    });

    describe('Event Creation', () => {
      let organizer: any;

      beforeEach(async () => {
        organizer = await createTestUser({ role: 'organizer' });
      });

      it('should create event with all fields', async () => {
        const eventData = createTestEventData(organizer.id, {
          title: 'Complete Test Event',
          description: 'Full event with all fields',
          capacity: 100,
          registration_fee: 25.00,
          early_bird_fee: 20.00,
          early_bird_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          latitude: 42.3601,
          longitude: -71.0589,
          banner_image: 'https://example.com/banner.jpg'
        });
        
        const event = await createAuthenticatedRequest(organizer, {
          httpMethod: 'POST',
          body: JSON.stringify(eventData)
        });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 201);
        expect(data.title).toBe(eventData.title);
        expect(data.description).toBe(eventData.description);
        expect(data.capacity).toBe(eventData.capacity);
        expect(data.registration_fee).toBe(eventData.registration_fee);
        expect(data.early_bird_fee).toBe(eventData.early_bird_fee);
        expect(data.latitude).toBe(eventData.latitude);
        expect(data.longitude).toBe(eventData.longitude);
        expect(data.banner_image).toBe(eventData.banner_image);
        expect(data.created_by).toBe(organizer.id);
        expect(data.status).toBe('active');
        expect(data.organizer.name).toBe(organizer.name);
        expect(data.tags).toEqual([]);
        expect(data.registration_count).toBe(0);
      });

      it('should create event with minimal required fields', async () => {
        const eventData = createTestEventData(organizer.id, {
          title: 'Minimal Event',
          event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Test Location',
          distance_options: ['5K']
        });
        
        const event = await createAuthenticatedRequest(organizer, {
          httpMethod: 'POST',
          body: JSON.stringify(eventData)
        });
        const response = await handler(event, mockContext);

        const data = assertEventResponse(response as any, 201);
        expect(data.title).toBe(eventData.title);
        expect(data.location).toBe(eventData.location);
        expect(data.distance_options).toEqual(eventData.distance_options);
        expect(data.description).toBeNull();
        expect(data.capacity).toBeNull();
      });
    });

    describe('Response Format', () => {
      it('should return consistent event response format', async () => {
        const organizer = await createTestUser({ role: 'organizer' });
        const eventData = createTestEventData(organizer.id);
        
        const event = await createAuthenticatedRequest(organizer, {
          httpMethod: 'POST',
          body: JSON.stringify(eventData)
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

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const organizer = await createTestUser({ role: 'organizer' });
      
      // Create event with extremely long title to potentially trigger database error
      const eventData = createTestEventData(organizer.id, {
        title: 'A'.repeat(1000) // Very long title that might exceed database limits
      });
      
      const event = await createAuthenticatedRequest(organizer, {
        httpMethod: 'POST',
        body: JSON.stringify(eventData)
      });
      const response = await handler(event, mockContext);

      // Should return 500 or validation error, not crash
      expect([400, 422, 500]).toContain((response as any).statusCode);
    });

    it('should handle unexpected errors', async () => {
      // Test with malformed event structure
      const event = createMockEvent({
        httpMethod: 'GET',
        path: '/api/events',
        headers: {}
      });
      const response = await handler(event, mockContext);

      // Should handle gracefully
      expect((response as any).statusCode).toBeDefined();
    });
  });
});