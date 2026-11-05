import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Image, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Award, ChevronRight, Flame, Gem, Heart, Settings, Zap } from 'lucide-react-native';
import { achievementText } from '@/lib/achievement-text';
import { useAccountProfile } from '@/hooks/use-account-profile';
import { useHearts } from '@/hooks/use-hearts';
import { useFriends } from '@/hooks/use-friends';
import { ProfileQueryError } from '@/components/profile/profile-ui';
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

  const userQuery = useCurrentUser();
  const user = userQuery.data;
  const profile = useAccountProfile();
  const friends = useFriends({ limit: 1 });
  const hearts = useHearts();
  const statsQuery = useUserStats();
  const stats = statsQuery.data;
  const onboardingQuery = useOnboardingState();
  const onboarding = onboardingQuery.data;
  const mine = useMyAchievements();
  const all = useAchievements();
  const mistakes = useMistakes({ resolved: 'unresolved', limit: 1 });

  const ui = uiLang(i18n.language);
  const course = onboarding?.target_language ? languageNameForUi(onboarding.target_language, ui) : '';
  const displayName = [profile.data?.first_name, profile.data?.last_name].filter(Boolean).join(' ') || user?.name || user?.username || t('profile.student');
  const mistakeCount = mistakes.data?.total ?? mistakes.data?.mistakes?.length ?? 0;

  const achievements = useMemo(() => {
    const unlocked = (mine.data?.achievements ?? []).filter(ua => ua.achievement?.id).map((ua) => ({ id: ua.achievement.id, title: achievementText(ua.achievement, t).title, locked: false }));
    const unlockedIds = new Set(unlocked.map((u) => u.id));
    const locked = (all.data?.achievements ?? [])
      .filter((a) => !unlockedIds.has(a.id))
      .map((a) => ({ id: a.id, title: achievementText(a, t).title, locked: true }));
    return [...unlocked, ...locked].slice(0, 6);
  }, [mine.data, all.data, t]);

  const statTiles = [
    { key: 'xp', icon: Zap, color: '#FFB020', value: statsQuery.isError ? '—' : statsQuery.isLoading ? '…' : stats?.total_xp ?? 0, label: t('profile.total_xp') },
    { key: 'streak', icon: Flame, color: '#FF7A3D', value: statsQuery.isError ? '—' : statsQuery.isLoading ? '…' : stats?.current_streak ?? 0, label: t('profile.day_streak') },
    { key: 'gems', icon: Gem, color: '#36B6FF', value: statsQuery.isError ? '—' : statsQuery.isLoading ? '…' : stats?.gems ?? 0, label: t('profile.gems') },
    { key: 'hearts', icon: Heart, color: '#FF4B7E', value: hearts.isError ? '—' : hearts.isLoading ? '…' : hearts.data?.unlimited ? '∞' : hearts.data?.hearts ?? 0, label: t('profile.hearts') },
  ];

  return (
    <View className="flex-1 bg-mieo-bg">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 + insets.bottom, alignItems: 'center' }}>
        {/* Hero */}
        <View style={{ width: contentWidth, height: HERO_CROP * heroScale, overflow: 'hidden' }}>
          <Image source={heroImage} style={{ width: contentWidth, height: HERO_H * heroScale, marginTop: -STATUS_BAR * heroScale }} resizeMode="cover" />
          {!!profile.data?.avatar_url && <Image accessibilityLabel={displayName} source={{ uri: profile.data.avatar_url }} className="absolute bottom-4 h-24 w-24 rounded-full border-4 border-white" style={{ left: contentWidth / 2 - 48 }} />}
        </View>

        {/* Name + email */}
        <View className="items-center gap-1 px-4" style={{ width: contentWidth, marginTop: -8 }}>
          <Text className="font-nunito-extrabold text-[22px] text-center text-mieo-heading">{displayName}</Text>
          {!!user?.email && <Text className="font-nunito-medium text-sm text-mieo-body">{user.email}</Text>}
        </View>

        {(userQuery.isError || profile.isError || statsQuery.isError || onboardingQuery.isError || friends.isError || hearts.isError) && <View className="px-4 mt-4 w-full">
          <ProfileQueryError onRetry={() => { void userQuery.refetch(); void profile.refetch(); void statsQuery.refetch(); void onboardingQuery.refetch(); void friends.refetch(); void hearts.refetch(); }} />
        </View>}
        {/* Course and accepted friends */}
        <View className="flex-row items-start gap-6 rounded-2xl border-[1.5px] border-[#C9EDFF] bg-mieo-surface px-5 py-3 mt-3" style={{ width: contentWidth - 32 }}>
          <View className="gap-2">
            <Text className="font-nunito-medium text-sm text-mieo-body">{t('profile.courses')}</Text>
            <Text className="font-nunito-semibold text-sm text-mieo-heading">{course || '—'}</Text>
          </View>
          <View className="w-px self-stretch bg-mieo-stroke" />
          <Pressable accessibilityRole="button" onPress={() => router.push('/friends')} className="gap-2">
            <Text className="font-nunito-medium text-sm text-mieo-body">{t('profile.friends')}</Text>
            <Text className="font-nunito-extrabold text-base text-mieo-heading">{friends.isError ? '—' : friends.data?.total ?? '…'}</Text>
          </Pressable>
        </View>

        {/* Stat tiles */}
        <View className="flex-row flex-wrap justify-between gap-y-3 px-4 mt-4" style={{ width: contentWidth }}>
          {statTiles.map((s) => {
            const Icon = s.icon;
            return (
              <Pressable key={s.key} accessibilityRole={s.key === 'xp' || s.key === 'streak' ? 'button' : undefined}
                disabled={s.key !== 'xp' && s.key !== 'streak'}
                onPress={() => router.push(s.key === 'xp' ? '/profile/stats' : '/profile/streak')}
                className="h-[68px] w-[163px] flex-row items-center gap-3 rounded-2xl border-[1.5px] border-[#C9EDFF] bg-mieo-surface px-3">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#F5FCFF]">
                  <Icon size={20} color={s.color} />
                </View>
                <View>
                  <Text className="font-nunito-extrabold text-lg text-mieo-heading">{s.value}</Text>
                  <Text className="font-nunito-medium text-xs text-mieo-primary-full">{s.label}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Mistakes & practice */}
        <View className="gap-3 px-4 mt-5" style={{ width: contentWidth }}>
          <Text className="font-nunito-extrabold text-lg text-mieo-heading">{t('profile.mistakes_practice')}</Text>
          <Pressable onPress={() => router.push('/(tabs)/practice/mistakes' as never)} className="flex-row items-center gap-3 rounded-2xl border-[1.5px] border-[#F0A5A5] bg-mieo-surface px-4 py-3">
            <Heart size={24} color="#E26A6A" />
            <Text className="flex-1 font-nunito-extrabold text-base text-mieo-heading">{mistakes.isError || mistakes.isLoading ? t('profile.mistakes_practice') : t('profile.mistakes_count', { count: mistakeCount })}</Text>
          </Pressable>
        </View>

        {mistakes.isError && <View className="px-4 mt-3 w-full"><ProfileQueryError onRetry={() => { void mistakes.refetch(); }} /></View>}
        {/* Achievements */}
        <View className="gap-3 px-4 mt-5" style={{ width: contentWidth }}>
          <View className="flex-row items-center justify-between">
            <Text className="font-nunito-extrabold text-lg text-mieo-heading">{t('profile.achievements')}</Text>
            <Pressable onPress={() => router.push('/profile/achievements')}>
              <Text className="font-nunito-semibold text-sm text-mieo-body">{t('profile.view_all')}</Text>
            </Pressable>
          </View>
          {all.isError || mine.isError ? <ProfileQueryError onRetry={() => { void all.refetch(); void mine.refetch(); }} /> : all.isLoading || mine.isLoading ? <ActivityIndicator color="#1AB3FF" /> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            {achievements.map((a) => (
              <View key={a.id} className={`h-[96px] w-[92px] items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-mieo-stroke bg-mieo-surface p-2 ${a.locked ? 'opacity-40' : ''}`}>
                <Award size={28} color={a.locked ? '#9AA5AD' : '#FFB020'} />
                <Text numberOfLines={2} className="text-center font-nunito-extrabold text-xs text-mieo-heading">{a.title}</Text>
              </View>
            ))}
          </ScrollView>}
        </View>

        <View className="w-full max-w-[375px] px-4 mt-5 gap-3">
          <Text className="font-nunito-extrabold text-lg text-mieo-heading">{t('profile.more')}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/profile/subscription' as never)} className="flex-row items-center gap-3 rounded-2xl border border-[#C9EDFF] bg-mieo-surface p-4">
            <Text className="flex-1 font-nunito-bold text-base text-mieo-heading">{ui === 'ru' ? 'Подписка' : ui === 'kk' ? 'Жазылым' : 'Subscription'}</Text>
            <ChevronRight size={20} color="#5D686F" />
          </Pressable>
          {([
            ['/profile/strength', 'profile.strength'], ['/profile/notifications', 'profile.notifications'], ['/profile/lockscreen-words', 'profile.lockscreen_words'],
          ] as const).map(([href, label]) => <Pressable key={href} accessibilityRole="button" onPress={() => router.push(href)} className="flex-row items-center gap-3 rounded-2xl border border-[#C9EDFF] bg-mieo-surface p-4"><Text className="flex-1 font-nunito-bold text-base text-mieo-heading">{t(label)}</Text><ChevronRight size={20} color="#5D686F" /></Pressable>)}
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
