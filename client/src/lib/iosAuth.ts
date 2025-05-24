/**
 * iOS-specific authentication helpers that work around Safari limitations
 */

// Custom authentication state management for iOS
export interface IOSAuthState {
  isAuthenticating: boolean;
  attemptTimestamp: number;
  redirectUrl: string;
}

export function setIOSAuthState(state: IOSAuthState) {
  localStorage.setItem('ios_auth_state', JSON.stringify(state));
}

export function getIOSAuthState(): IOSAuthState | null {
  try {
    const stored = localStorage.getItem('ios_auth_state');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function clearIOSAuthState() {
  localStorage.removeItem('ios_auth_state');
}

// Check if we're returning from an authentication attempt
export function isReturningFromAuth(): boolean {
  const state = getIOSAuthState();
  if (!state) return false;
  
  // Check if we're within a reasonable time window (5 minutes)
  const timeSinceAttempt = Date.now() - state.attemptTimestamp;
  return timeSinceAttempt < 5 * 60 * 1000; // 5 minutes
}

// Create a custom Google OAuth URL for iOS
export function createGoogleAuthURL(redirectUri: string): string {
  const clientId = import.meta.env.VITE_FIREBASE_API_KEY;
  const baseUrl = 'https://accounts.google.com/oauth/authorize';
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account'
  });
  
  return `${baseUrl}?${params.toString()}`;
}

// Check if current URL contains OAuth response
export function extractOAuthCode(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('code');
}

// iOS-specific device detection
export function isIOSDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isIOSSafari(): boolean {
  const userAgent = navigator.userAgent;
  return isIOSDevice() && /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent);
}