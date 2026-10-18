import { drainVocabularyAttempts } from '@/lib/vocabulary-attempt-queue';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
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
import { AppState, LogBox, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';

import { BrandSplash } from '@/components/brand-splash';
import { queryClient } from '@/lib/query-client';
import { setupPushHandler } from '@/lib/push-registration';
import { reschedule as rescheduleLockscreenWords } from '@/lib/lockscreen-words';
import { initI18n } from '@/lib/i18n';
import { drainOnboardingQueue } from '@/hooks/use-onboarding';
import { markStartup } from '@/lib/startup-timing';
import { useStartupTabsReady } from '@/lib/startup-screen';

import '../global.css';

// Dev builds: the LogBox warning bar overlays the bottom CTA area of the
// word-bank player and swallows taps. Production never shows it anyway.
LogBox.ignoreAllLogs();

// Full-screen native test on the connected Android 10 phone. Keep the React
// screen available on platforms with different native launch-screen rules.
const useNativeBrandSplash = Platform.OS === 'android' && Number(Platform.Version) < 31;

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

  // Onboarding is local until the mandatory registration step. No guest
  // session is created during app startup or from a data request.

export default function TabLayout() {
  const segments = useSegments();
  const tabsReady = useStartupTabsReady();
  const firstSegment = segments[0] as string | undefined;
  const firstScreenReady = firstSegment === '(tabs)'
    ? tabsReady
    : !!firstSegment && firstSegment !== 'index';
  const [i18nReady, setI18nReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });
  const ready = i18nReady && (fontsLoaded || !!fontError);

  useEffect(() => { markStartup('root mounted'); }, []);
  useEffect(() => {
    if (fontsLoaded || fontError) markStartup(fontError ? 'font error' : 'fonts ready');
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!ready || (useNativeBrandSplash && !firstScreenReady)) return;
    markStartup('splash ready to hide');
    const frame = requestAnimationFrame(() => { void SplashScreen.hideAsync().catch(() => {}); });
    return () => cancelAnimationFrame(frame);
  }, [ready, firstScreenReady]);

  // Start the home background download while fonts and persisted settings load.
  useEffect(() => {
    void (async () => {
      try {
        const asset = Asset.fromModule(require('../../assets/figma/home-map/map-scenery.png'));
        // Android's prefetch accepts remote URLs; bundled files are already local.
        if (/^https?:/.test(asset.uri)) await Image.prefetch(asset.uri);
      } catch (error) {
        if (__DEV__) console.warn('[startup] home background preload failed:', error);
      }
    })();
  }, []);

  // i18n init (load persisted UI lang from AsyncStorage).
  useEffect(() => {
    let cancelled = false;
    void initI18n().finally(() => {
      markStartup('language ready');
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

  // Lock Screen Words: пересобираем очередь уведомлений при старте и каждом
  // возвращении в foreground (свежие слова + пополнение слотов, см.
  // docs/tasks/mob/lockscreen-words.md). reschedule() сам знает, включена ли
  // фича (нет — выйдет после cancel).
  useEffect(() => {
    let rescheduling = false;
    const run = async () => {
      if (rescheduling) return;
      rescheduling = true;
      try {
        await rescheduleLockscreenWords();
      } catch (err) {
        if (__DEV__) console.warn('[lockscreen-words] reschedule failed:', err);
      } finally {
        rescheduling = false;
      }
    };
    void run();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') { void run(); void drainVocabularyAttempts().catch(() => undefined); }
    });
    return () => sub.remove();
  }, []);

  // Offline-mutation-queue: дренируем накопленные patch'и при boot
  // и при каждом online-событии.
  useEffect(() => {
    let lastWasOffline = false;
    void drainOnboardingQueue();
    void drainVocabularyAttempts().catch(() => undefined);
    const unsub = NetInfo.addEventListener((state) => {
      const isOnline = !!state.isConnected && state.isInternetReachable !== false;
      if (isOnline && lastWasOffline) {
        void drainOnboardingQueue();
        void drainVocabularyAttempts().catch(() => undefined);
      }
      lastWasOffline = !isOnline;
    });
    return () => {
      unsub();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={() => {
      if (!useNativeBrandSplash) void SplashScreen.hideAsync().catch(() => {});
    }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider>
          <ThemeProvider value={NeonDarkTheme}>
            <StatusBar style="light" />
            {ready && <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#06070D' } }} />}
            {!useNativeBrandSplash && <BrandSplash ready={ready} fontsLoaded={fontsLoaded} />}
            <Toast />
          </ThemeProvider>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
