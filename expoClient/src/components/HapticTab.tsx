import React from 'react';
import { TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

// This component wraps the tab button with haptic feedback
export function HapticTab(props: any) {
  const { onPress, ...restProps } = props;
  
  const handlePress = () => {
    // Trigger light haptic feedback when tab is pressed
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Call the original onPress handler
    if (onPress) {
      onPress();
    }
  };
  
  return <TouchableOpacity {...restProps} onPress={handlePress} />;
}
