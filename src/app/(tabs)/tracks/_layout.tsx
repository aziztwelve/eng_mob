import React from 'react';
import { Stack } from 'expo-router';

export default function TracksStack() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#141A24' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '900' },
      }}
    />
  );
}
