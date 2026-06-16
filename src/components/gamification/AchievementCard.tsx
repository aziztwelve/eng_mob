import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Award, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Achievement, UserAchievement } from '@/types/api';
import { tsToDate } from '@/lib/api-client';
import { glass, GOLD } from '@/components/sunset';

const TIER_LABEL: Record<number, string> = { 1: 'bronze', 2: 'silver', 3: 'gold' };

export interface AchievementCardProps {
  achievement: Achievement;
  user?: UserAchievement | null;
}

export function AchievementCard({ achievement: a, user }: AchievementCardProps) {
  const unlocked = !!user;
  const unlockedAt = user ? tsToDate(user.unlocked_at) : null;

  return (
    <View style={[glass, s.card, !unlocked && { opacity: 0.6 }]}>
      {unlocked ? (
        <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.icon}>
          {a.icon_url ? (
            <Image source={{ uri: a.icon_url }} style={{ width: 40, height: 40 }} resizeMode="contain" />
          ) : (
            <Award size={30} color="#5a3b00" />
          )}
        </LinearGradient>
      ) : (
        <View style={[s.icon, s.iconLocked]}>
          <Lock size={24} color="rgba(255,255,255,0.7)" />
        </View>
      )}

      <Text style={s.title} numberOfLines={2}>{a.title}</Text>
      <Text style={s.desc} numberOfLines={2}>{a.description}</Text>

      <View style={s.pills}>
        <View style={s.pill}>
          <Text style={s.pillText}>{TIER_LABEL[a.tier] ?? 'tier'}</Text>
        </View>
        <View style={s.pill}>
          <Text style={s.pillText}>{a.category}</Text>
        </View>
        {a.xp_reward > 0 && (
          <View style={[s.pill, s.pillXp]}>
            <Text style={s.pillXpText}>+{a.xp_reward} XP</Text>
          </View>
        )}
      </View>

      {unlockedAt && (
        <Text style={s.date}>{unlockedAt.toLocaleDateString()}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { flex: 1, borderRadius: 22, padding: 14, alignItems: 'center' },
  icon: { height: 60, width: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  iconLocked: { backgroundColor: 'rgba(255,255,255,0.12)' },
  title: { color: '#fff', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  desc: { color: 'rgba(255,255,255,0.68)', fontSize: 11, fontWeight: '500', textAlign: 'center', marginTop: 4, lineHeight: 15 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5, marginTop: 8 },
  pill: { borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  pillXp: { backgroundColor: 'rgba(255,216,74,0.22)', borderColor: 'rgba(255,216,74,0.5)' },
  pillXpText: { color: '#FFD84A', fontSize: 10, fontWeight: '900' },
  date: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600', marginTop: 6 },
});
