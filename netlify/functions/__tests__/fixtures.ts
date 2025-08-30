// Test data fixtures for Netlify functions
import { Database } from '../_shared/database';
import { AuthService } from '../_shared/auth';
import { createTestUserData, createTestEventData, getTestId } from './helpers';

export interface TestUser {
  id: number;
  email: string;
  name: string;
  role: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface TestEvent {
  id: number;
  title: string;
  description: string;
  event_date: string;
  location: string;
  distance_options: string[];
  created_by: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TestComment {
  id: number;
  event_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

// Create test user in database
export async function createTestUser(overrides: Partial<any> = {}): Promise<TestUser> {
  const userData = createTestUserData(overrides);
  
  const user = await AuthService.createUser(userData);
  if (!user) {
    throw new Error('Failed to create test user');
  }
  
  // Get full user data including password hash
  const fullUser = await AuthService.getUserByEmail(user.email);
  if (!fullUser) {
    throw new Error('Failed to retrieve created test user');
  }
  
  return fullUser as TestUser;
}

// Create test event in database
export async function createTestEvent(createdBy: number, overrides: Partial<any> = {}): Promise<TestEvent> {
  const eventData = createTestEventData(createdBy, overrides);
  
  const event = await Database.queryOne<TestEvent>(`
    INSERT INTO events (
      title, description, event_date, location, latitude, longitude,
      distance_options, capacity, registration_fee, early_bird_fee,
      early_bird_deadline, banner_image, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `, [
    eventData.title,
    eventData.description,
    eventData.event_date,
    eventData.location,
    eventData.latitude || null,
    eventData.longitude || null,
    eventData.distance_options,
    eventData.capacity || null,
    eventData.registration_fee || null,
    eventData.early_bird_fee || null,
    eventData.early_bird_deadline || null,
    eventData.banner_image || null,
    eventData.created_by,
  ]);
  
  if (!event) {
    throw new Error('Failed to create test event');
  }
  
  return event;
}

// Create test comment in database
export async function createTestComment(eventId: number, userId: number, overrides: Partial<any> = {}): Promise<TestComment> {
  const id = getTestId();
  const content = overrides.content || `Test comment ${id}`;
  
  const comment = await Database.queryOne<TestComment>(`
    INSERT INTO comments (event_id, user_id, content)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [eventId, userId, content]);
  
  if (!comment) {
    throw new Error('Failed to create test comment');
  }
  
  return comment;
}

// Create test registration
export async function createTestRegistration(eventId: number, userId: number, distance: string = '5K'): Promise<any> {
  const registration = await Database.queryOne(`
    INSERT INTO registrations (event_id, user_id, distance)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [eventId, userId, distance]);
  
  if (!registration) {
    throw new Error('Failed to create test registration');
  }
  
  return registration;
}

// Create test follow relationship
export async function createTestFollow(followerId: number, followingId: number): Promise<any> {
  const follow = await Database.queryOne(`
    INSERT INTO user_follows (follower_id, following_id)
    VALUES ($1, $2)
    RETURNING *
  `, [followerId, followingId]);
  
  if (!follow) {
    throw new Error('Failed to create test follow');
  }
  
  return follow;
}

// Create test email subscription
export async function createTestSubscription(email?: string): Promise<any> {
  const testEmail = email || `test_${getTestId()}@test.com`;
  
  const subscription = await Database.queryOne(`
    INSERT INTO email_subscribers (email)
    VALUES ($1)
    RETURNING *
  `, [testEmail]);
  
  if (!subscription) {
    throw new Error('Failed to create test subscription');
  }
  
  return subscription;
}

// Create test tag
export async function createTestTag(name?: string, category: string = 'test'): Promise<any> {
  const tagName = name || `test_tag_${getTestId()}`;
  
  const tag = await Database.queryOne(`
    INSERT INTO tags (name, category, color)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [tagName, category, '#FF0000']);
  
  if (!tag) {
    throw new Error('Failed to create test tag');
  }
  
  return tag;
}

// Create event with registrations for capacity testing
export async function createTestEventWithRegistrations(organizerId: number, capacity: number = 10): Promise<{
  event: TestEvent;
  registrations: any[];
}> {
  const event = await createTestEvent(organizerId, { capacity });
  const registrations = [];
  
  // Create registrations up to capacity - 2 (leave some room for testing)
  const registrationCount = Math.min(capacity - 2, 5);
  for (let i = 0; i < registrationCount; i++) {
    const user = await createTestUser();
    const registration = await createTestRegistration(event.id, user.id);
    registrations.push(registration);
  }
  
  return { event, registrations };
}

// Create event with threaded comments
export async function createTestEventWithComments(organizerId: number): Promise<{
  event: TestEvent;
  comments: any[];
}> {
  const event = await createTestEvent(organizerId);
  const comments = [];
  
  // Create parent comment
  const user1 = await createTestUser();
  const parentComment = await createTestComment(event.id, user1.id, { content: 'Parent comment' });
  comments.push(parentComment);
  
  // Create reply
  const user2 = await createTestUser();
  const replyComment = await Database.queryOne(`
    INSERT INTO comments (event_id, user_id, parent_id, content)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [event.id, user2.id, parentComment.id, 'Reply comment']);
  comments.push(replyComment);
  
  return { event, comments };
}

// Create event with tags
export async function createTestEventWithTags(organizerId: number): Promise<{
  event: TestEvent;
  tags: any[];
}> {
  const event = await createTestEvent(organizerId);
  const tags = [];
  
  // Create test tags
  const tag1 = await createTestTag('5K', 'distance');
  const tag2 = await createTestTag('Road Race', 'type');
  tags.push(tag1, tag2);
  
  // Associate tags with event
  await Database.query(`
    INSERT INTO event_tags (event_id, tag_id)
    VALUES ($1, $2), ($1, $3)
  `, [event.id, tag1.id, tag2.id]);
  
  return { event, tags };
}

// Create complete test scenario with user and event
export async function createTestScenario(): Promise<{
  user: TestUser;
  organizer: TestUser;
  event: TestEvent;
  comment: TestComment;
}> {
  // Create a regular user
  const user = await createTestUser();
  
  // Create an organizer
  const organizer = await createTestUser({ role: 'organizer' });
  
  // Create an event by the organizer
  const event = await createTestEvent(organizer.id);
  
  // Create a comment by the user
  const comment = await createTestComment(event.id, user.id);
  
  return { user, organizer, event, comment };
}