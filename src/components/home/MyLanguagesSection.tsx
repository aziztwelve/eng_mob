import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Plus, Flame } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useOnboardingState } from '@/hooks/use-onboarding';
import { useUserStats } from '@/hooks/use-user-stats';
import { getLanguage } from '@/lib/supported-languages';
import { analytics } from '@/lib/analytics';

/**
 * <MyLanguagesSection> — секция «🌍 Мои языки» на Home tab.
 *
 * MVP: одна карточка для выбранного `target_language` (single, см. spec §3.10).
 * Multi-language — Phase 6+.
 *
 * "+ Добавить язык" — открывает /onboarding/add-language (mini-flow:
 * выбор языка + level → PATCH /me/onboarding). Multi-language как
 * отдельная таблица users.user_languages — Phase 6+.
 */
export function MyLanguagesSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: state } = useOnboardingState();
  const stats = useUserStats();

  const targetLang = state?.target_language ?? null;
  const lang = targetLang ? getLanguage(targetLang) : null;
  const level = state?.level ?? null;
  const streak = stats.data?.current_streak ?? 0;

  const onAdd = () => {
    analytics.track('add_language_clicked', {
      current_language: targetLang ?? undefined,
    });
    router.push('/onboarding/add-language');
  };

  return (
    <View className="px-4 pt-5">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-foreground font-black text-xl">{t('home.my_languages.title')}</Text>
        <Pressable
          onPress={onAdd}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('home.my_languages.add_a11y_label')}
          accessibilityHint={t('home.my_languages.add_a11y_hint')}
          className="active:opacity-70 flex-row items-center gap-1"
        >
          <Plus size={16} color="#22c55e" />
          <Text className="text-primary font-bold">{t('home.my_languages.add')}</Text>
        </Pressable>
      </View>

      <View className="flex-row gap-3">
        {/* Current language card */}
        <View className="flex-1 bg-card border-2 border-border rounded-2xl p-4 gap-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-3xl">{lang?.flag ?? '🌐'}</Text>
            <Text className="text-foreground font-black text-base flex-1">
              {lang?.nameNative ?? targetLang?.toUpperCase() ?? t('home.my_languages.not_selected')}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-muted-foreground font-bold text-sm">
              {levelLabel(t, level)}
            </Text>
            {streak > 0 ? (
              <View className="flex-row items-center gap-1">
                <Text className="text-muted-foreground">·</Text>
                <Flame size={14} color="#f97316" />
                <Text className="text-foreground font-bold text-sm">{streak}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Add another */}
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={t('home.my_languages.add_more_a11y')}
          className="flex-1 bg-card border-2 border-dashed border-border rounded-2xl p-4 items-center justify-center gap-2 active:opacity-70"
        >
          <Plus size={20} color="#9ca3af" />
          <Text className="text-muted-foreground font-bold text-xs text-center">
            {t('home.my_languages.add_more_label')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function levelLabel(t: (key: string) => string, level: string | null | undefined): string {
  switch (level) {
    case 'beginner':    return t('home.my_languages.level.beginner');
    case 'a1':          return t('home.my_languages.level.a1');
    case 'a2':          return t('home.my_languages.level.a2');
    case 'b1':          return t('home.my_languages.level.b1');
    case 'b2':          return t('home.my_languages.level.b2');
    case 'just_for_fun': return t('home.my_languages.level.just_for_fun');
    default:            return t('home.my_languages.level.unknown');
  }
}
