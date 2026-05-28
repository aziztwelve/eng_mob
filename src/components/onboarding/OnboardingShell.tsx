import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { analytics } from '@/lib/analytics';

/**
 * Общая обёртка для onboarding-экранов.
 *   - SafeAreaView (top + bottom)
 *   - Header с back-кнопкой и progress-bar (step / total)
 *   - ScrollView с контентом
 *   - Sticky footer с primary-кнопкой Continue
 */
export interface OnboardingShellProps {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onContinue?: () => void | Promise<void>;
  continueLabel?: string;
  continueDisabled?: boolean;
  continueLoading?: boolean;
  showBack?: boolean;
  /** Дополнительный slot между body и кнопкой (например, secondary action). */
  footerExtra?: React.ReactNode;
  /**
   * Ключ шага для analytics. Если задан, при mount шлём
   * `onboarding_step_viewed` с этим ключом + step/total.
   */
  trackKey?: string;
}

export function OnboardingShell({
  step,
  total,
  title,
  subtitle,
  children,
  onContinue,
  continueLabel,
  continueDisabled = false,
  continueLoading = false,
  showBack = true,
  footerExtra,
  trackKey,
}: OnboardingShellProps) {
  const { t } = useTranslation();
  const resolvedContinueLabel = continueLabel ?? t('onboarding.common.continue');
  const pct = Math.round((step / total) * 100);

  useEffect(() => {
    if (!trackKey) return;
    analytics.track('onboarding_step_viewed', {
      step_key: trackKey,
      step,
      total,
    });
  }, [trackKey, step, total]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header: back + progress */}
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3">
          {showBack ? (
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              className="active:opacity-60"
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.common.back')}
            >
              <ArrowLeft size={22} color="#9ca3af" />
            </Pressable>
          ) : (
            <View style={{ width: 22 }} />
          )}
          <View
            className="flex-1 h-3 bg-muted rounded-full overflow-hidden border-2 border-border"
            accessibilityRole="progressbar"
            accessibilityLabel={t('onboarding.common.step_progress', { step, total })}
            accessibilityValue={{ min: 0, max: total, now: step }}
          >
            <View
              className="h-full bg-primary"
              style={{ width: `${pct}%` }}
            />
          </View>
          <Text
            className="text-muted-foreground font-bold text-xs tabular-nums w-10 text-right"
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {step}/{total}
          </Text>
        </View>

        {/* Body */}
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            gap: 12,
            paddingBottom: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            className="text-foreground font-black text-3xl"
            accessibilityRole="header"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-muted-foreground font-medium text-base">
              {subtitle}
            </Text>
          ) : null}
          <View className="mt-2 gap-3">{children}</View>
        </ScrollView>

        {/* Footer */}
        <View className="px-4 pb-3 pt-2 gap-2 bg-background border-t border-border/40">
          {footerExtra}
          <Pressable
            onPress={() => void onContinue?.()}
            disabled={continueDisabled || continueLoading || !onContinue}
            accessibilityRole="button"
            accessibilityLabel={resolvedContinueLabel}
            accessibilityState={{
              disabled: continueDisabled || continueLoading || !onContinue,
              busy: continueLoading,
            }}
            className={`rounded-2xl py-4 items-center ${
              !continueDisabled && !continueLoading && onContinue
                ? 'bg-primary active:opacity-80'
                : 'bg-muted opacity-60'
            }`}
          >
            {continueLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-primary-foreground font-black text-base">
                {resolvedContinueLabel}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
