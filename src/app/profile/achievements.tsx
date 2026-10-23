import { ProfileTabs, ProfileQueryError } from '@/components/profile/profile-ui';
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAchievements, useMyAchievements } from '@/hooks/use-achievements';
import { AchievementCard } from '@/components/gamification';
import type { UserAchievement } from '@/types/api';

const CATEGORIES = ['all', 'learning', 'streak', 'xp', 'special'] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_LABEL: Record<Category, string> = {
  all: 'ach.cat_all',
  learning: 'ach.cat_learning',
  streak: 'ach.cat_streak',
  xp: 'xp',
  special: 'ach.cat_special',
};

export default function AchievementsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<Category>('all');
  const all = useAchievements(category === 'all' ? undefined : { category });
  const mine = useMyAchievements();

  const ownedMap = useMemo(() => {
    const m = new Map<string, UserAchievement>();
    mine.data?.achievements?.forEach((ua) => {
      if (ua.achievement?.id) m.set(ua.achievement.id, ua);
    });
    return m;
  }, [mine.data]);

  const items = all.data?.achievements ?? [];
  const unlocked = items.filter((a) => ownedMap.has(a.id));
  const locked = items.filter((a) => !ownedMap.has(a.id));
  const isLoading = all.isLoading || mine.isLoading;

  return (
    <View className="flex-1">
      <Stack.Screen options={{ title: t('profile.ach_title') }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="w-full max-w-[600px] self-center p-4 gap-4"
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
      >
        <ProfileTabs tabs={CATEGORIES.map(c => ({ key: c, label: c === 'xp' ? 'XP' : t(CATEGORY_LABEL[c]) }))} active={category} onChange={c => setCategory(c as Category)} />

        {all.isError || mine.isError ? <ProfileQueryError onRetry={() => { void all.refetch(); void mine.refetch(); }} /> : isLoading ? (
          <ActivityIndicator color="#1AB3FF" className="mt-[12px]" />
        ) : (
          <>
            {unlocked.length > 0 && (
              <Section title={t('ach.unlocked', { count: unlocked.length })}>
                {unlocked.map((a) => (
                  <View key={a.id} className="w-[48%]">
                    <AchievementCard achievement={a} user={ownedMap.get(a.id)} />
                  </View>
                ))}
              </Section>
            )}
            {locked.length > 0 && (
              <Section title={t('ach.locked', { count: locked.length })}>
                {locked.map((a) => (
                  <View key={a.id} className="w-[48%]">
                    <AchievementCard achievement={a} />
                  </View>
                ))}
              </Section>
            )}
            {items.length === 0 && (
              <Text className="text-mieo-body font-nunito-semibold text-center py-[32px]">{t('ach.empty')}</Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-[12px]">
      <Text className="text-mieo-body font-nunito-black uppercase tracking-[1.5px] text-[12px]">{title}</Text>
      <View className="flex-row flex-wrap gap-[8px]">{children}</View>
    </View>
  );
}
