# LeaderTalk Mobile App

This is the Expo-based mobile application for LeaderTalk, a comprehensive communication coaching platform that leverages advanced AI to transform leadership and speaking skills.

## Features

- **Speech Recording & Analysis**: Record conversations and receive AI-powered analysis
- **Timeline Visualization**: View color-coded timeline of communication moments
- **Leadership Insights**: Get personalized improvement suggestions based on selected leaders
- **Training Modules**: Access structured learning with practice scenarios
- **Progress Tracking**: Monitor your improvement over time

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or Yarn
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Environment Setup

Create a `.env` file in the root directory with these variables:

```
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Google Auth
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=your_expo_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on iOS:
```bash
npm run ios
```

4. Run on Android:
```bash
npm run android
```

## Project Structure

```
ExpoApp/
├── assets/              # Images, fonts, and other static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and API clients
│   ├── navigation/      # Navigation configuration
│   ├── screens/         # Screen components
│   └── types/           # TypeScript type definitions
├── App.tsx              # Main application component
└── app.json            # Expo configuration
```

## Key Technologies

- **Expo**: React Native framework for cross-platform development
- **React Navigation**: Navigation library for React Native
- **React Native Paper**: Material Design components
- **Expo AV**: Audio recording and playback
- **Firebase Auth**: Authentication with Google Sign-In
- **React Query**: Data fetching and state management

## Development Notes

- The app connects to the same backend API as the web client
- Audio recording uses the Expo AV API instead of the web MediaRecorder
- Firebase authentication is implemented using Expo AuthSession
- Navigation uses React Navigation instead of Wouter

## Related Projects

- [LeaderTalk Web Client](../Client): The web version of LeaderTalk
- [LeaderTalk Server](../server): The backend API server
