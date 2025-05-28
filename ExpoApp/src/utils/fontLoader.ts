import * as Font from 'expo-font';

export async function loadFonts() {
  try {
    await Font.loadAsync({
      // Note: We're using system fonts as fallbacks since we have placeholder font files
      // In a production app, you would replace these with actual font files
      
      // Libre Franklin
      'Libre Franklin': 'System',
      'Libre Franklin-Medium': 'System',
      'Libre Franklin-SemiBold': 'System',
      'Libre Franklin-Bold': 'System',
      'Libre Franklin-ExtraBold': 'System',
      
      // Source Sans Pro (as Ancizar Sans fallback)
      'Source Sans Pro': 'System',
      'Source Sans Pro-SemiBold': 'System',
      'Source Sans Pro-Bold': 'System',
      
      // Inter
      'Inter': 'System',
      'Inter-Medium': 'System',
      'Inter-SemiBold': 'System',
      'Inter-Bold': 'System',
      
      // Playfair Display
      'Playfair Display': 'System',
      'Playfair Display-SemiBold': 'System',
      'Playfair Display-Bold': 'System',
    });
    
    console.log('Fonts loaded successfully');
    return true;
  } catch (error) {
    console.error('Error loading fonts:', error);
    return false;
  }
}
