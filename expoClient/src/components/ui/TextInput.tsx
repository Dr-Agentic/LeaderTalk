import React from 'react';
import { TextInput as RNTextInput, View, ViewStyle, TextStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { ThemedText } from '../ThemedText';

interface TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
}

export function TextInput({
  value,
  onChangeText,
  placeholder,
  label,
  style,
  inputStyle,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
}: TextInputProps) {
  return (
    <View style={style}>
      {label && (
        <ThemedText
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: 8,
          }}
        >
          {label}
        </ThemedText>
      )}
      
      <View
        style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: 'rgba(138, 43, 226, 0.3)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
        }}
      >
        <BlurView
          intensity={10}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          style={[
            {
              padding: 16,
              fontSize: 16,
              color: 'white',
              minHeight: multiline ? numberOfLines * 24 + 32 : 52,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            inputStyle,
          ]}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
        />
      </View>
    </View>
  );
}
