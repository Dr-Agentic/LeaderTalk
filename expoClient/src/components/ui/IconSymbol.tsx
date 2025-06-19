import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IconSymbolProps {
  name: string;
  size: number;
  color: string;
}

// This component is a wrapper around Ionicons to match the API of the web app's IconSymbol
// In a real app, you would map the SF Symbol names to Ionicons names
export function IconSymbol({ name, size, color }: IconSymbolProps) {
  // Map SF Symbol names to Ionicons names
  const iconMap: Record<string, string> = {
    'house.fill': 'home',
    'paperplane.fill': 'paper-plane',
    'mic.fill': 'mic',
    'doc.text.fill': 'document-text',
    'book.fill': 'book',
    'gear': 'settings',
    'chevron.down': 'chevron-down',
    'chevron.right': 'chevron-forward',
    'arrow.right': 'arrow-forward',
    'calendar': 'calendar',
    'clock': 'time',
    'doc.text': 'document-text-outline',
    'person.fill': 'person',
    'key.fill': 'key',
    'bell.fill': 'notifications',
    'moon.fill': 'moon',
    'questionmark.circle.fill': 'help-circle',
    'envelope.fill': 'mail',
    'stop.fill': 'stop',
  };
  
  // Convert SF Symbol name to Ionicons name
  const ionIconName = iconMap[name] || 'help-outline';
  
  return <Ionicons name={ionIconName as any} size={size} color={color} />;
}
