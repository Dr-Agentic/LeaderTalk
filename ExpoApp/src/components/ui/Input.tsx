import React from 'react';
import { TextInput, StyleSheet, TextInputProps, View, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = ({ 
  style, 
  label, 
  error, 
  ...props 
}: InputProps) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput 
        style={[
          styles.input, 
          error && styles.inputError,
          style
        ]} 
        placeholderTextColor={colors.mutedForeground}
        {...props} 
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: fonts.medium,
    color: colors.foreground,
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: colors.destructive,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.destructive,
    marginTop: 4,
  },
});
