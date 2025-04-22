import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from "firebase/auth";

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
    
    console.log("Starting Google sign-in with redirect...");
    console.log("Auth state before redirect:", auth.currentUser ? "User is signed in" : "No user");
    console.log("Attempting redirect to Google authentication...");
    
    // Configure provider to return to this exact URL to prevent redirect issues
    provider.setCustomParameters({
      prompt: 'select_account',
      // For debugging, try to set the exact redirect URL
      redirect_uri: window.location.origin
    });
    
    await signInWithRedirect(auth, provider);
    console.log("Redirect initiated - if you see this, the browser didn't redirect");
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
