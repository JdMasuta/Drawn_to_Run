// Event Controller - Handles all event-related API calls
import { ApiRouter } from '../lib/apiRouter';
import type { 
  ApiResponse,
  Event,
  EventListResponse,
  CreateEventRequest,
  UpdateEventRequest,
  EventRegistrationRequest,
  Registration,
  Comment,
  CreateCommentRequest,
  EventQueryParams
} from '../types/api';

export class EventController {
  /**
   * Get events with filtering and pagination
   */
  static async getEvents(params?: EventQueryParams): Promise<EventListResponse> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const response = await ApiRouter.get<ApiResponse<EventListResponse>>(`/events${queryString}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch events');
    }
    
    return response.data;
  }

  /**
   * Get single event by ID
   */
  static async getEvent(eventId: number): Promise<Event> {
    const response = await ApiRouter.get<ApiResponse<Event>>(`/events/${eventId}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch event');
    }
    
    return response.data;
  }

  /**
   * Create new event (organizer/admin only)
   */
  static async createEvent(data: CreateEventRequest): Promise<Event> {
    const response = await ApiRouter.post<ApiResponse<Event>>('/events', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create event');
    }
    
    return response.data;
  }

  /**
   * Update existing event (organizer/admin only)
   */
  static async updateEvent(eventId: number, data: UpdateEventRequest): Promise<Event> {
    const response = await ApiRouter.put<ApiResponse<Event>>(`/events/${eventId}`, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update event');
    }
    
    return response.data;
  }

  /**
   * Delete event (admin only)
   */
  static async deleteEvent(eventId: number): Promise<void> {
    const response = await ApiRouter.delete<ApiResponse>(`/events/${eventId}`);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete event');
    }
  }

  /**
   * Register for an event
   */
  static async registerForEvent(eventId: number, data: EventRegistrationRequest): Promise<Registration> {
    const response = await ApiRouter.post<ApiResponse<Registration>>(`/events/${eventId}/register`, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to register for event');
    }
    
    return response.data;
  }

  /**
   * Get event comments
   */
  static async getEventComments(eventId: number): Promise<Comment[]> {
    const response = await ApiRouter.get<ApiResponse<Comment[]>>(`/events/${eventId}/comments`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch comments');
    }
    
    return response.data;
  }

  /**
   * Add comment to event
   */
  static async addEventComment(eventId: number, data: CreateCommentRequest): Promise<Comment> {
    const response = await ApiRouter.post<ApiResponse<Comment>>(`/events/${eventId}/comments`, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add comment');
    }
    
    return response.data;
  }
}