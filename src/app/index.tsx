import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { isOnboarded } from '@/lib/onboarding-storage';
import { isOnboardingV3Enabled } from '@/lib/feature-flags';

/**
 * Root-route — splash + redirect.
 *
 * Логика:
 *   1. Проверяем `isOnboarded()` (локальный кэш — последнее известное
 *      состояние).
 *   2. Onboarded или V3 kill-switch выключен → `/(tabs)`.
 *   3. Иначе → `/onboarding/welcome`.
 *
 * Раньше тут был legacy экран SIGN IN / CREATE ACCOUNT для случая
 * «нет токена». После lazy-guest-creation (см. `ensureGuestSession`)
 * этот экран больше не нужен — наш `/onboarding/welcome` сам
 * предлагает «Начать учиться» (создаст гостя) и «У меня уже есть
 * аккаунт. Войти» (уйдёт в `/auth/login`).
 */
export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const onboarded = await isOnboarded();
      if (cancelled) return;
      const v3Enabled = isOnboardingV3Enabled();

      if (onboarded || !v3Enabled) {
        // Уже прошёл онбординг (или V3 выключен) — пускаем в основной
        // app. Если токена нет (например, юзер переустановил приложение
        // после флага onboarded в старом install'е) — `/(tabs)` сам
        // редиректнёт обратно через свой guard.
        router.replace('/(tabs)');
        return;
      }

      // Не onboarded — показываем welcome.
      // ensureGuestSession() будет вызвана лениво при первом тапе
      // «Начать учиться» (см. usePatchOnboardingV3 → ensureGuestSession).
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
