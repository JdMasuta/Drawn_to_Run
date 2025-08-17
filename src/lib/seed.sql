-- Seed data for Drawn to Run platform

-- Insert sample tags
INSERT INTO tags (name, category, color) VALUES
-- Distance tags
('5K', 'distance', '#3b82f6'),
('10K', 'distance', '#8b5cf6'),
('Half Marathon', 'distance', '#f59e0b'),
('Marathon', 'distance', '#ef4444'),

-- Location tags
('Urban', 'location', '#10b981'),
('Trail', 'location', '#059669'),
('Park', 'location', '#22c55e'),
('Beach', 'location', '#06b6d4'),

-- Type tags
('Charity', 'type', '#f97316'),
('Competition', 'type', '#dc2626'),
('Fun Run', 'type', '#84cc16'),
('Training', 'type', '#6366f1'),

-- Difficulty tags
('Beginner', 'difficulty', '#22c55e'),
('Intermediate', 'difficulty', '#f59e0b'),
('Advanced', 'difficulty', '#ef4444');

-- Insert sample users
INSERT INTO users (email, name, password_hash, role, email_verified) VALUES
('admin@drawntorun.com', 'Admin User', '$2b$10$placeholder_hash', 'admin', true),
('organizer@drawntorun.com', 'Event Organizer', '$2b$10$placeholder_hash', 'organizer', true),
('runner1@example.com', 'Jane Runner', '$2b$10$placeholder_hash', 'participant', true),
('runner2@example.com', 'John Jogger', '$2b$10$placeholder_hash', 'participant', true);

-- Insert sample events
INSERT INTO events (title, description, event_date, location, latitude, longitude, distance_options, capacity, registration_fee, early_bird_fee, early_bird_deadline, created_by, status) VALUES
(
    'Central Park 5K Fun Run',
    'Join us for a scenic 5K run through beautiful Central Park! Perfect for runners of all levels.',
    '2025-09-15 08:00:00',
    'Central Park, New York, NY',
    40.7829,
    -73.9654,
    ARRAY['5K'],
    200,
    25.00,
    20.00,
    '2025-08-15 23:59:59',
    2,
    'active'
),
(
    'Coastal Trail Challenge',
    'Experience breathtaking ocean views on this challenging coastal trail run. Choose your distance!',
    '2025-09-22 07:30:00',
    'Pacific Coast Highway, CA',
    36.2705,
    -121.8077,
    ARRAY['5K', '10K', 'Half Marathon'],
    150,
    35.00,
    30.00,
    '2025-08-22 23:59:59',
    2,
    'active'
),
(
    'City Marathon Championship',
    'The premier marathon event of the year! Elite and amateur runners welcome.',
    '2025-10-05 06:00:00',
    'Downtown Start Line, Chicago, IL',
    41.8781,
    -87.6298,
    ARRAY['Marathon', 'Half Marathon'],
    1000,
    85.00,
    70.00,
    '2025-09-05 23:59:59',
    2,
    'active'
);

-- Insert event-tag relationships
INSERT INTO event_tags (event_id, tag_id) VALUES
-- Central Park 5K Fun Run
(1, 1), -- 5K
(1, 3), -- Park
(1, 11), -- Fun Run
(1, 13), -- Beginner

-- Coastal Trail Challenge
(2, 1), -- 5K
(2, 2), -- 10K
(2, 3), -- Half Marathon
(2, 6), -- Trail
(2, 12), -- Competition
(2, 14), -- Intermediate

-- City Marathon Championship
(3, 3), -- Half Marathon
(3, 4), -- Marathon
(3, 5), -- Urban
(3, 12), -- Competition
(3, 15); -- Advanced

-- Insert sample email subscribers
INSERT INTO email_subscribers (email) VALUES
('newsletter1@example.com'),
('newsletter2@example.com'),
('newsletter3@example.com');