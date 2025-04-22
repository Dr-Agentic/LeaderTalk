import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, getRedirectResult } from "firebase/auth";

// IMPORTANT: Switch from redirect to popup authentication to avoid CORS issues
// This should resolve the "accounts.google.com refused to connect" error

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
    console.log("Firebase config:", {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "Present (hidden)" : "Missing",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID ? "Present (hidden)" : "Missing",
      authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebaseapp.com`,
    });
    
    console.log("Starting Google sign-in with popup...");
    console.log("Auth state before popup:", auth.currentUser ? "User is signed in" : "No user");
    
    // Configure provider to return to this exact URL to prevent redirect issues
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    // Use popup instead of redirect to avoid cross-origin issues
    const result = await signInWithPopup(auth, provider);
    console.log("Popup authentication completed");
    
    // Return the user information
    const user = result.user;
    console.log("User authenticated:", {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });
    
    // Now create or update the user on our server
    try {
      console.log("Sending user data to server...");
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
        const userData = await response.json();
        console.log("Server response:", userData);
        
        // Check if user has completed onboarding
        if (userData.dateOfBirth && userData.profession && userData.goals && userData.selectedLeaders) {
          console.log("User already onboarded, redirecting to dashboard...");
          window.location.href = '/dashboard';
        } else {
          console.log("User needs onboarding, redirecting to /onboarding...");
          window.location.href = '/onboarding';
        }
      } else {
        console.error("Server registration failed:", await response.text());
      }
    } catch (serverError) {
      console.error("Error communicating with server:", serverError);
    }
    
    return user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
}

export async function handleRedirectResult() {
  try {
    console.log("Checking for redirect result...");
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log("Redirect result found");
      // The signed-in user info
      const user = result.user;
      console.log("User authenticated:", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });
      return user;
    }
    console.log("No redirect result found");
    return null;
  } catch (error) {
    console.error("Error handling redirect result", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
}

export async function signOut() {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
}
