import React, { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Dimensions, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Home, GraduationCap, Sparkles, Trophy, User } from 'lucide-react-native';
import { SunsetBg } from '@/components/sunset';
import { AuthService } from '@/lib/auth-service';
// Theme colors moved inline for candy gradient design

const ICON_SIZE = 28;
const ICON_STROKE = 2.2;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
type TabIconName = 'home' | 'practice' | 'ai' | 'social' | 'profile';

function TabIcon({ name, color }: { name: TabIconName; color: string }) {
  const props = { size: ICON_SIZE, color, strokeWidth: ICON_STROKE };

  if (name === 'home') {
    return <Home {...props} />;
  }

  if (name === 'practice') {
    return <GraduationCap {...props} />;
  }

  if (name === 'ai') {
    return <Sparkles {...props} />;
  }

  if (name === 'social') {
    return <Trophy {...props} />;
  }

  return <User {...props} />;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
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
            screenOptions={{
              headerShown: false,
              sceneStyle: StyleSheet.flatten({ backgroundColor: 'transparent' }),
              tabBarStyle: {
                backgroundColor: '#B0403A',
                borderTopColor: 'transparent',
                borderTopWidth: 0,
                borderTopLeftRadius: 26,
                borderTopRightRadius: 26,
                height: 60 + insets.bottom,
                paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
                paddingTop: 8,
                paddingHorizontal: 10,
                elevation: 0,
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
              },
              tabBarItemStyle: {
                flex: 1,
                minWidth: 70,
              },
              tabBarActiveTintColor: '#FFFFFF',
              tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
              tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: '800',
                marginBottom: 2,
              },
              tabBarIconStyle: {
                marginBottom: 2,
              },
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: 'Главная',
                tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
              }}
            />
            <Tabs.Screen
              name="practice"
              options={{
                title: 'Уроки',
                tabBarIcon: ({ color }) => <TabIcon name="practice" color={color} />,
              }}
            />
            <Tabs.Screen
              name="ai"
              options={{
                title: t('tabs.ai'),
                tabBarIcon: ({ color }) => <TabIcon name="ai" color={color} />,
              }}
            />
            <Tabs.Screen
              name="social"
              options={{
                title: 'Лига',
                tabBarIcon: ({ color }) => <TabIcon name="social" color={color} />,
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: 'Профиль',
                tabBarIcon: ({ color }) => <TabIcon name="profile" color={color} />,
              }}
            />
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
