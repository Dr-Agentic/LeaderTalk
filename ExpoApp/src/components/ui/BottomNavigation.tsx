import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

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
          <Text style={styles.navIcon}>{item.icon}</Text>
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
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    paddingVertical: 12,
    paddingBottom: 34, // Extra padding for iPhone home indicator
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  activeNavItem: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  activeNavLabel: {
    color: '#8A2BE2',
  },
});

export default BottomNavigation;
