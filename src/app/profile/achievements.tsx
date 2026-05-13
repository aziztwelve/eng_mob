import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useAchievements, useMyAchievements } from '@/hooks/use-achievements';
import { AchievementCard } from '@/components/gamification';
import type { UserAchievement } from '@/types/api';

const CATEGORIES = ['all', 'learning', 'streak', 'xp', 'special'] as const;
type Category = (typeof CATEGORIES)[number];

export default function AchievementsScreen() {
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
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Достижения' }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="flex-row flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              className={`rounded-full px-4 py-2 border-2 ${category === c ? 'bg-primary border-primary' : 'bg-card border-border'}`}
            >
              <Text
                className={`font-bold capitalize ${category === c ? 'text-primary-foreground' : 'text-foreground'}`}
              >
                {c}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator color="#22c55e" />
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
              <Text className="text-muted-foreground font-medium text-center py-8">
                Достижений пока нет.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="text-muted-foreground font-black uppercase tracking-widest text-xs">
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}
