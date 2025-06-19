module.exports = {
  expo: {
    name: "LeaderTalk",
    slug: "leadertalk",
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
      bundleIdentifier: "com.leadertalk.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0f0f23"
      },
      package: "com.leadertalk.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router"
    ],
    scheme: "leadertalk",
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "https://app.leadertalk.app",
      eas: {
        projectId: "your-project-id"
      }
    }
  }
};
