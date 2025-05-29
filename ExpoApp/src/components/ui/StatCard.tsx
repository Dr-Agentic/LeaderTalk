import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

interface StatCardProps {
  number: string;
  label: string;
}

export const StatCard = ({ number, label }: StatCardProps) => {
  return (
    <LinearGradient
      colors={[colors.primaryLight, 'rgba(255, 107, 107, 0.1)']}
      style={styles.statCard}
    >
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default StatCard;
