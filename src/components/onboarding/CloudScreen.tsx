import React from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FigmaSvg } from '@/components/figma/FigmaSvg';

export function CloudScreen({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-1 bg-[#BFEAFD]">
      <StatusBar style="dark" />
      <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
        <Image source={require('../../../assets/figma/lesson-tiles/scenery.webp')} resizeMode="cover" className="absolute inset-0 h-full w-full opacity-50" />
        <View className="absolute -left-12 top-14 opacity-90"><FigmaSvg source={require('../../../assets/figma/home-map/cloud-1.svg')} width={260} height={125} /></View>
        <View className="absolute -right-16 top-72 opacity-90"><FigmaSvg source={require('../../../assets/figma/home-map/cloud-3.svg')} width={220} height={100} /></View>
      </View>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>{children}</SafeAreaView>
    </View>
  );
}

export function CloudButton({ label, onPress, disabled, loading, testID }: {
  label: string; onPress: () => void; disabled?: boolean; loading?: boolean; testID?: string;
}) {
  return (
    <Pressable testID={testID} onPress={onPress} disabled={disabled || loading} accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      className={`min-h-14 items-center justify-center rounded-full border-b-4 px-5 py-3 active:opacity-80 ${disabled ? 'border-[#9DCFE5] bg-[#A6DDF4]' : 'border-[#0798D7] bg-[#12B4FB]'}`}>
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-center font-nunito-extrabold text-base text-white">{label}</Text>}
    </Pressable>
  );
}

export function CloudBear({ signup = false, small = false }: { signup?: boolean; small?: boolean }) {
  return <Image source={small ? require('../../../assets/onboarding-cloud/login-bear.png') : signup ? require('../../../assets/onboarding-cloud/signup-bear.png') : require('../../../assets/onboarding-cloud/welcome-bear.png')}
    resizeMode="contain" accessible={false} className={small ? 'h-20 w-20' : signup ? 'h-40 w-48' : 'h-64 w-64'} />;
}
