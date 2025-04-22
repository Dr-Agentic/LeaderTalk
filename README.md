# LeaderTalk - Communication Coaching App

A communication coaching application that records and analyzes speech patterns to provide leadership-style improvement suggestions.

## Features

- **Speech Analysis**: Record your conversations and receive AI-powered analysis of your communication patterns
- **Leadership Insights**: Get personalized improvement suggestions based on communication styles of selected leaders
- **Communication Visualization**: View timeline of positive and negative communication instances
- **Leadership Selection**: Choose from a variety of inspirational leaders whose communication styles you'd like to emulate

## Technology Stack

### Frontend
- React with TypeScript
- Wouter for routing
- Shadcn UI components
- Tailwind CSS for styling
- React Query for data fetching
- React Hook Form with Zod validation

### Backend
- Express.js with TypeScript
- RESTful API endpoints
- In-memory storage

### AI & Integration
- OpenAI API for speech transcription and analysis
- Firebase Authentication for Google sign-in

## Getting Started

### Prerequisites
- Node.js (v16+)
- NPM
- Firebase account
- OpenAI API key

### Environment Variables
Create a `.env` file in the root directory with these variables:
```
OPENAI_API_KEY=your_openai_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
```

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/leader-talk.git
cd leader-talk
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm run dev
```

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Google Authentication
3. Add your app's domain to the Authorized Domains list in Firebase Authentication settings

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Shadcn UI for the component library
- OpenAI for speech analysis capabilities
- The various leaders whose communication styles are analyzed in this application