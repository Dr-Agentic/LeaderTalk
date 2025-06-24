import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Platform, StatusBar } from 'react-native';

function TabBarIcon(props: {
  name: keyof typeof Feather.glyphMap;
  color: string;
  size?: number;
}) {
  return <Feather size={props.size || 24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#8A2BE2',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarStyle: {
          backgroundColor: 'rgba(15, 15, 35, 0.95)',
          borderTopColor: 'rgba(138, 43, 226, 0.3)',
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 90 : 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false, // We'll use our custom header
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="transcripts"
        options={{
          title: 'Transcripts',
          tabBarIcon: ({ color }) => <TabBarIcon name="file-text" color={color} />,
        }}
      />
      <Tabs.Screen
        name="recording"
        options={{
          title: 'Record',
          tabBarIcon: ({ color }) => <TabBarIcon name="mic" color={color} />,
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: 'Training',
          tabBarIcon: ({ color }) => <TabBarIcon name="book-open" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabBarIcon name="settings" color={color} />,
        }}
      />
      
      {/* Hide these screens from tab bar but keep them accessible */}
      <Tabs.Screen
        name="recordings"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="leadertalk"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
