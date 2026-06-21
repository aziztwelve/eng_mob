import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, StatusBar } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line } from 'react-native-svg';
import { Avatar } from '@/components/ui/avatar';
import { useMyLeaderboard, useMyLeague } from '@/hooks/use-leagues';
import { useFriends, useFriendsLeaderboard } from '@/hooks/use-friends';
import { tsToDate } from '@/lib/api-client';
import { neon, neonStyles } from '@/components/neon-screen';
import { glass, SunsetHeader, SunsetTabs, CTA } from '@/components/sunset';

function PromoLine() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4, paddingHorizontal: 8, position: 'relative', height: 20 }}>
      <Svg height="2" style={{ flex: 1 }}>
        <Line x1="0" y1="1" x2="100%" y2="1" stroke={neon.primary} strokeWidth="2" strokeDasharray="10,8" />
      </Svg>
      <View style={{
        backgroundColor: neon.primary, borderRadius: 6,
        paddingHorizontal: 7, paddingVertical: 2, marginLeft: 6,
        shadowColor: neon.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 12,
      }}>
        <Text style={{ color: neon.ink, fontSize: 10, fontWeight: '900' }}>ЗОНА ПОВЫШЕНИЯ</Text>
      </View>
    </View>
  );
}

const S = {
  surface: neonStyles.surface,
} as const;

type Tab = 'leagues' | 'friends' | 'leaderboard';

export default function SocialScreen() {
  const [tab, setTab] = useState<Tab>('leagues');

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      <View style={{ paddingHorizontal: 20, paddingTop: 6 }}>
        <SunsetHeader title="Лиги" />
        <SunsetTabs
          tabs={[
            { key: 'leagues', label: '👑 Лиги' },
            { key: 'friends', label: '👥 Друзья' },
            { key: 'leaderboard', label: '📊 Топ' },
          ]}
          active={tab}
          onChange={(k) => setTab(k as Tab)}
        />
      </View>
      <View style={{ height: 10 }} />

      {tab === 'leagues' && <LeaguesView />}
      {tab === 'friends' && <FriendsView />}
      {tab === 'leaderboard' && <LeaderboardView />}
    </View>
  );
}

function LeaguesView() {
  const router = useRouter();
  const myLeague = useMyLeague();
  const board = useMyLeaderboard();

  const league = board.data?.league ?? myLeague.data?.user_league.league;
  const entries = board.data?.entries ?? [];
  const myRank = board.data?.my_rank ?? myLeague.data?.user_league.rank_in_cohort ?? 0;
  const myXp = board.data?.my_weekly_xp ?? myLeague.data?.user_league.weekly_xp ?? 0;
  const cycleEnd = board.data?.cycle_end_at ?? myLeague.data?.cycle_end_at;
  const daysLeft = cycleEnd ? Math.max(0, Math.ceil((tsToDate(cycleEnd)!.getTime() - Date.now()) / 86400000)) : null;

  if (myLeague.isLoading || board.isLoading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#FFD84A" /></View>;
  }

  const PROMO_RANK = 10; // top 10 promote

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 84 }}>
      {/* League hero */}
      <View style={[glass, {
        borderRadius: 20, padding: 16, alignItems: 'center', marginBottom: 12,
      }]}>
        <Text style={{ fontSize: 44 }}>🥇</Text>
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20, marginTop: 4 }}>
          {league?.name ?? 'Золотая лига'}
        </Text>
        {daysLeft !== null && (
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', marginTop: 2 }}>
            Осталось {daysLeft} {daysLeft === 1 ? 'день' : 'дней'} · топ-10 проходят дальше
          </Text>
        )}
        <View style={{ flexDirection: 'row', gap: 34, marginTop: 14 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#FFD84A', fontWeight: '900', fontSize: 22 }}>#{myRank || '—'}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>Ранг</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: neon.xp, fontWeight: '900', fontSize: 22 }}>{myXp}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>XP</Text>
          </View>
        </View>
      </View>

      {/* Leaderboard table */}
      <View style={[glass, { borderRadius: 20, padding: 8, marginBottom: 14 }]}>
        {entries.slice(0, 11).map((e, idx) => {
          const rank = idx + 1;
          const isMe = e.is_me;
          const isPromoLine = rank === PROMO_RANK + 1 && entries.length > PROMO_RANK;

          return (
            <React.Fragment key={e.user_id ?? idx}>
              {isPromoLine && <PromoLine />}
              <View style={[{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 8, paddingVertical: 10, borderRadius: 12,
                gap: 10,
              }, isMe && { backgroundColor: neon.greenHero, borderWidth: 1, borderColor: neon.greenHeroBorder }]}>
                <Text style={{ color: '#fff', fontWeight: '900', width: 28, fontSize: 14 }}>
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                </Text>
                <Avatar uri={e.avatar_url} name={e.full_name} size={32} />
                <Text style={{ flex: 1, color: '#fff', fontWeight: isMe ? '900' : '700', fontSize: 14 }} numberOfLines={1}>
                  {e.full_name || `User ${(e.user_id ?? '').slice(0, 6)}`}
                  {isMe ? ' (Ты)' : ''}
                </Text>
                <Text style={{ color: '#FFD54F', fontWeight: '900', fontSize: 14 }}>
                  {(e.weekly_xp ?? 0)} XP
                </Text>
              </View>
            </React.Fragment>
          );
        })}

        {entries.length > 0 && entries.length <= PROMO_RANK && <PromoLine />}
      </View>

      <Pressable
        onPress={() => router.push('/leagues')}
        style={{ borderRadius: 16, overflow: 'hidden', shadowColor: '#A8243F', shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }}
      >
        <LinearGradient
          colors={CTA}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: '100%', paddingVertical: 15, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 0.3 }}>
            Открыть лигу полностью →
          </Text>
        </LinearGradient>
      </Pressable>
    </ScrollView>
  );
}

