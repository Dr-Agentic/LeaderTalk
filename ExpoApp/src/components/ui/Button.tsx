import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, TouchableOpacityProps } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = ({ 
  children, 
  variant = 'default', 
  size = 'default',
  disabled = false,
  loading = false,
  icon,
  style,
  ...props 
}: ButtonProps) => {
  const buttonStyles = [
    styles.button,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    disabled && styles.disabled,
    style,
  ];
  
  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
  ];
  
  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' ? colors.primary : colors.primaryForeground} 
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={textStyles}>{children}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    transition: 'all 300ms',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontFamily: fonts.sans,
    fontWeight: fonts.medium,
    fontSize: 14,
  },
  // Variants
  variant_default: {
    backgroundColor: colors.primary,
  },
  variant_destructive: {
    backgroundColor: colors.destructive,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  variant_secondary: {
    backgroundColor: colors.secondary,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  variant_link: {
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  // Text colors
  text_default: {
    color: colors.primaryForeground,
  },
  text_destructive: {
    color: colors.destructiveForeground,
  },
  text_outline: {
    color: colors.foreground,
  },
  text_secondary: {
    color: colors.secondaryForeground,
  },
  text_ghost: {
    color: colors.foreground,
  },
  text_link: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  // Sizes
  size_default: {
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  size_sm: {
    height: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  size_lg: {
    height: 44,
    paddingHorizontal: 32,
    paddingVertical: 10,
  },
  size_icon: {
    height: 40,
    width: 40,
    padding: 0,
  },
  // States
  disabled: {
    opacity: 0.5,
  },
});
