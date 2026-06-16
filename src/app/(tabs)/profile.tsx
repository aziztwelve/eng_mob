import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLogout, useCurrentUser } from '@/hooks/use-auth';
import { useUserStats } from '@/hooks/use-user-stats';
import { useDailyGoal } from '@/hooks/use-daily-goal';
import { useMyAchievements, useAchievements } from '@/hooks/use-achievements';
import { useOnboardingState } from '@/hooks/use-onboarding';
import { DailyGoalRing } from '@/components/gamification';
import { tsToDate } from '@/lib/api-client';
import { languageNameForUi, type UiLanguage } from '@/lib/supported-languages';
import { glass, GOLD, SunsetHeader, SunsetSubhead, CtaButton } from '@/components/sunset';

/** Человекочитаемый уровень из значения онбординга (CEFR / слово). */
function levelText(level?: string | null): string {
  if (!level) return '';
  const cefr = ['a1', 'a2', 'b1', 'b2', 'c1'];
  if (cefr.includes(level)) return level.toUpperCase();
  if (level === 'beginner') return 'Beginner';
  if (level === 'just_for_fun') return '';
  return level.toUpperCase();
}

/** Сужает код UI-локали до поддерживаемого набора. */
function uiLang(code?: string): UiLanguage {
  const c = (code ?? 'ru').slice(0, 2).toLowerCase();
  return c === 'en' || c === 'kk' ? (c as UiLanguage) : 'ru';
}

function streakSuffix(streak: number): string {
  const mod10 = streak % 10;
  const mod100 = streak % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дня';
  return 'дней';
}

const MENU = [
  { emoji: '📊', label: 'Статистика',   href: '/profile/stats' },
  { emoji: '🔥', label: 'Серия',        href: '/profile/streak' },
  { emoji: '💪', label: 'Сила навыков', href: '/profile/strength' },
  { emoji: '🔔', label: 'Уведомления',  href: '/profile/notifications' },
  { emoji: '⚙️', label: 'Настройки',    href: '/profile/settings' },
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const logout = useLogout();
  const { data: user } = useCurrentUser();
  const { data: stats } = useUserStats();
  const { data: dailyGoal } = useDailyGoal();
  const { data: onboarding } = useOnboardingState();
  const mine = useMyAchievements();
  const all = useAchievements();

  const unlocked = useMemo(() => {
    return (mine.data?.achievements ?? [])
      .slice()
      .sort((a, b) => {
        const da = tsToDate(a.unlocked_at)?.getTime() ?? 0;
        const db = tsToDate(b.unlocked_at)?.getTime() ?? 0;
        return db - da;
      })
      .slice(0, 4);
  }, [mine.data]);

  // Реальные «ещё не открытые» достижения: каталог минус уже полученные.
  const locked = useMemo(() => {
    const unlockedIds = new Set(
      (mine.data?.achievements ?? []).map((ua) => ua.achievement.id),
    );
    return (all.data?.achievements ?? [])
      .filter((a) => !unlockedIds.has(a.id))
      .slice(0, 6);
  }, [all.data, mine.data]);

  const streak = stats?.current_streak ?? 0;

  // Дневная цель — из реального daily-goal (today), а не из weekly_xp.
  const xpGoal = dailyGoal?.target_xp ?? dailyGoal?.today?.goal ?? 20;
  const xpToday = dailyGoal?.today?.xp_earned ?? 0;
  const xpLeft = Math.max(0, xpGoal - xpToday);
  const goalDone = xpToday >= xpGoal;

  // Язык + уровень — из состояния онбординга (backend SoT), не статика.
  const ui = uiLang(i18n.language);
  const langName = onboarding?.target_language
    ? languageNameForUi(onboarding.target_language, ui)
    : '';
  const lvl = levelText(onboarding?.level);
  const streakPart =
    streak > 0
      ? `в строю ${streak} ${streakSuffix(streak)} 🔥`
      : 'Начни серию!';
  const subtitle = [langName, lvl, streakPart].filter(Boolean).join(' · ');

  const displayName = user?.name || user?.username || 'Ученик';

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 + insets.bottom }}
      >
        <SunsetHeader title="Профиль" />

        {/* Identity card */}
        <View style={[glass, { borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 18 }]}>
          <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 76, height: 76, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 38 }}>🦉</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 21 }}>
              {displayName}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, fontWeight: '600', marginTop: 3 }}>
              {subtitle}
            </Text>
          </View>
        </View>

        {/* Daily goal card */}
        <View style={[glass, { borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 14 }]}>
          <DailyGoalRing size={120} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>
              {goalDone ? 'Цель дня выполнена! 🎉' : 'Цель дня почти готова!'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, fontWeight: '600', marginTop: 4 }}>
              {goalDone ? 'Отличная работа!' : `Ещё ${xpLeft} XP до награды`}
            </Text>
            {!goalDone && (
              <View style={{ marginTop: 12 }}>
                <CtaButton label="Добить цель" onPress={() => router.push('/(tabs)/practice')} />
              </View>
            )}
          </View>
        </View>

        {/* Achievements */}
        <SunsetSubhead title="Достижения" linkLabel="Все →" onLink={() => router.push('/profile/achievements')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {unlocked.map((ua) => (
            <View key={ua.achievement.id} style={[glass, { width: 72, height: 84, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 10, gap: 4 }]}>
              <Text style={{ fontSize: 26 }}>🏅</Text>
              <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 10, fontWeight: '800', textAlign: 'center' }} numberOfLines={2}>
                {ua.achievement.title}
              </Text>
            </View>
          ))}
          {locked.map((a) => (
            <View key={a.id} style={[glass, { width: 72, height: 84, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 10, gap: 4, opacity: 0.45 }]}>
              <Text style={{ fontSize: 26 }}>🔒</Text>
              <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 10, fontWeight: '800', textAlign: 'center' }} numberOfLines={2}>
                {a.title}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Menu */}
        <View style={{ gap: 12, marginTop: 22 }}>
          {MENU.map((item) => (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href as any)}
              style={[glass, { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14, borderRadius: 20 }]}
            >
              <View style={{
                width: 48, height: 48, borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
              </View>
              <Text style={{ flex: 1, color: '#fff', fontWeight: '800', fontSize: 15 }}>{item.label}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 22 }}>›</Text>
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable
          onPress={() => logout.mutate()}
          disabled={logout.isPending}
          style={[glass, {
            borderRadius: 16, paddingVertical: 14, alignItems: 'center',
            borderColor: 'rgba(255,111,160,0.4)', marginTop: 16,
          }]}
        >
          <Text style={{ color: '#FF6FA0', fontWeight: '900', fontSize: 15 }}>
            {logout.isPending ? 'Выходим...' : 'Выйти из аккаунта'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
