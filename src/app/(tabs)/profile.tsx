import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Image, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Award, Flame, Gem, Heart, Settings, Zap } from 'lucide-react-native';
import { useCurrentUser } from '@/hooks/use-auth';
import { useUserStats } from '@/hooks/use-user-stats';
import { useMyAchievements, useAchievements } from '@/hooks/use-achievements';
import { useMistakes } from '@/hooks/use-srs';
import { useOnboardingState } from '@/hooks/use-onboarding';
import { languageNameForUi, type UiLanguage } from '@/lib/supported-languages';

// Hero: top part of the Figma "Profile" frame (mascot + clouds), exported from 304:2746.
const heroImage = require('../../../assets/figma/screens/Light__Profile__Profile__304-2746.png');
const HERO_W = 375;
const HERO_H = 1169;
const HERO_CROP = 245;
// Figma status bar (9:41) baked into the export; hidden by the crop.
const STATUS_BAR = 50;

/** Двухбуквенный код UI-локали, поддерживаемый приложением. */
function uiLang(code?: string): UiLanguage {
  const c = (code ?? 'ru').slice(0, 2).toLowerCase();
  return c === 'en' || c === 'kk' ? (c as UiLanguage) : 'ru';
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 375);
  const heroScale = contentWidth / HERO_W;

  const { data: user } = useCurrentUser();
  const { data: stats } = useUserStats();
  const { data: onboarding } = useOnboardingState();
  const mine = useMyAchievements();
  const all = useAchievements();
  const mistakes = useMistakes({ resolved: 'unresolved', limit: 1 });

  const ui = uiLang(i18n.language);
  const course = onboarding?.target_language ? languageNameForUi(onboarding.target_language, ui) : '';
  const displayName = user?.name || user?.username || t('profile.student');
  const mistakeCount = mistakes.data?.total ?? mistakes.data?.mistakes?.length ?? 0;

  const achievements = useMemo(() => {
    const unlocked = (mine.data?.achievements ?? []).map((ua) => ({ id: ua.achievement.id, title: ua.achievement.title, locked: false }));
    const unlockedIds = new Set(unlocked.map((u) => u.id));
    const locked = (all.data?.achievements ?? [])
      .filter((a) => !unlockedIds.has(a.id))
      .map((a) => ({ id: a.id, title: a.title, locked: true }));
    return [...unlocked, ...locked].slice(0, 6);
  }, [mine.data, all.data]);

  const statTiles = [
    { key: 'xp', icon: Zap, color: '#FFB020', value: stats?.total_xp ?? 0, label: t('profile.total_xp') },
    { key: 'streak', icon: Flame, color: '#FF7A3D', value: stats?.current_streak ?? 0, label: t('profile.day_streak') },
    { key: 'gems', icon: Gem, color: '#36B6FF', value: stats?.gems ?? 0, label: t('profile.gems') },
    { key: 'hearts', icon: Heart, color: '#FF4B7E', value: stats?.hearts ?? 0, label: t('profile.hearts') },
  ];

  return (
    <View className="flex-1 bg-mieo-bg">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 + insets.bottom, alignItems: 'center' }}>
        {/* Hero */}
        <View style={{ width: contentWidth, height: HERO_CROP * heroScale, overflow: 'hidden' }}>
          <Image source={heroImage} style={{ width: contentWidth, height: HERO_H * heroScale, marginTop: -STATUS_BAR * heroScale }} resizeMode="cover" />
        </View>

        {/* Name + email */}
        <View className="items-center gap-1 px-4" style={{ width: contentWidth, marginTop: -8 }}>
          <Text className="font-nunito-extrabold text-[22px] text-center text-mieo-heading">{displayName}</Text>
          {!!user?.email && <Text className="font-nunito-medium text-sm text-mieo-body">{user.email}</Text>}
        </View>

        {/* Courses / following / followers */}
        <View className="flex-row items-start gap-6 rounded-2xl border-[1.5px] border-[#C9EDFF] bg-mieo-surface px-5 py-3 mt-3" style={{ width: contentWidth - 32 }}>
          <View className="gap-2">
            <Text className="font-nunito-medium text-sm text-mieo-body">{t('profile.courses')}</Text>
            <Text className="font-nunito-semibold text-sm text-mieo-heading">{course || '—'}</Text>
          </View>
          <View className="w-px self-stretch bg-mieo-stroke" />
          <View className="gap-2">
            <Text className="font-nunito-medium text-sm text-mieo-body">{t('profile.following')}</Text>
            <Text className="font-nunito-extrabold text-base text-mieo-heading">—</Text>
          </View>
          <View className="gap-2">
            <Text className="font-nunito-medium text-sm text-mieo-body">{t('profile.followers')}</Text>
            <Text className="font-nunito-extrabold text-base text-mieo-heading">—</Text>
          </View>
        </View>

        {/* Stat tiles */}
        <View className="flex-row flex-wrap justify-between gap-y-3 px-4 mt-4" style={{ width: contentWidth }}>
          {statTiles.map((s) => {
            const Icon = s.icon;
            return (
              <View key={s.key} className="h-[68px] w-[163px] flex-row items-center gap-3 rounded-2xl border-[1.5px] border-[#C9EDFF] bg-mieo-surface px-3">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#F5FCFF]">
                  <Icon size={20} color={s.color} />
                </View>
                <View>
                  <Text className="font-nunito-extrabold text-lg text-mieo-heading">{s.value}</Text>
                  <Text className="font-nunito-medium text-xs text-mieo-primary-full">{s.label}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Mistakes & practice */}
        <View className="gap-3 px-4 mt-5" style={{ width: contentWidth }}>
          <Text className="font-nunito-extrabold text-lg text-mieo-heading">{t('profile.mistakes_practice')}</Text>
          <Pressable onPress={() => router.push('/(tabs)/practice/mistakes' as never)} className="flex-row items-center gap-3 rounded-2xl border-[1.5px] border-[#F0A5A5] bg-mieo-surface px-4 py-3">
            <Heart size={24} color="#E26A6A" />
            <Text className="flex-1 font-nunito-extrabold text-base text-mieo-heading">{t('profile.mistakes_count', { count: mistakeCount })}</Text>
          </Pressable>
        </View>

        {/* Achievements */}
        <View className="gap-3 px-4 mt-5" style={{ width: contentWidth }}>
          <View className="flex-row items-center justify-between">
            <Text className="font-nunito-extrabold text-lg text-mieo-heading">{t('profile.achievements')}</Text>
            <Pressable onPress={() => router.push('/profile/achievements')}>
              <Text className="font-nunito-semibold text-sm text-mieo-body">{t('profile.view_all')}</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            {achievements.map((a) => (
              <View key={a.id} className={`h-[96px] w-[92px] items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-mieo-stroke bg-mieo-surface p-2 ${a.locked ? 'opacity-40' : ''}`}>
                <Award size={28} color={a.locked ? '#9AA5AD' : '#FFB020'} />
                <Text numberOfLines={2} className="text-center font-nunito-extrabold text-xs text-mieo-heading">{a.title}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Settings */}
        <View className="w-full items-center px-4 mt-5">
          <Pressable onPress={() => router.push('/profile/settings')} className="w-full min-h-[46px] flex-row items-center justify-center gap-2 rounded-2xl border-2 border-mieo-dim bg-mieo-surface px-6 py-2.5">
            <Settings size={18} color="#171A1C" />
            <Text className="font-nunito-extrabold text-base text-mieo-heading">{t('profile.settings_btn')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
