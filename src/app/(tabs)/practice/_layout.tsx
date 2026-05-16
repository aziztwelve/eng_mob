import React from 'react';
import { Stack } from 'expo-router';

export default function PracticeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#252736' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '900' },
      }}
    />
  );
}
