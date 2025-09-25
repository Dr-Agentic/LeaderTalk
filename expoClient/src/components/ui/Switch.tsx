import React from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../hooks/useTheme';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
  label?: string;
}

export function Switch({ value, onValueChange, disabled = false, style, label }: SwitchProps) {
  const theme = useTheme();
  const translateX = useSharedValue(value ? 20 : 0);
  const backgroundColor = useSharedValue(value ? 1 : 0);

  React.useEffect(() => {
    translateX.value = withSpring(value ? 20 : 0, { damping: 15 });
    backgroundColor.value = withSpring(value ? 1 : 0, { damping: 15 });
  }, [value]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      backgroundColor.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.2)', theme.colors.primary]
    ),
  }));

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <Animated.View
          style={[
            {
              width: 48,
              height: 28,
              borderRadius: 14,
              padding: 2,
              justifyContent: 'center',
            },
            trackStyle,
          ]}
        >
          <Animated.View
            style={[
              {
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: 'white',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
              },
              thumbStyle,
            ]}
          />
        </Animated.View>
      </TouchableOpacity>
      
      {label && (
        <ThemedText
          style={{
            marginLeft: 12,
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          {label}
        </ThemedText>
      )}
    </View>
  );
}
