module.exports = {
  expo: {
    name: "LeaderTalk",
    slug: "leadertalk-try1",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0f0f23"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.leadertalk.app",
      infoPlist: {
        "NSMicrophoneUsageDescription": "LeaderTalk uses your microphone to record and analyze your communication patterns, providing personalized leadership insights and coaching feedback. Your recordings are processed privately and securely."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0f0f23"
      },
      package: "com.leadertalk.app",
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.CAMERA"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-av"
    ],
    scheme: "leadertalk",
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "https://app.leadertalk.app",
      eas: {
        projectId: "42550eb6-1161-408a-9809-fe0280a16a9d",
        owner: "mchei"
      }
    }
  }
};
