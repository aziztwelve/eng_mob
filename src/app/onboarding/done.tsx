import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { CheckCircle2, Sparkles, Target, Flame } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import {
  useCompleteOnboarding,
  useOnboardingState,
} from '@/hooks/use-onboarding';
import { fx } from '@/lib/fx';

const TOTAL = 12;

/**
 * Финальный экран onboarding'а.
 *
 * - Показываем summary выбранных параметров (язык / уровень / цель).
 * - Празднуем — большой ✓ + spring анимация + success haptic + chime.
 * - По Continue: markOnboardingComplete() → router.replace('/(tabs)').
 *   replace, чтобы юзер не мог вернуться gesture-back'ом в /onboarding/*.
 */
export default function OnboardingDoneScreen() {
  const { t } = useTranslation();
  const state = useOnboardingState();
  const complete = useCompleteOnboarding();
  const celebrated = useRef(false);

  // Spring-in для иконки ✓.
  const scale = useSharedValue(0);
  const rotate = useSharedValue(-20);

  useEffect(() => {
    scale.value = withDelay(
      120,
      withSequence(
        withSpring(1.15, { damping: 8, stiffness: 140 }),
        withSpring(1, { damping: 10, stiffness: 120 }),
      ),
    );
    rotate.value = withDelay(
      120,
      withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) }),
    );
    if (!celebrated.current) {
      celebrated.current = true;
      // Имитируем success — переиспользуем daily-goal chime + haptic.
      void fx.onDailyGoal();
    }
  }, [scale, rotate]);

  const animatedIcon = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const summary = useMemo(() => {
    const s = state.data;
    const dash = t('onboarding.done.value_dash');
    return [
      {
        icon: <Sparkles size={18} color="#a855f7" />,
        label: t('onboarding.done.plan_lang'),
        value: s?.target_language?.toUpperCase() ?? dash,
      },
      {
        icon: <Flame size={18} color="#f97316" />,
        label: t('onboarding.done.plan_level'),
        value: levelLabel(t, s?.level),
      },
      {
        icon: <Target size={18} color="#f59e0b" />,
        label: t('onboarding.done.plan_goal_xp'),
        value: s?.daily_goal_xp ? t('onboarding.done.xp_suffix', { xp: s.daily_goal_xp }) : dash,
      },
    ];
  }, [state.data, t]);

  const handleContinue = async () => {
    try {
      await complete.mutateAsync();
      // Option B: регистрация обязательна — финальный шаг онбординга ведёт
      // на signup (claim гостя). В основной app пускает только guard в
      // (tabs)/_layout после успешной регистрации.
      router.replace('/onboarding/signup');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('onboarding.done.toast_failed'),
        text2: err instanceof Error ? err.message : '',
      });
    }
  };

  return (
    <OnboardingShell
      trackKey="done"
      step={12}
      total={TOTAL}
      showBack={false}
      title={t('onboarding.done.title')}
      subtitle={t('onboarding.done.subtitle')}
      onContinue={handleContinue}
      continueLabel={t('onboarding.done.continue_label')}
      continueLoading={complete.isPending}
    >
      <View className="items-center py-6">
        <Animated.View style={animatedIcon}>
          <View className="w-28 h-28 rounded-full bg-primary/20 items-center justify-center">
            <CheckCircle2 size={84} color="#00FFA3" strokeWidth={2.5} />
          </View>
        </Animated.View>
      </View>

      <View className="bg-card rounded-3xl border-4 border-border p-5 gap-3">
        <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
          {t('onboarding.done.plan_title')}
        </Text>
        {summary.map((row) => (
          <View
            key={row.label}
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-2">
              {row.icon}
              <Text className="text-foreground font-bold text-sm">
                {row.label}
              </Text>
            </View>
            <Text className="text-foreground font-black text-base">
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      <Text className="text-muted-foreground font-medium text-xs text-center mt-3">
        {t('onboarding.done.footer_note')}
      </Text>
    </OnboardingShell>
  );
}

function levelLabel(
  t: (key: string) => string,
  level: string | null | undefined,
): string {
  switch (level) {
    case 'beginner':
      return t('onboarding.done.level.beginner');
    case 'a1':
      return t('onboarding.done.level.a1');
    case 'a2':
      return t('onboarding.done.level.a2');
    case 'b1':
      return t('onboarding.done.level.b1');
    case 'b2':
      return t('onboarding.done.level.b2');
    case 'just_for_fun':
      return t('onboarding.done.level.just_for_fun');
    default:
      return t('onboarding.done.level.unknown');
  }
}
