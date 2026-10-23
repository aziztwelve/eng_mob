import { Stack } from 'expo-router';
import { StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkyScreen, SKY } from '@/components/lesson/sky-lesson-header';

export default function FlashcardsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <SkyScreen>
      <StatusBar barStyle="dark-content" />
      <View className="flex-1" style={{ paddingBottom: insets.bottom }}>
        <Stack screenOptions={{
          headerStyle: { backgroundColor: SKY.top },
          headerTintColor: SKY.ink,
          headerTitleStyle: { fontFamily: 'Nunito_900Black' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: 'transparent' },
        }} />
      </View>
    </SkyScreen>
  );
}
