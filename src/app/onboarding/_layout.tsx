import React from 'react';
import { Stack } from 'expo-router';

/** First launch: welcome → goal → age → level → reminder-time → signup. */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        contentStyle: { backgroundColor: '#BFEAFD' },
      }}
    />
  );
}
