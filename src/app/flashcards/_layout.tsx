import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SunsetBg, sunsetStackOptions } from '@/components/sunset';

/** Reserve the system navigation area once for the whole flashcard flow. */
export default function FlashcardsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <SunsetBg>
      <View className="flex-1" style={{ paddingBottom: insets.bottom }}>
        <Stack screenOptions={sunsetStackOptions} />
      </View>
    </SunsetBg>
  );
}
