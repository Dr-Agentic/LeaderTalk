# LeaderTalk - Communication Coaching App

## Overview
LeaderTalk is a comprehensive communication coaching platform that leverages AI to transform leadership and speaking skills through intelligent, personalized learning experiences. The application provides real-time speech analysis, AI-powered feedback, and structured training modules to help users improve their communication effectiveness.

## System Architecture

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based authentication with Firebase integration
- **AI Processing**: OpenAI API for speech transcription and analysis
- **Payment Processing**: Stripe integration for subscriptions
- **Session Management**: Express-session with PostgreSQL store for production

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: Shadcn UI with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS architecture
- **State Management**: React Query for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Data Visualization**: Recharts for analytics dashboards

### CSS Architecture
The application uses a 5-layer CSS hierarchy:
1. **tokens.css** - Design tokens (colors, spacing, shadows)
2. **base.css** - HTML element defaults and typography
3. **themes.css** - Visual effects (glass morphism, gradients, component styling)
4. **layout.css** - Layout utilities and semantic classes
5. **index.css** - Main imports and Tailwind layers integration

## Key Components

### Speech Analysis Engine
- Real-time audio recording and transcription
- AI-powered communication pattern analysis
- Timeline visualization of positive, negative, and passive moments
- Word usage tracking with billing cycle management

### Leadership Coaching System
- Curated leader database with leadership styles and traits
- AI-generated alternative phrasings based on selected leaders
- Leadership style emulation suggestions
- Communication improvement recommendations

### Training Module System
- Progressive learning paths with chapters and modules
- Scenario-based exercises with AI evaluation
- Performance tracking and historical analytics
- Multiple leadership style approaches (empathetic, inspirational, commanding)

### Subscription Management
- Stripe-based payment processing
- Word usage limits and billing cycle tracking
- Multiple subscription tiers (free, premium)
- Automated billing and proration handling

## Data Flow

### User Authentication Flow
1. Firebase OAuth (Google) authentication
2. Session creation with secure cookie management
3. User profile creation/retrieval in PostgreSQL
4. Stripe customer initialization for payment processing

### Recording Analysis Flow
1. Audio capture through browser MediaRecorder API
2. File upload to server with multer middleware
3. OpenAI Whisper API transcription
4. GPT-4 analysis for communication patterns
5. Database storage with word count tracking
6. Real-time feedback generation and timeline creation

### Training Flow
1. User selects training scenario from structured curriculum
2. Text or voice response submission
3. AI evaluation using OpenAI GPT-4
4. Scoring across multiple dimensions (clarity, empathy, persuasiveness)
5. Progress tracking and historical analytics

## External Dependencies

### AI Services
- **OpenAI API**: Speech transcription (Whisper) and analysis (GPT-4)
- Requires `OPENAI_API_KEY` environment variable

### Authentication
- **Firebase Authentication**: OAuth provider integration
- Requires Firebase project configuration variables

### Payment Processing
- **Stripe**: Subscription management and payment processing
- Webhook integration for real-time subscription updates
- Requires Stripe API keys and webhook secrets

### Database
- **PostgreSQL**: Primary data storage via Neon serverless
- Drizzle ORM for type-safe database operations
- Automated migrations and schema management

## Deployment Strategy

### Development Environment
- Vite development server with HMR
- In-memory session store for development
- SQLite fallback for local development

### Production Environment (Replit)
- Node.js Express server
- PostgreSQL session store for persistence
- Secure cookie configuration with domain settings
- Environment-specific configuration management

### Database Schema
Key tables include:
- `users` - User profiles, subscription data, billing information
- `leaders` - Leadership figures with traits and communication styles
- `recordings` - Audio analysis results and transcriptions
- `leader_alternatives` - AI-generated leadership-style alternatives
- `user_word_usage` - Word usage tracking for billing
- `chapters/modules/situations` - Training curriculum structure

## Changelog
- June 30, 2025. Implemented RevenueCat migration foundation for Expo client
- June 27, 2025. Initial setup

## User Preferences
Preferred communication style: Simple, everyday language.