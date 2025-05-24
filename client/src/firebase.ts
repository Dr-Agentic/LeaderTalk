import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from "firebase/auth";
import { logInfo, logError, logDebug, logWarn } from "@/lib/debugLogger";

// IMPORTANT: Using hybrid authentication - popup for desktop, redirect for iOS/Safari
// This provides the best compatibility across all devices and browsers

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
    
    console.log("Starting Google sign-in with popup...");
    logInfo("Starting Google sign-in with popup");
    console.log("Auth state before popup:", auth.currentUser ? "User is signed in" : "No user");
    
    // Configure provider for better popup experience
    provider.setCustomParameters({
      prompt: 'select_account',
      display: 'popup'
    });
    
    // Check if we're on iOS or Safari browser
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
    
    // Test for popup support
    const testPopup = window.open('', '_blank', 'width=1,height=1');
    const popupBlocked = !testPopup || testPopup.closed;
    
    if (testPopup && !testPopup.closed) {
      testPopup.close();
    }
    
    // Use different strategies based on device capabilities
    let result;
    if (popupBlocked || isIOS || isSafari) {
      logWarn("Popup authentication not available, using redirect fallback", {
        isIOS,
        isSafari,
        popupBlocked,
        userAgent: navigator.userAgent
      });
      
      // Store authentication attempt in localStorage for iOS tracking
      localStorage.setItem('authAttempt', JSON.stringify({
        timestamp: Date.now(),
        isIOS,
        isSafari,
        currentUrl: window.location.href
      }));
      
      // For iOS and Safari, use redirect instead of popup
      await signInWithRedirect(auth, provider);
      // Note: This will redirect the page, so code below won't execute
      return null;
    } else {
      // Use popup authentication for desktop browsers
      logDebug("Opening Google auth popup");
      result = await signInWithPopup(auth, provider);
    }
    console.log("Popup authentication completed");
    logInfo("Google popup authentication completed");
    
    // Return the user information
    const user = result.user;
    const userInfo = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      hasPhotoUrl: !!user.photoURL
    };
    
    console.log("User authenticated:", userInfo);
    logInfo("Firebase user authenticated", userInfo);
    
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
  } catch (error: any) {
    console.error("Error signing in with Google", error);
    console.error("Error details:", {
      code: error?.code,
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    
    // Handle specific popup-related errors with better user messaging
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user') {
      logWarn("Google sign-in popup was blocked or closed by user", {
        code: error?.code,
        userAgent: navigator.userAgent
      });
      throw new Error('popup-cancelled');
    } else if (error?.message === 'popup-blocked') {
      logWarn("Popup blocker detected");
      throw new Error('popup-blocked');
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
    console.log("Current URL:", window.location.href);
    console.log("URL params:", new URLSearchParams(window.location.search).toString());
    
    logDebug("Checking for Google auth redirect result", {
      url: window.location.href,
      search: window.location.search,
      hash: window.location.hash
    });
    
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log("Redirect result found");
      logInfo("Google redirect result found - user authenticated");
      
      // Clear the auth attempt tracking since we found a successful result
      localStorage.removeItem('authAttempt');
      
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
