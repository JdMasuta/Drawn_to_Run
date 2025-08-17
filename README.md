# Drawn to Run - Running Event Management Platform

A modern web application for managing running events (5K, 10K, fun runs, marathons) with a daily.dev-inspired interface, Strava integration, and comprehensive event management features.

## 🏃 Features

- **Event Discovery**: Browse and search running events with advanced filtering
- **Daily.dev-inspired UI**: Clean, card-based interface for event browsing
- **User Management**: Multi-tier user system (participants, organizers, admin)
- **Event Registration**: Streamlined registration process with multiple distance options
- **Community Features**: Comments, reviews, and social interactions
- **Strava Integration**: Sync activities and verify race completion
- **Responsive Design**: Mobile-first approach with progressive enhancement

## 🛠 Tech Stack

### Frontend
- **Framework**: Vite + React 18 with TypeScript
- **Styling**: TailwindCSS v4 with custom design system
- **Routing**: React Router v7
- **State Management**: React Query (server) + Zustand (client)
- **Forms**: React Hook Form
- **UI**: Custom component system

### Backend & Infrastructure
- **Hosting**: Netlify
- **Functions**: Netlify Functions (serverless)
- **Database**: Neon PostgreSQL
- **Authentication**: JWT + OAuth2 (Strava)
- **File Storage**: Netlify Blobs

### Third-Party Integrations
- **Strava API**: Activity sync, OAuth authentication
- **Instagram Basic Display API**: Media fetching
- **Weather API**: Event day forecasts

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Neon PostgreSQL database (for production)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd drawn-to-run
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/          # Authentication components
│   ├── events/        # Event-related components
│   ├── community/     # Community features
│   ├── media/         # Media management
│   └── ui/           # Reusable UI components
├── pages/            # Page components
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
├── styles/           # Global styles and Tailwind
└── lib/              # Core libraries and configurations

netlify/
└── functions/        # Serverless functions
    ├── auth/         # Authentication endpoints
    ├── events/       # Event management
    ├── strava/       # Strava integration
    └── webhooks/     # Webhook handlers
```

## 🗄 Database Schema

The application uses PostgreSQL with the following core tables:
- `users` - User accounts and profiles
- `events` - Running events
- `registrations` - Event registrations
- `comments` - Community comments
- `tags` - Event categorization
- `media` - Photos and videos

See `src/lib/schema.sql` for the complete database schema.

## 🎨 Design System

The application uses a custom design system built on TailwindCSS v4:

### Color Palette
- **Primary**: Blue tones for primary actions
- **Secondary**: Gray tones for secondary elements
- **Accent**: Orange and green for highlights
- **Semantic**: Success, warning, and error states

### Components
- Card-based layouts inspired by daily.dev
- Consistent spacing and typography
- Mobile-first responsive design
- Accessible color contrasts and interactions

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📋 Development Status

✅ **Phase 1: Foundation & Setup (Completed)**
- Project dependencies and structure
- TailwindCSS configuration
- Environment setup
- Database schema
- TypeScript types
- Basic routing

🔄 **Phase 2: Authentication System (Next)**
- JWT authentication
- User registration/login
- Protected routes
- User profiles

📅 **Upcoming Phases**
- Event management core
- Daily.dev-style UI
- Community features
- Strava integration
- Production deployment

## 🤝 Contributing

Please refer to `CLAUDE.md` for detailed implementation guidelines and the complete development roadmap.

## 📄 License

This project is licensed under the MIT License.
```
