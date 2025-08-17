// Event service for API calls
import { EventController } from '../controllers/EventController';
import { UserController } from '../controllers/UserController';
import type { 
  Event,
  EventListResponse,
  CreateEventRequest,
  UpdateEventRequest,
  EventRegistrationRequest,
  Registration,
  Comment,
  CreateCommentRequest,
  EventQueryParams,
  UserRegistrationsQueryParams
} from '../types/api';

export class EventService {
  /**
   * Get events with filtering and pagination
   */
  static async getEvents(params?: EventQueryParams): Promise<EventListResponse> {
    return EventController.getEvents(params);
  }

  /**
   * Get single event by ID
   */
  static async getEvent(eventId: number): Promise<Event> {
    return EventController.getEvent(eventId);
  }

  /**
   * Create new event (organizer/admin only)
   */
  static async createEvent(data: CreateEventRequest): Promise<Event> {
    return EventController.createEvent(data);
  }

  /**
   * Update existing event (organizer/admin only)
   */
  static async updateEvent(eventId: number, data: UpdateEventRequest): Promise<Event> {
    return EventController.updateEvent(eventId, data);
  }

  /**
   * Delete event (admin only)
   */
  static async deleteEvent(eventId: number): Promise<void> {
    return EventController.deleteEvent(eventId);
  }

  /**
   * Register for an event
   */
  static async registerForEvent(eventId: number, data: EventRegistrationRequest): Promise<Registration> {
    return EventController.registerForEvent(eventId, data);
  }

  /**
   * Get event comments
   */
  static async getEventComments(eventId: number): Promise<Comment[]> {
    return EventController.getEventComments(eventId);
  }

  /**
   * Add comment to event
   */
  static async addEventComment(eventId: number, data: CreateCommentRequest): Promise<Comment> {
    return EventController.addEventComment(eventId, data);
  }

  /**
   * Get user's event registrations
   */
  static async getUserRegistrations(
    userId: number, 
    params?: UserRegistrationsQueryParams
  ): Promise<Registration[]> {
    return UserController.getUserRegistrations(userId, params);
  }

  /**
   * Update registration status
   */
  static async updateRegistration(registrationId: number, data: Partial<Registration>): Promise<Registration> {
    return UserController.updateRegistration(registrationId, data);
  }
}