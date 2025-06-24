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
        headerShown: false, // We'll use our custom header
        // Hide the tab bar completely since we use top-left menu
        tabBarStyle: {
          display: 'none',
        },
        // Make screen backgrounds transparent - enhanced for React Native Web
        sceneContainerStyle: {
          backgroundColor: 'transparent',
        },
        // Additional React Native Web overrides
        tabBarBackground: () => null,
        cardStyle: {
          backgroundColor: 'transparent',
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
