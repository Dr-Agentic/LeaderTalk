# LeaderTalk Mobile App

This is the mobile client for LeaderTalk, a comprehensive communication coaching platform that leverages advanced AI to transform leadership and speaking skills through intelligent, personalized learning experiences.

## Features

- Speech analysis and coaching
- Leadership style emulation
- Training modules with practice scenarios
- Transcription library
- User progress tracking

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Expo CLI

### Installation

1. Install dependencies:
```bash
cd expoClient
npm install
```

2. Create a `.env` file in the root directory with these variables:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=your_api_url
```

3. Start the development server:
```bash
npm start
```

4. Use the Expo Go app on your mobile device to scan the QR code, or run on a simulator:
```bash
npm run ios
# or
npm run android
```

## Project Structure

- `app/` - Contains all the screens and navigation using Expo Router
  - `(tabs)/` - Tab-based navigation screens
  - `index.tsx` - Entry point that handles authentication routing
  - `login.tsx` - Login screen
  - `onboarding.tsx` - User onboarding flow
- `src/` - Source code
  - `components/` - Reusable UI components
  - `hooks/` - Custom React hooks
  - `lib/` - Utility functions and API client
- `assets/` - Images, fonts, and other static assets
- `constants/` - App-wide constants and theme settings

## Learn More

For more information about the LeaderTalk platform, see the main [README.md](../README.md).
