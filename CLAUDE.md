# Drawn to Run

## Project Overview

A modern web application for managing running events (5K, 10K, fun runs, marathons) with a daily.dev-inspired interface, Strava integration, and comprehensive event management features.

## Tech Stack

### Frontend

- **Framework**: Vite + React 18 with TypeScript
- **Styling**: TailwindCSS
- **Routing**: React Router
- **State Management**:
  - React Query (server state)
  - Zustand (client state)
- **Forms**: React Hook Form
- **UI Components**: Custom component system

### Backend & Infrastructure

- **Hosting**: Netlify
- **Functions**: Netlify Functions (serverless)
- **Database**: Neon PostgreSQL
- **DB Integration**: @netlify/neon package
- **File Storage**: Netlify Blobs
- **Authentication**: JWT + OAuth2 (Strava)

### Third-Party Integrations

- **Strava API**: Activity sync, OAuth authentication
- **Instagram Basic Display API**: Media fetching
- **Weather API**: Event day forecasts

## Core Features

### 1. User Management

- Multi-tier user system (participants, organizers, admin)
- Email mailing list signup (no account required)
- Social login integration
- User profiles with running history and achievements

### 2. Event Management (Daily.dev-inspired)

- Card-based event feed layout
- Advanced tagging system (distance, location, type, difficulty)
- Comprehensive search and filtering
- Event registration system
- Capacity management

### 3. Community Features

- Comments system on events
- Event reviews and ratings
- Photo sharing capabilities
- Discussion forums
- User following system
- Activity feeds

### 4. Strava Integration

- OAuth2 authentication
- Automatic activity import
- Webhook integration for real-time updates
- Performance analytics
- Training plan suggestions
- Post-race verification

### 5. Media Management (Owner Features)

- Instagram post integration
- File upload system
- Image galleries with optimization
- Video support for highlights
- Automated event photo collection

## Database Schema

### Core Tables

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    strava_id VARCHAR(50) UNIQUE,
    strava_access_token TEXT,
    strava_refresh_token TEXT,
    profile_image TEXT,
    bio TEXT,
    role VARCHAR(20) DEFAULT 'participant',
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    distance_options TEXT[], -- ['5K', '10K', 'Half Marathon']
    capacity INTEGER,
    registration_fee DECIMAL(10, 2),
    early_bird_fee DECIMAL(10, 2),
    early_bird_deadline TIMESTAMP,
    banner_image TEXT,
    created_by INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50), -- 'distance', 'location', 'type', 'difficulty'
    color VARCHAR(7) -- hex color code
);

-- Event tags junction table
CREATE TABLE event_tags (
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, tag_id)
);