function FriendsView() {
  const router = useRouter();
  const friends = useFriends();
  const list = friends.data?.friends ?? [];

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 84 }}>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        <Pressable
          onPress={() => router.push('/friends/search')}
          style={[glass, { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center' }]}
        >
          <Text style={{ fontSize: 24 }}>🔍</Text>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13, marginTop: 4 }}>Найти</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/friends/pending')}
          style={[glass, { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center' }]}
        >
          <Text style={{ fontSize: 24 }}>📩</Text>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13, marginTop: 4 }}>Заявки</Text>
        </Pressable>
      </View>

      {friends.isLoading ? (
        <ActivityIndicator color="#FFD84A" />
      ) : list.length === 0 ? (
        <View style={[glass, { borderRadius: 20, padding: 32, alignItems: 'center' }]}>
          <Text style={{ fontSize: 48 }}>🦉</Text>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '700', textAlign: 'center', marginTop: 12 }}>
            Пока нет друзей.{'\n'}Найди первых!
          </Text>
        </View>
      ) : (
        <View style={[glass, { borderRadius: 20, padding: 8 }]}>
          {list.map((f) => (
            <View key={f.friendship_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12 }}>
              <Avatar uri={f.avatar_url} name={f.full_name} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>{f.full_name}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' }}>@{f.username}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function LeaderboardView() {
  const router = useRouter();
  const lb = useFriendsLeaderboard(10);
  const entries = lb.data?.entries ?? [];

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 84 }}>
      <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '600', marginBottom: 14 }}>
        Друзья по XP за эту неделю
      </Text>
      {lb.isLoading ? (
        <ActivityIndicator color="#FFD84A" />
      ) : entries.length === 0 ? (
        <View style={[glass, { borderRadius: 20, padding: 32, alignItems: 'center' }]}>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '700', textAlign: 'center' }}>
            Добавь друзей, чтобы соревноваться
          </Text>
        </View>
      ) : (
        <View style={[glass, { borderRadius: 20, padding: 8 }]}>
          {entries.map((e, idx) => (
            <View key={e.user_id ?? idx} style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              padding: 10, borderRadius: 12,
              backgroundColor: e.is_me ? neon.greenHero : 'transparent',
            }}>
              <Text style={{ color: '#fff', fontWeight: '900', width: 28, fontSize: 14 }}>
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
              </Text>
              <Avatar uri={e.avatar_url} name={e.full_name} size={36} />
              <Text style={{ flex: 1, color: '#fff', fontWeight: e.is_me ? '900' : '700', fontSize: 14 }} numberOfLines={1}>
                {e.full_name}{e.is_me ? ' (Ты)' : ''}
              </Text>
              <Text style={{ color: '#FFD54F', fontWeight: '900' }}>{e.weekly_xp ?? 0} XP</Text>
            </View>
          ))}
        </View>
      )}
      <Pressable
        onPress={() => router.push('/friends/leaderboard')}
        style={[glass, { borderRadius: 16, padding: 14, alignItems: 'center', marginTop: 12 }]}
      >
        <Text style={{ color: '#FFD84A', fontWeight: '900' }}>Открыть полный лидерборд →</Text>
      </Pressable>
    </ScrollView>
  );
}
