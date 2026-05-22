import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useLogout, useCurrentUser } from '@/hooks/use-auth';
import { useUserStats } from '@/hooks/use-user-stats';
import { useMyAchievements } from '@/hooks/use-achievements';
import {
  AchievementCard,
  DailyGoalRing,
  HeartCounter,
  LevelBadge,
  StreakBadge,
  XPBar,
} from '@/components/gamification';
import { tsToDate } from '@/lib/api-client';

export default function ProfileScreen() {
  const router = useRouter();
  const logout = useLogout();
  const { data: user } = useCurrentUser();
  const { data: stats } = useUserStats();
  const mine = useMyAchievements();

  const recent = useMemo(() => {
    return (mine.data?.achievements ?? [])
      .slice()
      .sort((a, b) => {
        const da = tsToDate(a.unlocked_at)?.getTime() ?? 0;
        const db = tsToDate(b.unlocked_at)?.getTime() ?? 0;
        return db - da;
      })
      .slice(0, 4);
  }, [mine.data]);

  const handleLogout = () => logout.mutate();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="bg-card border-b-2 border-border px-4 pt-6 pb-6">
        <Text className="text-3xl font-black text-primary mb-2">Profile</Text>
      </View>

      <View className="p-4 gap-4">
        {/* User card */}
        <View className="bg-card rounded-3xl p-6 border-4 border-border items-center">
          <View className="bg-primary rounded-full w-20 h-20 items-center justify-center mb-3">
            <Text className="text-4xl">👤</Text>
          </View>
          <Text className="text-2xl font-black text-foreground mb-0.5">
            {user?.username || 'User'}
          </Text>
          <Text className="text-muted-foreground mb-3">
            {user?.email || 'email@example.com'}
          </Text>
          <LevelBadge size="lg" />
        </View>

        {/* Quick stats */}
        <View className="bg-card rounded-3xl p-4 border-4 border-border flex-row justify-between">
          <Stat label="Level" value={stats?.level ?? '—'} color="text-amber-500" />
          <Stat label="XP" value={stats?.total_xp ?? 0} color="text-amber-500" />
          <Stat label="Streak" value={stats?.current_streak ?? 0} color="text-orange-500" />
          <Stat
            label="Hearts"
            value={`${stats?.hearts ?? 0}/${stats?.max_hearts ?? 0}`}
            color="text-red-500"
          />
        </View>

        {/* Daily goal & XP bar */}
        <View className="bg-card rounded-3xl p-4 border-4 border-border flex-row items-center gap-4">
          <DailyGoalRing size={100} />
          <View className="flex-1 gap-3">
            <Text className="text-foreground font-black text-base">Дневная цель</Text>
            <XPBar />
            <View className="flex-row gap-3">
              <StreakBadge size="md" />
              <HeartCounter />
            </View>
          </View>
        </View>

        {/* Recent achievements */}
        <View className="bg-card rounded-3xl p-4 border-4 border-border gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-foreground font-black text-base">Достижения</Text>
            <Pressable
              onPress={() => router.push('/profile/achievements')}
              className="rounded-xl bg-muted px-3 py-1.5"
            >
              <Text className="text-foreground font-bold text-xs">Все →</Text>
            </Pressable>
          </View>
          {recent.length === 0 ? (
            <Text className="text-muted-foreground font-medium">
              {mine.isLoading ? '…' : 'Пока ни одного достижения.'}
            </Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {recent.map((ua) => (
                <View key={ua.achievement.id} style={{ width: '48%' }}>
                  <AchievementCard achievement={ua.achievement} user={ua} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick links */}
        <View className="gap-2">
          <NavRow
            emoji="📊"
            label="Статистика"
            onPress={() => router.push('/profile/stats')}
          />
          <NavRow
            emoji="🔥"
            label="Streak"
            onPress={() => router.push('/profile/streak')}
          />
          <NavRow
            emoji="🏆"
            label="Достижения"
            onPress={() => router.push('/profile/achievements')}
          />
          <NavRow
            emoji="💪"
            label="Сила навыков"
            onPress={() => router.push('/profile/strength')}
          />
          <NavRow
            emoji="🏆"
            label="Лиги"
            onPress={() => router.push('/leagues')}
          />
          <NavRow
            emoji="👥"
            label="Друзья"
            onPress={() => router.push('/friends')}
          />
          <NavRow
            emoji="🤖"
            label="AI помощник"
            onPress={() => router.push('/ai')}
          />
          <NavRow
            emoji="🔔"
            label="Уведомления"
            onPress={() => router.push('/profile/notifications')}
          />
          <NavRow
            emoji="⚙️"
            label="Настройки"
            onPress={() => router.push('/profile/settings')}
          />
        </View>

        <Pressable
          onPress={handleLogout}
          disabled={logout.isPending}
          className="bg-destructive rounded-3xl py-4 border-4 border-red-600 mt-4"
        >
          <Text className="text-center text-white font-black text-lg uppercase tracking-wide">
            {logout.isPending ? 'Logging out...' : 'Logout'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <View className="items-center">
      <Text className={`text-xl font-black ${color}`}>{value}</Text>
      <Text className="text-muted-foreground text-xs uppercase">{label}</Text>
    </View>
  );
}

function NavRow({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-card rounded-2xl p-4 border-2 border-border flex-row items-center justify-between active:scale-95"
    >
      <View className="flex-row items-center">
        <Text className="text-2xl mr-3">{emoji}</Text>
        <Text className="text-foreground font-black">{label}</Text>
      </View>
      <Text className="text-muted-foreground">→</Text>
    </Pressable>
  );
}
