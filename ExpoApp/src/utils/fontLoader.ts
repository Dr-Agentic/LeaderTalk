import * as Font from 'expo-font';

export async function loadFonts() {
  try {
    // Use system fonts instead of trying to load custom fonts
    console.log('Using system fonts as fallbacks');
    
    // No actual font loading, just return success
    return true;
  } catch (error) {
    console.error('Error in font loading setup:', error);
    return false;
  }
}
