import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Globe } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { CollapsibleOptions } from '@/components/onboarding/CollapsibleOptions';
import { useOnboardingState, usePatchOnboardingV3 } from '@/hooks/use-onboarding';
import { analytics } from '@/lib/analytics';
import { getCurrentLang } from '@/lib/i18n';
import {
  PRIMARY_LANGUAGES,
  type LanguageCode,
  type SupportedLanguage,
} from '@/lib/supported-languages';
import type { ProficiencyLevelProto } from '@/types/api';

/**
 * /onboarding/add-language — мини-flow «добавить / переключить язык» с Home tab.
 *
 * MVP (см. spec §3.10): держим single `target_language`, поэтому экран
 * фактически *переключает* основной язык. После Phase 6 (multi-language)
 * сюда же подцепится таблица users.user_languages.
 *
 * 2 стадии в одном route:
 *   1. pick language  (grid из supported-languages, исключая текущий)
 *   2. pick level     (CollapsibleOptions, такие же опции как /onboarding/level
 *                      минус `placement_test` — placement здесь не нужен,
 *                      юзер уже знает себя)
 *
 * Финал: PATCH /me/onboarding { target_language, proficiency_level } →
 *        Toast «Язык переключён» → router.back() в Home.
 */

const LEVEL_ORDER: ProficiencyLevelProto[] = [
  'beginner', 'a1', 'a2', 'b1', 'b2', 'just_for_fun',
];
const LEVEL_EMOJI: Record<ProficiencyLevelProto, string> = {
  beginner: '🌱', a1: '🌿', a2: '🌳', b1: '🌲', b2: '🏔️', just_for_fun: '🎈',
};

export default function AddLanguageScreen() {
  const { t } = useTranslation();
  const uiLang = getCurrentLang();
  const { data: state } = useOnboardingState();
  const patch = usePatchOnboardingV3();

  const currentLang = state?.target_language ?? null;

  const [stage, setStage] = useState<'language' | 'level'>('language');
  const [picked, setPicked] = useState<LanguageCode | null>(null);
  const [level, setLevel] = useState<ProficiencyLevelProto | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Все языки кроме текущего (его незачем «добавлять»).
  const grid = useMemo(
    () => PRIMARY_LANGUAGES.filter((l) => l.code !== currentLang),
    [currentLang],
  );

  const levelOptions = useMemo(
    () =>
      LEVEL_ORDER.map((v) => ({
        value: v,
        emoji: LEVEL_EMOJI[v],
        title: t(`onboarding.level.options.${v}.title` as const),
        subtitle: t(`onboarding.level.options.${v}.subtitle` as const),
      })),
    [t],
  );

  function handleBack() {
    if (stage === 'level') {
      setStage('language');
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  function handlePickLanguage(code: LanguageCode) {
    setPicked(code);
    analytics.track('add_language_picked', { code });
    setStage('level');
  }

  async function handleSubmit() {
    if (!picked || !level || submitting) return;
    setSubmitting(true);
    try {
      await patch.mutateAsync({
        patch: {
          target_language: picked,
          proficiency_level: level,
        },
        localExtra: { current_step: 'add_language_done' },
      });
      analytics.track('add_language_completed', {
        code: picked,
        level,
        previous: currentLang ?? undefined,
      });
      Toast.show({
        type: 'success',
        text1: t('add_language.success_title'),
        text2: t('add_language.success_body'),
        visibilityTime: 2200,
      });
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    } finally {
      setSubmitting(false);
    }
  }

  const ctaDisabled =
    submitting || (stage === 'language' ? !picked : !level);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }} className="bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 gap-3 border-b border-border/40">
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('add_language.back_a11y')}
          className="active:opacity-60"
        >
          <ArrowLeft size={24} color="#e5e7eb" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-foreground font-black text-lg">
            {t('add_language.title')}
          </Text>
          <Text className="text-muted-foreground text-xs">
            {stage === 'language'
              ? t('add_language.stage_language_caption')
              : t('add_language.stage_level_caption')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {stage === 'language' ? (
          <>
            <View className="flex-row items-center gap-2 mb-3">
              <Globe size={18} color="#00FFA3" />
              <Text className="text-foreground font-black text-lg">
                {t('add_language.pick_language_title')}
              </Text>
            </View>
            <Text className="text-muted-foreground text-sm mb-4">
              {t('add_language.pick_language_subtitle')}
            </Text>

            <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
              {grid.map((lang) => (
                <LanguageCell
                  key={lang.code}
                  lang={lang}
                  uiLang={uiLang}
                  selected={picked === lang.code}
                  onPress={() => handlePickLanguage(lang.code)}
                />
              ))}
            </View>
          </>
        ) : (
          <>
            <Text className="text-foreground font-black text-2xl mb-1">
              {t('add_language.pick_level_title')}
            </Text>
            <Text className="text-muted-foreground text-sm mb-5">
              {t('add_language.pick_level_subtitle', {
                language: pickedLanguageName(picked, uiLang),
              })}
            </Text>
            <CollapsibleOptions
              options={levelOptions}
              value={level}
              onChange={(v) => setLevel(v as ProficiencyLevelProto)}
            />
          </>
        )}
      </ScrollView>

      {/* Sticky footer (показываем только на стадии level — на language
          переход автоматический после tap'а по карточке). */}
      {stage === 'level' ? (
        <View className="px-4 py-3 gap-2 bg-background border-t border-border/40">
          <Pressable
            onPress={() => void handleSubmit()}
            disabled={ctaDisabled}
            className={`rounded-2xl py-4 items-center ${
              !ctaDisabled ? 'bg-primary active:opacity-80' : 'bg-muted opacity-60'
            }`}
          >
            <Text className="text-primary-foreground font-black text-base">
              {submitting ? t('add_language.cta_submitting') : t('add_language.cta_done')}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------

function pickedLanguageName(code: LanguageCode | null, uiLang: 'ru' | 'en' | 'kk'): string {
  if (!code) return '';
  const lang = PRIMARY_LANGUAGES.find((l) => l.code === code);
  return lang?.nameI18n[uiLang] ?? code.toUpperCase();
}

function LanguageCell({
  lang,
  uiLang,
  selected,
  onPress,
}: {
  lang: SupportedLanguage;
  uiLang: 'ru' | 'en' | 'kk';
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <View style={{ width: '33.333%', padding: 4 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        className={`rounded-2xl border-4 px-2 py-3 items-center ${
          selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
        } active:opacity-80`}
      >
        <Text style={{ fontSize: 32 }}>{lang.flag}</Text>
        <Text
          className={`font-black text-xs mt-1 ${selected ? 'text-primary' : 'text-foreground'}`}
          numberOfLines={1}
        >
          {lang.nameI18n[uiLang]}
        </Text>
      </Pressable>
    </View>
  );
}
