import React from 'react';
import {
  Modal as RNModal,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  closeOnBackdrop?: boolean;
}

export function Modal({
  visible,
  onClose,
  title,
  description,
  children,
  style,
  closeOnBackdrop = true,
}: ModalProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 15 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View
          style={[
            {
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
            animatedBackdropStyle,
          ]}
        >
          <BlurView
            intensity={20}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                {
                  backgroundColor: 'rgba(30, 30, 30, 0.95)',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(138, 43, 226, 0.3)',
                  padding: 24,
                  margin: 20,
                  maxWidth: screenWidth - 40,
                  maxHeight: screenHeight - 100,
                  shadowColor: '#8A2BE2',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                  elevation: 20,
                },
                style,
                animatedModalStyle,
              ]}
            >
              {/* Header */}
              {(title || description) && (
                <View style={{ marginBottom: 20 }}>
                  {title && (
                    <ThemedText
                      style={{
                        fontSize: 20,
                        fontWeight: '700',
                        color: 'white',
                        marginBottom: description ? 8 : 0,
                        textAlign: 'center',
                      }}
                    >
                      {title}
                    </ThemedText>
                  )}
                  {description && (
                    <ThemedText
                      style={{
                        fontSize: 14,
                        color: 'rgba(255, 255, 255, 0.7)',
                        textAlign: 'center',
                        lineHeight: 20,
                      }}
                    >
                      {description}
                    </ThemedText>
                  )}
                </View>
              )}

              {/* Content */}
              {children}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}
