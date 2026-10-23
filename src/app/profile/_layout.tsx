import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';

export default function ProfileLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const focused = useIsFocused();
  const { t } = useTranslation();
  return (
    <View className="flex-1 bg-mieo-bg">
      {focused && <StatusBar style="dark" />}
      <Stack screenOptions={{
        contentStyle: { backgroundColor: '#FAFAFA' },
        header: ({ options, navigation }) => (
          <View className="bg-mieo-bg" style={{ paddingTop: insets.top + 12 }}>
            <View className="w-full max-w-[600px] self-center flex-row items-center gap-4 px-4 pb-3">
              <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')}
                onPress={() => navigation.canGoBack() ? navigation.goBack() : router.replace('/(tabs)/profile')}
                className="rounded-xl border-[1.5px] border-mieo-stroke bg-mieo-surface p-3">
                <ChevronLeft size={24} color="#171A1C" />
              </Pressable>
              <Text className="flex-1 font-nunito-extrabold text-[22px] text-mieo-heading">{options.title}</Text>
            </View>
          </View>
        ),
      }} />
    </View>
  );
}
