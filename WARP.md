# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

LeaderTalk is a comprehensive communication coaching platform that leverages AI to transform leadership and speaking skills. It features real-time speech analysis, training modules, and personalized feedback based on leadership styles.

## Development Commands

### Core Development
```bash
# Start development server (runs both frontend and backend)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run check
```

### Database Operations
```bash
# Push database schema changes
npm run db:push

# Database configuration is in drizzle.config.ts
# Schema definitions are in shared/schema.ts
```

## Architecture Overview

### Monorepo Structure
- **`server/`** - Express.js backend with TypeScript
- **`client/`** - React frontend with TypeScript  
- **`shared/`** - Shared schema and types between frontend/backend
- **`expoClient/`** - React Native mobile app (separate from main web app)

### Technology Stack

**Backend:**
- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- Session-based authentication via express-session
- OpenAI GPT-4o for analysis and Whisper for transcription
- Supabase for Google Authentication
- Stripe and RevenueCat for payments

**Frontend:**
- React 18 with TypeScript
- Wouter for routing (not React Router)
- Shadcn UI components with Tailwind CSS
- React Query (@tanstack/react-query) for data fetching
- React Hook Form with Zod validation
- Recharts for data visualization

**Database:**
- PostgreSQL with Drizzle ORM
- Schema defined in `shared/schema.ts`
- Key tables: users, leaders, recordings, chapters/modules/situations, user_progress

## Key Architectural Patterns

### Authentication Flow
- Dual authentication system: Google OAuth (via Supabase) + session-based auth
- Session management via express-session with PostgreSQL storage
- Authentication state managed in `client/src/App.tsx`
- Session validation endpoint: `/api/users/me`
- Environment-specific configuration in `server/config/environment.ts`

### Data Layer
- Shared schema between frontend/backend via `@shared/schema` alias
- Drizzle ORM with TypeScript for type-safe database operations
- Storage layer abstraction in `server/storage.ts`
- RESTful API structure in `server/routes/`

### Component Architecture
- Shadcn UI component library with consistent theming
- Path aliases configured in `vite.config.ts`:
  - `@` → `client/src`
  - `@shared` → `shared`
  - `@assets` → `attached_assets`

### File Processing Pipeline
- Audio recording → OpenAI Whisper transcription → GPT-4o analysis
- Timeline visualization with sentiment analysis
- Word usage tracking for billing cycles
- Leader-specific alternative response generation

## Database Schema Highlights

Key tables and their relationships:
- **users** - Core user data with billing cycle tracking
- **recordings** - Audio transcripts and analysis results  
- **leaders** - Leadership styles and characteristics
- **chapters/modules/situations** - Hierarchical training content
- **user_progress/situation_attempts** - Training completion tracking
- **leader_alternatives** - Cached alternative responses
- **user_word_usage** - Anniversary-based billing cycle management

## Environment Configuration

Required environment variables (see README.md for complete list):
```bash
# Database
DATABASE_URL=postgresql://...
# OpenAI
OPENAI_API_KEY=your_key
# Supabase (for Google Auth)
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
# Session
SESSION_SECRET=your_secret
```

The `server/config/environment.ts` module handles environment-specific configuration with PROD_ prefix support for production deployments.

## Development Workflow

### Running Tests
No formal test framework is configured. Testing files exist in `server/test-*.ts` for specific functionality verification.

### Code Organization
- Business logic in `server/routes/` organized by feature
- Controllers in `server/controllers/` for complex operations
- Services in `server/services/` for external integrations
- React components follow feature-based organization in `client/src/`

### Key Files to Understand
- `server/index.ts` - Main application entry point
- `server/routes.ts` - Route registration and middleware setup
- `client/src/App.tsx` - React app routing and authentication logic
- `shared/schema.ts` - Database schema and TypeScript types
- `server/config/environment.ts` - Environment variable management

## Mobile App Context

The `expoClient/` directory contains a separate React Native mobile app that shares some backend APIs but has its own authentication flow using RevenueCat for subscriptions.

## Deployment

See `DEPLOYMENT.md` for AWS deployment instructions using Elastic Beanstalk, RDS, and S3.

## Important Considerations

- The app uses anniversary-based billing cycles (tracked per user registration date)
- Word usage is carefully tracked for billing purposes across all text analysis features  
- Authentication requires careful session and cookie management across domains
- OpenAI API costs are managed through word count limits per billing cycle
- Leadership style analysis is core to the app's value proposition