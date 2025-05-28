import * as Font from 'expo-font';

export async function loadFonts() {
  await Font.loadAsync({
    // Libre Franklin
    'Libre Franklin': require('../../assets/fonts/LibreFranklin-Regular.ttf'),
    'Libre Franklin-Medium': require('../../assets/fonts/LibreFranklin-Medium.ttf'),
    'Libre Franklin-SemiBold': require('../../assets/fonts/LibreFranklin-SemiBold.ttf'),
    'Libre Franklin-Bold': require('../../assets/fonts/LibreFranklin-Bold.ttf'),
    'Libre Franklin-ExtraBold': require('../../assets/fonts/LibreFranklin-ExtraBold.ttf'),
    
    // Source Sans Pro (as Ancizar Sans fallback)
    'Source Sans Pro': require('../../assets/fonts/SourceSansPro-Regular.ttf'),
    'Source Sans Pro-SemiBold': require('../../assets/fonts/SourceSansPro-SemiBold.ttf'),
    'Source Sans Pro-Bold': require('../../assets/fonts/SourceSansPro-Bold.ttf'),
    
    // Inter
    'Inter': require('../../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter-Bold.ttf'),
    
    // Playfair Display
    'Playfair Display': require('../../assets/fonts/PlayfairDisplay-Regular.ttf'),
    'Playfair Display-SemiBold': require('../../assets/fonts/PlayfairDisplay-SemiBold.ttf'),
    'Playfair Display-Bold': require('../../assets/fonts/PlayfairDisplay-Bold.ttf'),
  });
}
