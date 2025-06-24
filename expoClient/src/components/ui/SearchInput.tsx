import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TextInput } from './TextInput';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: any;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search...',
  style,
}: SearchInputProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Feather name="search" size={16} color="rgba(255, 255, 255, 0.5)" />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={styles.input}
        inputStyle={styles.inputText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  iconContainer: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -8 }],
    zIndex: 1,
  },
  input: {
    flex: 1,
  },
  inputText: {
    paddingLeft: 40,
  },
});
