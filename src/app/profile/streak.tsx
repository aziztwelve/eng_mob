import React from 'react';
import { Alert, View, Text, ScrollView, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { Snowflake } from 'lucide-react-native';
import { useUserStats } from '@/hooks/use-user-stats';
import { useUseFreeze } from '@/hooks/use-streak';
import { StreakCalendar } from '@/components/gamification';

export default function StreakScreen() {
  const { data: stats } = useUserStats();
  const useFreeze = useUseFreeze();

  const onFreeze = () => {
    Alert.alert(
      'Streak freeze',
      'Активировать streak freeze? Будет потрачен 1 freeze.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Активировать', onPress: () => useFreeze.mutate() },
      ]
    );
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Streak' }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="flex-row justify-between items-center">
          <Text className="text-3xl font-black text-foreground">🔥 Streak</Text>
          <Pressable
            onPress={onFreeze}
            disabled={!stats || stats.streak_freezes <= 0 || useFreeze.isPending}
            className={`flex-row items-center gap-2 rounded-2xl px-5 py-3 ${stats?.streak_freezes ? 'bg-cyan-500' : 'bg-muted'}`}
          >
            <Snowflake size={16} color="#fff" />
            <Text className="text-white font-black">Freeze · {stats?.streak_freezes ?? 0}</Text>
          </Pressable>
        </View>

        <View className="bg-card rounded-3xl border-4 border-border p-4 flex-row justify-around">
          <Stat label="Current" value={stats?.current_streak ?? 0} />
          <Stat label="Max" value={stats?.max_streak ?? 0} />
          <Stat label="Freezes" value={stats?.streak_freezes ?? 0} />
        </View>

        <View className="bg-card rounded-3xl border-4 border-border p-4 gap-3">
          <Text className="text-foreground font-black text-lg">Последние 30 дней</Text>
          <StreakCalendar days={30} />
          <View className="flex-row gap-3 mt-2">
            <Legend color="bg-emerald-500" label="completed" />
            <Legend color="bg-cyan-500" label="freeze" />
            <Legend color="bg-muted" label="missed" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="items-center">
      <Text className="text-foreground font-black text-2xl">{value}</Text>
      <Text className="text-muted-foreground text-xs uppercase">{label}</Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className={`w-3 h-3 rounded ${color}`} />
      <Text className="text-muted-foreground text-xs font-medium">{label}</Text>
    </View>
  );
}
