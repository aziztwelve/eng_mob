import React, { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SunsetBg } from '@/components/sunset';
import { FluentBottomTabs } from '@/components/navigation/FluentBottomTabs';
import { AuthService } from '@/lib/auth-service';

export default function TabsLayout() {
  const router = useRouter();

  // === Auth gate (option B): регистрация обязательна для входа в app. ===
  // Гость проходит онбординг, но в основной интерфейс попадает только
  // зарегистрированный (claimed) пользователь. Проверяем при монтировании:
  //   - нет токена          → /onboarding/welcome (начать заново);
  //   - токен есть + гость   → /onboarding/signup (дорегистрация);
  //   - токен есть + claimed → пускаем.
  const [gateChecked, setGateChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await AuthService.getAccessToken();
      const guest = await AuthService.isGuestSession();
      if (cancelled) return;
      if (!token) {
        router.replace('/onboarding/welcome');
        return;
      }
      if (guest) {
        router.replace('/onboarding/signup');
        return;
      }
      setGateChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!gateChecked) {
    return (
      <SunsetBg>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#FFD84A" size="large" />
        </View>
      </SunsetBg>
    );
  }

  return (
    <SunsetBg>
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={{ flex: 1 }}>
          <Tabs
            // Кастомный нижний бар (Fluent glassmorphism). Роутинг остаётся
            // file-based (expo-router), а вид рисует FluentBottomTabs.
            tabBar={(props) => <FluentBottomTabs {...props} />}
            screenOptions={{
              headerShown: false,
              sceneStyle: StyleSheet.flatten({ backgroundColor: 'transparent' }),
            }}
          >
            {/* Видимые табы (порядок = порядок в меню). */}
            <Tabs.Screen name="index" />
            <Tabs.Screen name="practice" />
            <Tabs.Screen name="ai" />
            <Tabs.Screen name="social" />
            <Tabs.Screen name="profile" />

            {/* Служебные/вложенные маршруты — в меню не показываются
                (FluentBottomTabs фильтрует их по ROUTE_TO_TAB_ID). */}
            <Tabs.Screen name="tracks" options={{ tabBarButton: () => null }} />
            <Tabs.Screen name="courses" options={{ tabBarButton: () => null }} />
            <Tabs.Screen name="home-candy" options={{ tabBarButton: () => null }} />
            <Tabs.Screen name="home-neon" options={{ tabBarButton: () => null }} />
            <Tabs.Screen name="home-ruya" options={{ tabBarButton: () => null }} />
            <Tabs.Screen name="home-ruya-pro" options={{ tabBarButton: () => null }} />
          </Tabs>
        </View>
      </SafeAreaView>
    </SunsetBg>
  );
}
