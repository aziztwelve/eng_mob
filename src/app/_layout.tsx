import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import NetInfo from '@react-native-community/netinfo';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { queryClient } from '@/lib/query-client';
import { setupPushHandler } from '@/lib/push-registration';
import { initI18n } from '@/lib/i18n';
import { drainOnboardingQueue } from '@/hooks/use-onboarding';

import '../global.css';

// Onboarding v3: guest-сессия теперь создаётся лениво при первом
// тапе «Начать учиться» (см. `ensureGuestSession` в `lib/auth-service.ts`).
// Это избавляет БД от orphan-аккаунтов юзеров, открывших app и сразу
// закрывших.

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [i18nReady, setI18nReady] = useState(false);

  // i18n init (load persisted UI lang from AsyncStorage).
  useEffect(() => {
    let cancelled = false;
    void initI18n().finally(() => {
      if (!cancelled) setI18nReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Phase 3: глобальный handler для push-уведомлений.
  useEffect(() => {
    setupPushHandler();
  }, []);

  // Offline-mutation-queue: дренируем накопленные patch'и при boot
  // и при каждом online-событии.
  useEffect(() => {
    let lastWasOffline = false;
    void drainOnboardingQueue();
    const unsub = NetInfo.addEventListener((state) => {
      const isOnline = !!state.isConnected && state.isInternetReachable !== false;
      if (isOnline && lastWasOffline) {
        void drainOnboardingQueue();
      }
      lastWasOffline = !isOnline;
    });
    return () => {
      unsub();
    };
  }, []);

  if (!i18nReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AnimatedSplashOverlay />
            <Stack screenOptions={{ headerShown: false }} />
            <Toast />
          </ThemeProvider>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
