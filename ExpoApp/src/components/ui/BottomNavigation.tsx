import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

interface NavItem {
  icon: string;
  label: string;
  tab: string;
}

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  items?: NavItem[];
}

export const BottomNavigation = ({ 
  activeTab, 
  onTabChange,
  items = [
    { icon: '🏠', label: 'Home', tab: 'home' },
    { icon: '🔍', label: 'Explore', tab: 'explore' },
    { icon: '💬', label: 'Sessions', tab: 'sessions' },
    { icon: '📊', label: 'Progress', tab: 'progress' },
    { icon: '👤', label: 'Profile', tab: 'profile' }
  ]
}: BottomNavigationProps) => {
  return (
    <View style={styles.bottomNav}>
      {items.map((item, idx) => (
        <TouchableOpacity 
          key={idx} 
          style={[styles.navItem, activeTab === item.tab && styles.activeNavItem]}
          onPress={() => onTabChange(item.tab)}
        >
          <View style={[styles.navIcon, activeTab === item.tab && styles.activeNavIcon]}>
            <Text style={styles.navIconText}>{item.icon}</Text>
          </View>
          <Text style={[styles.navLabel, activeTab === item.tab && styles.activeNavLabel]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.navBackground,
    paddingVertical: 16,
    paddingBottom: 34, // Extra padding for iPhone home indicator
    borderTopWidth: 1,
    borderTopColor: colors.navBorder,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  activeNavItem: {
    backgroundColor: colors.navActive,
  },
  navIcon: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeNavIcon: {
    backgroundColor: colors.primary,
  },
  navIconText: {
    fontSize: 12,
  },
  navLabel: {
    fontSize: 11,
    color: colors.navText,
    fontWeight: '500',
  },
  activeNavLabel: {
    color: colors.navActiveText,
  },
});

export default BottomNavigation;
