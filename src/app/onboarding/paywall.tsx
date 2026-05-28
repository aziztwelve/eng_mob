import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Mascot } from '@/components/onboarding/Mascot';
import { PaywallCard } from '@/components/onboarding/PaywallCard';
import { ExitIntentSheet } from '@/components/onboarding/ExitIntentSheet';
import { usePatchOnboardingV3 } from '@/hooks/use-onboarding';
import { analytics } from '@/lib/analytics';
import type { PaywallChoice } from '@/types/api';

/**
 * Paywall (шаг 13 / 14) — два SKU + 3-day free trial + ExitIntentSheet.
 *
 * Логика заглушки (без реальной покупки, см. spec §3.8):
 *   1. Mount → пишем `paywall_seen_at` (ISO).
 *   2. CTA → `paywall_choice='annual'|'monthly'` → push на done (signup в Sprint 5).
 *   3. X close → ExitIntentSheet (-50%):
 *        - "Получить" → paywall_choice='special_offer'.
 *        - "Нет"      → paywall_choice='dismissed'.
 *
 * Все 4 пути ведут на `/onboarding/done` — paywall не блокирующий.
 */

export default function PaywallScreen() {
  const { t } = useTranslation();
  const FEATURES = useMemo(
    () => [
      t('onboarding.paywall.features.unlimited'),
      t('onboarding.paywall.features.skills'),
      t('onboarding.paywall.features.adaptive'),
      t('onboarding.paywall.features.trial'),
    ],
    [t],
  );
  const [selected, setSelected] = useState<'annual' | 'monthly'>('annual');
  const [exitVisible, setExitVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const patch = usePatchOnboardingV3();

  // Записываем `paywall_seen_at` один раз при mount.
  useEffect(() => {
    void patch.mutateAsync({
      patch: { paywall_seen_at: new Date().toISOString() },
      localExtra: { current_step: 'paywall' },
    });
    analytics.track('paywall_seen');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finalize = async (choice: PaywallChoice) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await patch.mutateAsync({
        patch: { paywall_choice: choice },
        localExtra: { current_step: 'paywall' },
      });
      if (choice === 'dismissed') {
        analytics.track('paywall_dismissed', { choice });
      } else {
        analytics.track('paywall_chosen', { choice });
      }
      router.replace('/onboarding/signup');
    } finally {
      setSubmitting(false);
    }
  };

  const onPurchase = () => void finalize(selected);
  const onClose = () => setExitVisible(true);
  const onExitAccept = () => {
    setExitVisible(false);
    void finalize('special_offer');
  };
  const onExitDismiss = () => {
    setExitVisible(false);
    void finalize('dismissed');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }} className="bg-background">
      {/* Top bar with X */}
      <View className="flex-row items-center px-4 pt-2 pb-2">
        <Pressable
          onPress={onClose}
          hitSlop={12}
          className="active:opacity-60"
        >
          <X size={22} color="#9ca3af" />
        </Pressable>
        <View className="flex-1" />
      </View>

      <Animated.ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 24,
          gap: 14,
        }}
      >
        <View className="items-center">
          <Animated.View entering={FadeIn.duration(220)}>
            <Mascot pose="cheering" size={120} />
          </Animated.View>
        </View>

        <Text className="text-foreground font-black text-3xl text-center">
          {t('onboarding.paywall.title')}
        </Text>
        <Text className="text-muted-foreground font-medium text-base text-center">
          {t('onboarding.paywall.subtitle')}
        </Text>

        {/* Features */}
        <View className="gap-2 mt-2">
          {FEATURES.map((f, i) => (
            <Animated.View
              key={i}
              entering={FadeInUp.duration(220).delay(120 + i * 70)}
              className="flex-row items-center gap-3"
            >
              <View className="w-6 h-6 rounded-full bg-primary/15 items-center justify-center">
                <Check size={14} color="#22c55e" strokeWidth={3} />
              </View>
              <Text className="flex-1 text-foreground font-bold text-sm">
                {f}
              </Text>
            </Animated.View>
          ))}
        </View>

        {/* SKUs */}
        <View className="gap-3 mt-3">
          <PaywallCard
            title={t('onboarding.paywall.sku.annual_title')}
            badge={t('onboarding.paywall.sku.annual_badge')}
            monthlyPrice="$8.25"
            totalPrice="$99.00"
            saving={t('onboarding.paywall.sku.annual_saving')}
            selected={selected === 'annual'}
            onPress={() => setSelected('annual')}
          />
          <PaywallCard
            title={t('onboarding.paywall.sku.monthly_title')}
            monthlyPrice="$9.99"
            totalPrice="$9.99"
            selected={selected === 'monthly'}
            onPress={() => setSelected('monthly')}
          />
        </View>
      </Animated.ScrollView>

      {/* Sticky CTA */}
      <View className="px-4 pb-3 pt-2 gap-1 bg-background border-t border-border/40">
        <Pressable
          onPress={onPurchase}
          disabled={submitting}
          className={`rounded-2xl py-4 items-center ${
            submitting ? 'bg-muted opacity-60' : 'bg-primary active:opacity-80'
          }`}
        >
          <Text className="text-primary-foreground font-black text-base">
            {t('onboarding.paywall.cta')}
          </Text>
        </Pressable>
        <Text className="text-muted-foreground font-medium text-xs text-center">
          {t('onboarding.paywall.cta_note')}
        </Text>
      </View>

      <ExitIntentSheet
        visible={exitVisible}
        onAcceptOffer={onExitAccept}
        onDismiss={onExitDismiss}
      />
    </SafeAreaView>
  );
}
