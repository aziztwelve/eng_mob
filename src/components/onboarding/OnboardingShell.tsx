import React, { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { KeyboardLift } from '@/components/keyboard-lift';
import { analytics } from '@/lib/analytics';
import { CloudBear, CloudButton, CloudScreen } from './CloudScreen';

export interface OnboardingShellProps {
  step: number; total: number; title: string; subtitle?: string; children: React.ReactNode;
  onContinue?: () => void | Promise<void>; continueLabel?: string;
  continueDisabled?: boolean; continueLoading?: boolean; showBack?: boolean;
  footerExtra?: React.ReactNode; trackKey?: string;
}

export function OnboardingShell({ step, total, title, subtitle, children, onContinue, continueLabel,
  continueDisabled, continueLoading, showBack = true, footerExtra, trackKey }: OnboardingShellProps) {
  const { t } = useTranslation();
  useEffect(() => { if (trackKey) analytics.track('onboarding_step_viewed', { step_key: trackKey, step, total }); }, [trackKey, step, total]);
  return (
    <CloudScreen>
      <KeyboardLift>
        <View className="flex-row items-center gap-3 px-5 pb-2 pt-3">
          {showBack && <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/onboarding/welcome')} accessibilityRole="button" accessibilityLabel={t('onboarding.common.back')} className="h-11 w-11 items-center justify-center rounded-full bg-white"><ArrowLeft color="#1782AD" size={23} /></Pressable>}
          <View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: total, now: step }} className="h-3 flex-1 overflow-hidden rounded-full bg-white">
            <View className="h-full rounded-full bg-[#12B4FB]" style={{ width: `${step / total * 100}%` }} />
          </View>
          <Text className="font-nunito-extrabold text-xs text-[#217FA5]">{step}/{total}</Text>
        </View>
        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-6 pt-2" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="mb-5 flex-row items-start gap-2">
            <View className="flex-1 pt-4">
              <Text accessibilityRole="header" className="font-nunito-black text-[28px] leading-8 text-[#142A35]">{title}</Text>
              {subtitle && <Text className="mt-3 font-nunito-semibold text-[15px] leading-[21px] text-[#496779]">{subtitle}</Text>}
            </View>
            <View className="-mr-2"><CloudBear small /></View>
          </View>
          {children}
        </ScrollView>
        <View className="gap-2 rounded-t-[28px] bg-white/95 px-5 pb-4 pt-4">
          {footerExtra}
          <CloudButton label={continueLabel ?? t('onboarding.common.continue')} onPress={() => void onContinue?.()} disabled={continueDisabled || !onContinue} loading={continueLoading} testID="onboarding-continue" />
        </View>
      </KeyboardLift>
    </CloudScreen>
  );
}
