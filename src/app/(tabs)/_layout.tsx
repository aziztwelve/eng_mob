import React, { useEffect, useState } from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SunsetBg } from '@/components/sunset';
import { HomeTabBar } from '@/components/home/home-tab-bar';
import { AuthService } from '@/lib/auth-service';
import { markStartupTabsReady } from '@/lib/startup-screen';
import { markStartup } from '@/lib/startup-timing';

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";
  // Pages drawn on the light sky background (no purple strip under the status bar).
  const isSky = isHome || pathname.startsWith("/practice") || pathname.startsWith("/tracks");
  const isWordBankLesson = /^\/practice\/vocabulary\/[^/]+\/learn\/?$/.test(pathname);

  // === Auth gate (option B): регистрация обязательна для входа в app. ===
  // Гость проходит онбординг, но в основной интерфейс попадает только
  // зарегистрированный (claimed) пользователь. Проверяем при монтировании:
  //   - нет токена          → /onboarding/welcome (начать заново);
  //   - токен есть + гость   → /onboarding/signup (дорегистрация);
  //   - токен есть + claimed → пускаем.
  const [gateChecked, setGateChecked] = useState(false);

  useEffect(() => {
    if (!gateChecked) return;
    markStartup('tabs session ready');
    markStartupTabsReady();
  }, [gateChecked]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await AuthService.getAccessToken();
      if (cancelled) return;
      if (!token) {
        router.replace('/onboarding/welcome');
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
      <SafeAreaView edges={isHome ? [] : ['top']} style={{ flex: 1, backgroundColor: isWordBankLesson ? '#B3E6FF' : isHome ? '#BFEAFD' : isSky ? '#A9E0FF' : 'transparent' }}>
        <StatusBar style={isSky || isWordBankLesson ? "dark" : "light"} />
        <View style={{ flex: 1 }}>
          <Tabs
            // «Назад» возвращает на вкладку, с которой пришли (а не на первую).
            backBehavior="history"
            // Нижний бар из макета Figma для всех вкладок. Роутинг остаётся
            // file-based (expo-router), а вид рисует HomeTabBar.
            tabBar={(props) => isWordBankLesson ? null : <HomeTabBar {...props} />}
            screenOptions={{
              headerShown: false,
              sceneStyle: StyleSheet.flatten({ backgroundColor: 'transparent' }),
            }}
          >
            {/* Видимые табы (порядок = порядок в меню). */}
            <Tabs.Screen name="index" />
            <Tabs.Screen name="practice" options={{ popToTopOnBlur: true }} />
            <Tabs.Screen name="ai" />
            <Tabs.Screen name="social" />
            <Tabs.Screen name="profile" />

            {/* Служебные/вложенные маршруты — в меню не показываются
                (FluentBottomTabs фильтрует их по ROUTE_TO_TAB_ID). */}
            <Tabs.Screen name="tracks" options={{ tabBarButton: () => null, popToTopOnBlur: true }} />
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
