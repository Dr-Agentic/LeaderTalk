import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from "firebase/auth";
import { logInfo, logError, logDebug, logWarn } from "@/lib/debugLogger";

// IMPORTANT: Using redirect authentication for better portability across different environments
// This provides better compatibility than popup-based authentication

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-app-id",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const configInfo = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "Present (hidden)" : "Missing",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID ? "Present (hidden)" : "Missing",
      authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebaseapp.com`,
      currentUrl: window.location.href,
      currentOrigin: window.location.origin,
      deployedEnvironment: import.meta.env.NODE_ENV
    };
    
    console.log("Firebase config:", configInfo);
    logDebug("Firebase authentication attempt", configInfo);
    
    console.log("Starting Google sign-in with redirect...");
    logInfo("Starting Google sign-in with redirect");
    console.log("Auth state before redirect:", auth.currentUser ? "User is signed in" : "No user");
    
    // Configure provider for better redirect experience
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    // Use redirect authentication for better portability
    logDebug("Initiating Google auth redirect");
    
    await signInWithRedirect(auth, provider);
    console.log("Redirect authentication initiated");
    logInfo("Google redirect authentication initiated");
    
    // Note: With redirect authentication, this function will not return a user
    // The page will redirect to Google and then back to our app
    // The actual authentication handling is done in handleRedirectResult()
    return null;
  } catch (error: any) {
    console.error("Error signing in with Google", error);
    console.error("Error details:", {
      code: error?.code,
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    
    // Handle specific redirect-related errors
    if (error?.code === 'auth/cancelled-popup-request' || error?.code === 'auth/popup-closed-by-user') {
      logWarn("Google sign-in was cancelled by user", {
        code: error?.code,
        userAgent: navigator.userAgent
      });
      throw new Error('auth-cancelled');
    }
    
    logError("Google sign-in error", {
      code: error?.code || "unknown",
      message: error?.message || "Unknown Google sign-in error",
      stack: error?.stack || "No stack trace",
      name: error?.name || "Error",
      currentUrl: window.location.href,
      firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project"
    });
    
    throw error;
  }
}

export async function handleRedirectResult() {
  try {
    console.log("Checking for redirect result...");
    logDebug("Checking for Google auth redirect result");
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log("Redirect result found");
      logInfo("Google redirect result found - user authenticated");
      
      // The signed-in user info
      const user = result.user;
      const userInfo = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        hasPhotoUrl: !!user.photoURL
      };
      console.log("User authenticated:", userInfo);
      logInfo("User authenticated via redirect", userInfo);
      
      // Now create or update the user on our server
      try {
        console.log("Sending user data to server...");
        logDebug("Sending user data to server for authentication", {
          endpoint: '/api/users',
          method: 'POST',
          googleId: user.uid ? "Present (hidden)" : "Missing"
        });
        
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            googleId: user.uid,
            email: user.email || `user_${user.uid}@example.com`,
            username: user.displayName || `User ${user.uid.substring(0, 6)}`,
            photoUrl: user.photoURL
          }),
          credentials: 'include'
        });
        
        if (response.ok) {
          console.log("User successfully registered/logged in on server");
          logInfo("User successfully registered/logged in on server");
          
          const userData = await response.json();
          console.log("Server response:", userData);
          
          // Check if user has completed onboarding
          if (userData.dateOfBirth && userData.profession && userData.goals && userData.selectedLeaders) {
            console.log("User already onboarded, redirecting to dashboard...");
            logInfo("User already onboarded, redirecting to dashboard");
            window.location.href = '/dashboard';
          } else {
            console.log("User needs onboarding, redirecting to /onboarding...");
            logInfo("User needs onboarding, redirecting to /onboarding");
            window.location.href = '/onboarding';
          }
        } else {
          const responseText = await response.text();
          console.error("Server registration failed:", responseText);
          logError("Server registration failed", {
            status: response.status,
            responseText,
            url: '/api/users'
          });
        }
      } catch (serverError: any) {
        console.error("Error communicating with server:", serverError);
        logError("Error communicating with server after Google authentication", {
          message: serverError?.message || "Unknown server error",
          stack: serverError?.stack || "No stack trace"
        });
      }
      
      return user;
    }
    console.log("No redirect result found");
    logDebug("No Google redirect result found");
    return null;
  } catch (error: any) {
    console.error("Error handling redirect result", error);
    console.error("Error details:", {
      code: error?.code,
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    
    logError("Error handling Google redirect result", {
      code: error?.code || "unknown",
      message: error?.message || "Unknown redirect error",
      stack: error?.stack || "No stack trace",
      name: error?.name || "Error",
      url: window.location.href
    });
    throw error;
  }
}

export async function signOut() {
  try {
    logInfo("Signing out user");
    await auth.signOut();
    logInfo("User signed out successfully");
  } catch (error: any) {
    console.error("Error signing out", error);
    logError("Error signing out user", {
      message: error?.message || "Unknown sign out error",
      code: error?.code
    });
    throw error;
  }
}
