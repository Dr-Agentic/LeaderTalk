import Constants from 'expo-constants';

// Default API URL from environment variables
const DEFAULT_API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://app.leadertalk.app';

// Get the API URL from environment or use default
export const API_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

/**
 * Fetch auth parameters from the server
 * This allows us to get Supabase and RevenueCat credentials without hardcoding them
 */
export async function fetchAuthParameters() {
  try {
    console.log('Fetching auth parameters from:', `${API_URL}/api/auth/auth-parameters`);
    const response = await fetch(`${API_URL}/api/auth/auth-parameters`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch auth parameters: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Auth parameters received:', {
      url: data.supabaseUrl ? 'present' : 'missing',
      key: data.supabaseAnonKey ? 'present' : 'missing',
      revenueCatIos: data.revenueCat?.iosApiKey ? 'present' : 'missing',
      revenueCatAndroid: data.revenueCat?.androidApiKey ? 'present' : 'missing',
      environment: data.environment,
    });
    
    return {
      supabaseUrl: data.supabaseUrl,
      supabaseAnonKey: data.supabaseAnonKey,
      environment: data.environment,
      revenueCat: {
        iosApiKey: data.revenueCat?.iosApiKey,
        androidApiKey: data.revenueCat?.androidApiKey,
      },
    };
  } catch (error) {
    console.error('Error fetching auth parameters:', error);
    throw error;
  }
}

/**
 * Send Supabase authentication callback to server
 * This creates or updates the user in our database and establishes a session
 */
export async function sendAuthCallback(userData: {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified?: boolean;
}) {
  try {
    console.log('Sending auth callback to server');
    const response = await fetch(`${API_URL}/api/auth/supabase-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include', // Important for cookies
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Auth callback failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('Auth callback successful:', data.success);
    return data;
  } catch (error) {
    console.error('Error in auth callback:', error);
    throw error;
  }
}

/**
 * Logout from the server
 */
export async function logout() {
  try {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'GET',
      credentials: 'include', // Important for cookies
    });
    
    if (!response.ok) {
      throw new Error(`Logout failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
}
