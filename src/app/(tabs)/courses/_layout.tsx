import React from 'react';
import { Stack } from 'expo-router';

export default function CoursesStack() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#252736' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '900' },
      }}
    />
  );
}
