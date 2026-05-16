import React from 'react';
import { Stack } from 'expo-router';

/**
 * Onboarding flow stack (5 шагов: welcome → language → level → goal →
 * notifications → done).
 *
 * Хедер скрыт во всём стеке — каждый шаг сам рисует свою progress-bar.
 * Gesture-back enabled, чтобы юзер мог вернуться назад на любом шаге.
 */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        contentStyle: { backgroundColor: '#1a1c26' },
      }}
    />
  );
}
