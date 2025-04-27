# LeaderTalk - Communication Coaching App

LeaderTalk is a comprehensive communication coaching platform that leverages advanced AI to transform leadership and speaking skills through intelligent, personalized learning experiences.

## Features

### Speech Analysis & Coaching
- **Real-time Speech Analysis**: Record your conversations (up to 50 minutes) and receive AI-powered analysis of your communication patterns
- **Timeline Visualization**: View color-coded timeline of positive, negative, and passive communication moments
- **Instant Feedback**: Get specific feedback on communication strengths and weaknesses with timestamps
- **Voice Fingerprinting**: System recognizes your voice in future conversations (coming soon)

### Leadership Insights
- **Leadership Style Emulation**: Get personalized improvement suggestions based on communication styles of selected leaders
- **Leader Selection**: Choose from a variety of inspirational leaders during onboarding (min 1, max 3)
- **Leader Alternatives**: For negative communication moments, see how your selected leaders would phrase the same message
- **Non-controversial Option**: Filter out controversial leaders from selection process

### Training Modules
- **Structured Learning**: Progressive training modules with chapters, modules, and situation exercises
- **Practice Scenarios**: Text or voice input for completing situation exercises
- **Style Adherence**: Feedback based on leadership style adherence and communication tone
- **Progress Tracking**: Monitor completion at chapter, module, and situation levels
- **Historical Data**: Access to all previous attempts with evaluation metrics

### Organization & User Management
- **Transcription Library**: View and search all transcripts with sorting options (most recent, most positive, needs most improvement)
- **Color-coded Text**: Transcripts display text highlighting positive, negative, and neutral communication
- **Anniversary-based Billing**: Word usage tracked and reset on monthly anniversary of user registration
- **Usage Monitoring**: Track word usage with billing cycle information and days remaining
- **Account Management**: Complete account deletion with comprehensive data removal across all tables

## Technology Stack

### Frontend
- React with TypeScript
- Wouter for routing
- Shadcn UI components
- Tailwind CSS for styling
- React Query for data fetching
- React Hook Form with Zod validation
- Recharts for data visualization

### Backend
- Express.js with TypeScript
- PostgreSQL database with Drizzle ORM
- RESTful API architecture
- Session-based authentication
- Structured error handling

### AI & Integration
- OpenAI GPT-4o for analysis and training feedback
- OpenAI Whisper for speech transcription
- Firebase Authentication for Google sign-in
- Leader-specific alternative generation using LLM

## Getting Started

### Prerequisites
- Node.js (v18+)
- NPM or Yarn
- PostgreSQL database
- Firebase account
- OpenAI API key

### Environment Variables
Create a `.env` file in the root directory with these variables:
```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/leadertalk
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=yourpassword
PGDATABASE=leadertalk

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/leader-talk.git
cd leader-talk
```

2. Install dependencies:
```bash
npm install
```

3. Initialize the database:
```bash
npm run db:push
```

4. Start the development server:
```bash
npm run dev
```

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Google Authentication
3. Add your app's domain to the Authorized Domains list in Firebase Authentication settings
4. Configure your Firebase app credentials in the environment variables

## Core Components

### User Onboarding Flow
- Google Authentication
- Optional demo login for testing
- Basic user information collection
- Leader selection (1-3 leaders)

### Recording and Analysis
- Web-based audio recording
- Real-time transcription
- Sentiment and tone analysis
- Leadership style comparison
- Word usage tracking for billing

### Word Usage & Billing System
- Anniversary-based billing cycles
- Reset on monthly registration date
- Per-cycle word count limits
- Historical usage tracking
- Days remaining in current cycle

### Training Module
- Hierarchical structure (chapters → modules → situations)
- Contextual learning path
- Text or voice input for exercises
- Immediate feedback on submissions
- Progress tracking across all levels

## Database Schema

The application uses a PostgreSQL database with the following key tables:

- `users`: User profiles and authentication data
- `leaders`: Leadership style examples and characteristics
- `recordings`: User conversation recordings and analysis results
- `chapters`, `modules`, `situations`: Training content structure
- `user_progress`, `situation_attempts`: User training progress tracking
- `leader_alternatives`: Cached leadership style alternatives with user tracking
- `user_word_usage`: Anniversary-based billing cycle tracking

## API Endpoints

### Authentication
- `POST /api/auth/demo-login`: Quick demo login
- `POST /api/users`: Create new user account
- `GET /api/users/me`: Get current user profile
- `PATCH /api/users/me`: Update user profile
- `DELETE /api/users/me`: Delete user account with all associated data

### Recording
- `POST /api/recordings`: Create new recording
- `GET /api/recordings`: List user recordings
- `GET /api/recordings/:id`: Get specific recording
- `POST /api/recordings/:id/analyze`: Process and analyze recording

### Training
- `GET /api/training/chapters`: Get all training chapters
- `GET /api/training/chapters/:id`: Get specific chapter
- `GET /api/training/modules/:id`: Get specific module
- `GET /api/training/situations/:id`: Get specific situation
- `POST /api/training/attempt`: Submit situation attempt
- `GET /api/training/progress`: Get user progress

### Leaders
- `GET /api/leaders`: Get all leaders (with controversial flag)
- `GET /api/leaders/:id`: Get specific leader
- `GET /api/leaders/:id/alternatives`: Get leader-specific alternatives

### Usage
- `GET /api/usage/words`: Get word usage with billing cycle information

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Shadcn UI for the component library
- OpenAI for speech analysis capabilities
- The various leaders whose communication styles are analyzed in this application
- Drizzle ORM for database management
- Recharts for data visualization

## For Developers

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying this application to AWS.