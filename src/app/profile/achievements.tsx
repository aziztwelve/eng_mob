import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAchievements, useMyAchievements } from '@/hooks/use-achievements';
import { AchievementCard } from '@/components/gamification';
import { glass, GOLD } from '@/components/sunset';
import type { UserAchievement } from '@/types/api';

const CATEGORIES = ['all', 'learning', 'streak', 'xp', 'special'] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_LABEL: Record<Category, string> = {
  all: 'Все',
  learning: 'Учёба',
  streak: 'Серия',
  xp: 'XP',
  special: 'Особые',
};

export default function AchievementsScreen() {
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
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Достижения' }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 + insets.bottom }}
      >
        <View style={s.pillRow}>
          {CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <Pressable key={c} onPress={() => setCategory(c)}>
                {active ? (
                  <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.pill}>
                    <Text style={s.pillTextActive}>{CATEGORY_LABEL[c]}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[glass, s.pill]}>
                    <Text style={s.pillText}>{CATEGORY_LABEL[c]}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {isLoading ? (
          <ActivityIndicator color="#FFD84A" style={{ marginTop: 12 }} />
        ) : (
          <>
            {unlocked.length > 0 && (
              <Section title={`Получены · ${unlocked.length}`}>
                {unlocked.map((a) => (
                  <View key={a.id} style={{ width: '48%' }}>
                    <AchievementCard achievement={a} user={ownedMap.get(a.id)} />
                  </View>
                ))}
              </Section>
            )}
            {locked.length > 0 && (
              <Section title={`Заблокированы · ${locked.length}`}>
                {locked.map((a) => (
                  <View key={a.id} style={{ width: '48%' }}>
                    <AchievementCard achievement={a} />
                  </View>
                ))}
              </Section>
            )}
            {items.length === 0 && (
              <Text style={s.empty}>Достижений пока нет.</Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.grid}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  pillText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  pillTextActive: { color: '#5a3b00', fontWeight: '900', fontSize: 13 },

  sectionTitle: { color: 'rgba(255,255,255,0.78)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  empty: { color: 'rgba(255,255,255,0.72)', fontWeight: '600', textAlign: 'center', paddingVertical: 32 },
});