-- Registrations table
CREATE TABLE registrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    event_id INTEGER REFERENCES events(id),
    distance VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'registered', -- 'registered', 'completed', 'dns', 'dnf'
    bib_number INTEGER,
    finish_time INTERVAL,
    strava_activity_id VARCHAR(50),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Comments table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    parent_id INTEGER REFERENCES comments(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email subscribers table (mailing list)
CREATE TABLE email_subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Media table (photos, videos)
CREATE TABLE media (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id),
    user_id INTEGER REFERENCES users(id),
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    caption TEXT,
    instagram_url TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Design System

### Color Palette

```css
:root {
  /* Primary Colors */
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;

  /* Secondary Colors */
  --color-secondary-50: #f8fafc;
  --color-secondary-500: #64748b;
  --color-secondary-600: #475569;

  /* Accent Colors */
  --color-accent-orange: #f97316;
  --color-accent-green: #22c55e;

  /* Semantic Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
}
```

### Component Architecture

#### Key Components

- `<EventCard />` - Event display with actions
- `<FilterSidebar />` - Search and filter interface
- `<TagChip />` - Interactive tag displays
- `<UserAvatar />` - User profile display
- `<RegistrationModal />` - Event signup interface
- `<CommentSection />` - Community interaction
- `<MediaGallery />` - Photo/video displays

#### Layout Components

- `<Header />` - Navigation and user menu
- `<Sidebar />` - Filters and navigation
- `<EventFeed />` - Main content area
- `<Footer />` - Links and information

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/strava/callback` - Strava OAuth callback

### Events

- `GET /api/events` - List events with filters
- `POST /api/events` - Create event (organizer+)
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event (organizer+)
- `DELETE /api/events/:id` - Delete event (admin)

### Registrations

- `POST /api/events/:id/register` - Register for event
- `GET /api/users/:id/registrations` - User's registrations
- `PUT /api/registrations/:id` - Update registration

### Community

- `GET /api/events/:id/comments` - Get event comments
- `POST /api/events/:id/comments` - Add comment
- `POST /api/subscribe` - Email list signup

### Strava Integration

- `POST /api/strava/webhook` - Strava activity webhook
- `GET /api/strava/activities` - Sync user activities
- `POST /api/strava/verify-completion` - Verify event completion

## Implementation Steps

### Step 1: Project Foundation

1.1. Initialize Vite + React + TypeScript project
1.2. Configure Netlify deployment settings
1.3. Set up Neon PostgreSQL database
1.4. Install core dependencies (React Router, TailwindCSS, etc.)
1.5. Create basic project structure and folders
1.6. Set up environment variables and configuration

### Step 2: Database Setup

2.1. Create database schema with all tables
2.2. Set up @netlify/neon integration
2.3. Create database seed data for testing
2.4. Implement database utility functions
2.5. Set up migrations system
2.6. Test database connections

### Step 3: Authentication System

3.1. Implement user registration endpoint
3.2. Create login/logout functionality
3.3. Set up JWT token management
3.4. Build user profile components
3.5. Implement email verification
3.6. Create protected route system

### Step 4: Basic Event Management

4.1. Create event CRUD API endpoints
4.2. Build event creation form (admin/organizer)
4.3. Implement event listing page
4.4. Create event detail page
4.5. Add basic event registration
4.6. Set up event capacity management

### Step 5: Daily.dev-style Interface

5.1. Design and implement EventCard component
5.2. Create responsive grid layout for events
5.3. Build search functionality
5.4. Implement tag system and filtering
5.5. Add sorting options (date, distance, popularity)
5.6. Create pagination system

### Step 6: Advanced Filtering & Search

6.1. Build FilterSidebar component
6.2. Implement multi-tag filtering
6.3. Add location-based search
6.4. Create date range filtering
6.5. Implement search autocomplete
6.6. Add saved search functionality

### Step 7: Community Features

7.1. Create comments system for events
7.2. Implement user following functionality
7.3. Build activity feed component
7.4. Add event rating and review system
7.5. Create user profile pages
7.6. Implement notification system

### Step 8: Strava Integration Setup

8.1. Register application with Strava API
8.2. Implement OAuth2 flow for Strava
8.3. Create Strava token management
8.4. Set up webhook endpoint for activities
8.5. Build activity import functionality
8.6. Test Strava authentication flow

### Step 9: Strava Data Sync

9.1. Implement automatic activity import
9.2. Create event completion verification
9.3. Build performance analytics
9.4. Add training data visualization
9.5. Implement webhook processing
9.6. Create Strava profile integration

### Step 10: Email System

10.1. Set up email service integration
10.2. Create mailing list signup (no account required)
10.3. Build email template system
10.4. Implement event notification emails
10.5. Create unsubscribe functionality
10.6. Add email verification system

### Step 11: Media Management

11.1. Set up Netlify Blobs for file storage
11.2. Create file upload components
11.3. Implement image optimization
11.4. Build media gallery system
11.5. Add drag-and-drop upload interface
11.6. Create media management dashboard

### Step 12: Instagram Integration

12.1. Set up Instagram Basic Display API
12.2. Implement Instagram OAuth flow
12.3. Create automatic post fetching
12.4. Build hashtag monitoring
12.5. Create Instagram gallery displays
12.6. Add manual post curation tools

### Step 13: Performance & Optimization

13.1. Implement lazy loading for images
13.2. Add skeleton loading states
13.3. Optimize database queries
13.4. Set up caching strategies
13.5. Implement error boundaries
13.6. Add performance monitoring

### Step 14: Mobile Responsiveness

14.1. Test and fix mobile layouts
14.2. Optimize touch interactions
14.3. Implement mobile-specific components
14.4. Add progressive web app features
14.5. Test across different devices
14.6. Optimize mobile performance

### Step 15: Testing & Quality Assurance

15.1. Write unit tests for components
15.2. Create integration tests for API endpoints
15.3. Implement end-to-end testing
15.4. Add accessibility testing
15.5. Perform security audit
15.6. Load testing and optimization

### Step 16: Production Deployment

16.1. Set up production environment variables
16.2. Configure production database
16.3. Set up CI/CD pipeline
16.4. Implement monitoring and logging
16.5. Create backup strategies
16.6. Deploy to production and test

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://username:password@hostname:port/database
NETLIFY_DATABASE_URL=postgresql://username:password@hostname:port/database

# Authentication
JWT_SECRET=your_jwt_secret_key
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret

# Instagram
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

# Email Service
EMAIL_SERVICE_API_KEY=your_email_service_key

# External APIs
WEATHER_API_KEY=your_weather_api_key
```

## File Structure

```
src/
├── components/
│   ├── auth/
│   ├── events/
│   ├── community/
│   ├── media/
│   └── ui/
├── pages/
├── hooks/
├── utils/
├── types/
├── styles/
└── lib/

netlify/
└── functions/
    ├── auth/
    ├── events/
    ├── strava/
    └── webhooks/

public/
├── images/
└── icons/
```

## Key Development Guidelines

1. **Component-First Development**: Build reusable components with clear props interfaces
2. **TypeScript Everywhere**: Full type safety across the application
3. **Responsive Design**: Mobile-first approach with desktop enhancements
4. **Performance Focus**: Lazy loading, code splitting, and optimization
5. **Accessibility**: WCAG 2.1 compliance for all interactive elements
6. **Error Handling**: Comprehensive error boundaries and user feedback
7. **Security**: Input validation, sanitization, and secure authentication
8. **Testing**: Unit tests for components, integration tests for APIs

## Success Metrics

- User registration and retention rates
- Event creation and participation numbers
- Strava integration adoption
- Community engagement (comments, follows)
- Page load times and performance scores
- Mobile usage and conversion rates

## Development Workflow Standard

### Enhanced Step Completion Protocol

After completing each major feature or step in the implementation roadmap, follow this comprehensive workflow:

1. **Complete Functional Implementation**: Build the feature according to specifications
2. **Write and Run Unit Tests**: 
   - Achieve minimum 80% test coverage for new code
   - Test all critical paths and edge cases
   - Use Jest + React Testing Library for frontend, Jest for backend
   - Mock external dependencies and API calls
3. **Run Security Audit** (for security-sensitive steps):
   - Validate authentication and authorization
   - Check input validation and sanitization
   - Review API endpoint security
   - Verify data protection measures
4. **Update Todo List**: Mark completed tasks and update progress tracking using TodoWrite tool
5. **Create Git Commits**: 
   - Organize changes into logical, focused commits
   - Use descriptive commit messages following the pattern: "Feature: [description]"
   - Include comprehensive commit descriptions explaining what was implemented
   - Always include co-authorship attribution:
     ```
     🤖 Generated with [Claude Code](https://claude.ai/code)
     
     Co-Authored-By: Claude <noreply@anthropic.com>
     ```
6. **Deploy to Netlify**: 
   - Run `npm run build` to verify no errors
   - Deploy using `netlify deploy --prod`
   - Verify deployment succeeds
7. **Update Documentation**: Keep CLAUDE.md and other documentation current with changes
8. **Document Development History**: 
   - Add session entry to DEVELOPMENT_HISTORY.md with problems and solutions
   - Update TECHNICAL_DECISIONS.md if architectural choices were made
   - Update KNOWN_ISSUES.md with any issues discovered or resolved
   - Add common problems and solutions to TROUBLESHOOTING.md

### Testing Framework Setup

**Frontend Testing (React Components):**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Test Structure:**
- `src/__tests__/` - Component tests
- `src/components/**/*.test.tsx` - Co-located component tests
- `src/hooks/**/*.test.ts` - Hook tests
- `netlify/functions/**/*.test.ts` - API endpoint tests

**Coverage Requirements:**
- Minimum 80% line coverage for new code
- 100% coverage for critical paths (authentication, payments, data validation)
- All user interactions must be tested
- All error handling paths must be tested

### Security Audit Checklist

**Authentication & Authorization:**
- [ ] JWT tokens have proper expiration and refresh mechanisms
- [ ] Password hashing uses bcrypt with proper salt rounds
- [ ] Role-based access controls are enforced
- [ ] Session management prevents hijacking
- [ ] Protected routes validate authentication server-side

**Input Validation:**
- [ ] All user inputs are validated and sanitized
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (input encoding, CSP headers)
- [ ] File upload restrictions (type, size, scanning)
- [ ] API rate limiting implemented

**Data Protection:**
- [ ] Sensitive data encrypted at rest and in transit
- [ ] API endpoints require proper authorization
- [ ] Database access uses least privilege principle
- [ ] Error messages don't leak sensitive information
- [ ] Audit logs capture security events

**Steps Requiring Security Audit:**
- Step 3: Authentication System
- Step 4: Event Management (user data, authorization)
- Step 7: Community Features (user interactions, profiles)
- Step 8: Strava Integration (OAuth, external APIs)
- Step 10: Email System (template injection, spam)
- Step 11: Media Management (file uploads)
- Step 12: Instagram Integration (API keys, data privacy)

### Benefits of This Enhanced Workflow

- **High Code Quality**: Unit tests catch regressions and ensure reliability
- **Security by Design**: Regular audits prevent vulnerabilities
- **Progress is never lost**: Regular commits ensure work is preserved
- **Changes are properly tracked**: Git history provides clear development timeline  
- **Production stays current**: Frequent deployments keep live site up-to-date
- **Quality assurance**: Build verification catches issues early
- **Team collaboration**: Clear commit messages and co-authorship tracking

### When to Apply This Workflow

- After completing any major feature (Steps 1-16 in the implementation plan)
- After significant bug fixes or improvements
- Before switching to work on different feature areas
- At natural stopping points in development

This enhanced workflow ensures consistent, reliable, and secure development practices while maintaining project momentum.
