import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
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

// Neon Dark — force a consistent dark navigation theme regardless of the
// device color scheme so chrome (stack/tab backgrounds) matches the app.
const NeonDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#06070D',
    card: '#141A24',
    primary: '#00FFA3',
    text: '#ffffff',
    border: 'rgba(255, 255, 255, 0.09)',
    notification: '#FF4B7E',
  },
};

// Onboarding v3: guest-сессия теперь создаётся лениво при первом
// тапе «Начать учиться» (см. `ensureGuestSession` в `lib/auth-service.ts`).
// Это избавляет БД от orphan-аккаунтов юзеров, открывших app и сразу
// закрывших.

export default function TabLayout() {
  const [i18nReady, setI18nReady] = useState(false);
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

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

  if (!i18nReady || !fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider>
          <ThemeProvider value={NeonDarkTheme}>
            <StatusBar style="light" />
            <AnimatedSplashOverlay />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#06070D' } }} />
            <Toast />
          </ThemeProvider>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
