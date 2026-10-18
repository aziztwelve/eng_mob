import React from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FigmaSvg } from '@/components/figma/FigmaSvg';
import type { SocialProvider } from '@/lib/oauth';

const googleIcon = require('../../../assets/figma/mieo-login/113-366-15242-svg.svg');
const appleIcon = require('../../../assets/figma/mieo-login/115-366-15246-svg.svg');

export function SocialAuthButtons({ disabled, pending, onPress }: { disabled: boolean; pending?: SocialProvider; onPress: (provider: SocialProvider) => void }) {
  const { t } = useTranslation();
  return <>
    <View className="my-5 flex-row items-center gap-3"><View className="h-px flex-1 bg-[#E3E6E8]" /><Text className="font-nunito-semibold text-sm text-[#648495]">{t('auth.login.or_continue_with')}</Text><View className="h-px flex-1 bg-[#E3E6E8]" /></View>
    <View className="flex-row gap-3">
      {(['google', ...(Platform.OS === 'ios' ? ['apple'] : [])] as SocialProvider[]).map(provider => <Pressable key={provider} testID={`social-${provider}`} accessibilityRole="button" accessibilityLabel={t(`auth.login.oauth_${provider}_title`)} accessibilityState={{ disabled, busy: pending === provider }} disabled={disabled} onPress={() => onPress(provider)} className={`min-h-14 flex-1 flex-row items-center justify-center gap-2 rounded-full border-2 border-[#E3E6E8] bg-white px-2 py-3 ${disabled ? 'opacity-60' : 'active:opacity-70'}`}>
        {pending === provider ? <ActivityIndicator color="#12B4FB" /> : <FigmaSvg source={provider === 'google' ? googleIcon : appleIcon} width={23} height={24} />}
        <Text className="font-nunito-semibold text-sm text-[#496779]">{provider === 'google' ? 'Google' : 'Apple'}</Text>
      </Pressable>)}
    </View>
  </>;
}
