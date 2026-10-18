import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { isOnboarded } from '@/lib/onboarding-storage';
import { isOnboardingV3Enabled } from '@/lib/feature-flags';
import { AuthService } from '@/lib/auth-service';

/**
 * Root-route — splash + redirect.
 *
 * Логика:
 *   1. Проверяем `isOnboarded()` (локальный кэш — последнее известное
 *      состояние).
 *   2. Onboarded или V3 kill-switch выключен → `/(tabs)`.
 *   3. Иначе → `/onboarding/welcome`.
 *
 * Пользователь без registered token проходит локальный onboarding и затем
 * обязательную регистрацию. Основной интерфейс доступен только с token.
 */
export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [onboarded, token] = await Promise.all([
        isOnboarded(),
        AuthService.getAccessToken(),
      ]);
      if (cancelled) return;
      const v3Enabled = isOnboardingV3Enabled();

      // Зарегистрированный юзер с токеном — всегда в app.
      if (token) {
        router.replace('/(tabs)');
        return;
      }

      if (onboarded || !v3Enabled) {
        // Локальный onboarding без registered token должен продолжить
        // обязательную регистрацию, а не открывать guest UI.
        router.replace('/onboarding/signup');
        return;
      }

      // Не onboarded — показываем welcome.
      router.replace('/onboarding/welcome');
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#00FFA3" size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06070D',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
