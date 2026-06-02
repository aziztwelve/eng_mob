import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GamificationTopbar } from '@/components/gamification';

export default function TabsLayout() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#06070D' }}>
      <GamificationTopbar />
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#141A24',
              borderTopColor: 'rgba(255, 255, 255, 0.1)',
              borderTopWidth: 2,
            },
            tabBarActiveTintColor: '#00FFA3',
            tabBarInactiveTintColor: '#6B7B93',
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
            name="practice"
            options={{
              title: 'Practice',
              tabBarIcon: () => <Text style={{ fontSize: 24 }}>🧠</Text>,
            }}
          />
          <Tabs.Screen
            name="ai"
            options={{
              title: 'AI',
              tabBarIcon: () => <Text style={{ fontSize: 24 }}>🤖</Text>,
            }}
          />
          <Tabs.Screen
            name="social"
            options={{
              title: 'Social',
              tabBarIcon: () => <Text style={{ fontSize: 24 }}>🏆</Text>,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: () => <Text style={{ fontSize: 24 }}>👤</Text>,
            }}
          />
          {/* Hidden routes - still routable as /tracks/[id], /courses/[id]
              from Home cards, but not shown in the bottom tab bar.
              `href: null` иногда не работает на web → дополнительно
              скрываем кнопку через tabBarButton: () => null. */}
          <Tabs.Screen
            name="tracks"
            options={{ tabBarButton: () => null }}
          />
          <Tabs.Screen
            name="courses"
            options={{ tabBarButton: () => null }}
          />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}
