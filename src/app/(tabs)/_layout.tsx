import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GamificationTopbar } from '@/components/gamification';

export default function TabsLayout() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <GamificationTopbar />
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#252736',
              borderTopColor: 'rgba(255, 255, 255, 0.1)',
              borderTopWidth: 2,
            },
            tabBarActiveTintColor: '#58cc02',
            tabBarInactiveTintColor: '#666',
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: () => <Text style={{ fontSize: 24 }}>🏠</Text>,
            }}
          />
          <Tabs.Screen
            name="tracks"
            options={{
              title: 'Tracks',
              tabBarIcon: () => <Text style={{ fontSize: 24 }}>🧭</Text>,
            }}
          />
          <Tabs.Screen
            name="courses"
            options={{
              title: 'Courses',
              tabBarIcon: () => <Text style={{ fontSize: 24 }}>📚</Text>,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: () => <Text style={{ fontSize: 24 }}>👤</Text>,
            }}
          />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}
