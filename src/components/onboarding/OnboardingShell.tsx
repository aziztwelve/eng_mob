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
import { NeonScreen, neon, neonStyles } from '@/components/neon-screen';

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
    <NeonScreen>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: 'transparent' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Header: back + progress */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
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
            style={{ flex: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden', borderWidth: 1, borderColor: neon.border }}
            accessibilityRole="progressbar"
            accessibilityLabel={t('onboarding.common.step_progress', { step, total })}
            accessibilityValue={{ min: 0, max: total, now: step }}
          >
            <View
              style={{ height: '100%', width: `${pct}%`, backgroundColor: neon.primary, shadowColor: neon.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 12 }}
            />
          </View>
          <Text
            style={{ color: neon.muted, fontWeight: '800', fontSize: 12, width: 40, textAlign: 'right' }}
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
          <Text style={neonStyles.title} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ color: neon.muted, fontWeight: '600', fontSize: 16, lineHeight: 22 }}>
              {subtitle}
            </Text>
          ) : null}
          <View className="mt-2 gap-3">{children}</View>
        </ScrollView>

        {/* Footer */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8, gap: 8, backgroundColor: 'rgba(6,7,13,0.82)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
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
            style={[neonStyles.cta, { backgroundColor: neon.ctaBg }, (continueDisabled || continueLoading || !onContinue) && { opacity: 0.6, shadowOpacity: 0, backgroundColor: 'rgba(255,255,255,0.08)' }]}
          >
            {continueLoading ? <ActivityIndicator color={neon.text} /> : <Text style={{ color: neon.text, fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>{resolvedContinueLabel}</Text>}
          </Pressable>
        </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </NeonScreen>
  );
}
