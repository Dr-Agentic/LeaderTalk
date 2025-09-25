import React from 'react';
import { Text, View, StyleSheet, TextStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';

interface GradientTextProps {
  text: string;
  style?: TextStyle;
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export const GradientText = ({
  text,
  style,
  colors = ['#8A2BE2', '#FF6B6B', '#4ECDC4'],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}: GradientTextProps) => {
  const theme = useTheme();
  return (
    <MaskedView
      maskElement={
        <Text style={[styles.text, style]}>
          {text}
        </Text>
      }
    >
      <LinearGradient
        colors={colors}
        start={start}
        end={end}
        style={styles.gradient}
      >
        <Text style={[styles.text, style, styles.transparent]}>
          {text}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: theme.fontSizes.body,
    fontWeight: '600',
  },
  gradient: {
    flex: 1,
  },
  transparent: {
    opacity: 0,
  },
});
