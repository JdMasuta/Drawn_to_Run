// Test environment variables (must be set before importing database)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';

// Set up database URL for testing - use existing DATABASE_URL or a default
if (!process.env.DATABASE_URL && !process.env.NETLIFY_DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
}

// Test environment setup for Netlify functions
import { Database } from '../_shared/database';

// Database connection for tests (should use test database)
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL or DATABASE_URL must be set for testing');
}

// Global test setup
beforeAll(async () => {
  // Test database connection
  const isConnected = await Database.testConnection();
  if (!isConnected) {
    throw new Error('Could not connect to test database');
  }
  
  console.log('✓ Connected to test database');
});

// Clean up test data before each test
beforeEach(async () => {
  await cleanupTestData();
});

// Clean up test data after all tests
afterAll(async () => {
  await cleanupTestData();
  console.log('✓ Test cleanup completed');
});

// Clean up all test data
export async function cleanupTestData(): Promise<void> {
  try {
    // Delete in order to respect foreign key constraints
    await Database.query('DELETE FROM activities WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'test_%@test.com\')');
    await Database.query('DELETE FROM user_follows WHERE follower_id IN (SELECT id FROM users WHERE email LIKE \'test_%@test.com\') OR following_id IN (SELECT id FROM users WHERE email LIKE \'test_%@test.com\')');
    await Database.query('DELETE FROM comments WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'test_%@test.com\')');
    await Database.query('DELETE FROM event_tags WHERE event_id IN (SELECT id FROM events WHERE created_by IN (SELECT id FROM users WHERE email LIKE \'test_%@test.com\'))');
    await Database.query('DELETE FROM registrations WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'test_%@test.com\')');
    await Database.query('DELETE FROM events WHERE created_by IN (SELECT id FROM users WHERE email LIKE \'test_%@test.com\')');
    await Database.query('DELETE FROM email_subscribers WHERE email LIKE \'test_%@test.com\'');
    await Database.query('DELETE FROM users WHERE email LIKE \'test_%@test.com\'');
  } catch (error) {
    console.warn('Cleanup warning:', error);
    // Don't fail tests if cleanup has issues
  }
}

// Utility to wait for database operations
export async function waitForDb(ms: number = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}