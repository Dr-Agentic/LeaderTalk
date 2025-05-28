import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors } from '../../theme/colors';

export const Card = ({ children, style, ...props }: ViewProps) => (
  <View style={[styles.card, style]} {...props}>
    {children}
  </View>
);

export const CardHeader = ({ children, style, ...props }: ViewProps) => (
  <View style={[styles.cardHeader, style]} {...props}>
    {children}
  </View>
);

export const CardTitle = ({ children, style, ...props }: ViewProps) => (
  <View style={[styles.cardTitle, style]} {...props}>
    {children}
  </View>
);

export const CardDescription = ({ children, style, ...props }: ViewProps) => (
  <View style={[styles.cardDescription, style]} {...props}>
    {children}
  </View>
);

export const CardContent = ({ children, style, ...props }: ViewProps) => (
  <View style={[styles.cardContent, style]} {...props}>
    {children}
  </View>
);

export const CardFooter = ({ children, style, ...props }: ViewProps) => (
  <View style={[styles.cardFooter, style]} {...props}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    padding: 16,
  },
  cardTitle: {
    marginBottom: 6,
  },
  cardDescription: {
    marginTop: 6,
  },
  cardContent: {
    padding: 16,
    paddingTop: 0,
  },
  cardFooter: {
    padding: 16,
    paddingTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
